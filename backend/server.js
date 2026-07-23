require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
// Serve uploaded files statically so frontend can display them (e.g., in an iframe)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads dir exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Setup Multer for file uploads (initial temp location)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage });

// Setup SQLite DB
const dbFile = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    // Documents table
    db.run(`CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        original_name TEXT,
        filename TEXT,
        mime_type TEXT,
        extracted_data TEXT,
        status TEXT DEFAULT 'PENDING',
        document_type TEXT DEFAULT 'other',
        assigned_to TEXT,
        step TEXT DEFAULT 'CHO_PHAN_LOAI',
        is_seen INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Add new columns if table existed before
    db.run(`ALTER TABLE documents ADD COLUMN document_type TEXT DEFAULT 'other'`, (err) => {});
    db.run(`ALTER TABLE documents ADD COLUMN assigned_to TEXT`, (err) => {});
    db.run(`ALTER TABLE documents ADD COLUMN step TEXT DEFAULT 'CHO_PHAN_LOAI'`, (err) => {});
    db.run(`ALTER TABLE documents ADD COLUMN is_seen INTEGER DEFAULT 0`, (err) => {});

    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT,
        name TEXT,
        role TEXT
    )`);

    // Insert mock users if they don't exist
    const insertUser = db.prepare(`INSERT OR IGNORE INTO users (id, username, password, name, role) VALUES (?, ?, ?, ?, ?)`);
    insertUser.run('u1', 'admin', '1234', 'Admin User', 'ADMIN');
    insertUser.run('u2', 'phanloai1', '1234', 'Nhân viên Phân Loại 1', 'PHAN_LOAI');
    insertUser.run('u3', 'kiemtra1', '1234', 'Nhân viên Kiểm Tra 1', 'KIEM_TRA');
    insertUser.run('u4', 'duyet1', '1234', 'Giám đốc Duyệt', 'DUYET');
    insertUser.finalize();
});

// Setup Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function fileToGenerativePart(filePath, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType
        },
    };
}

// Utility to normalize folder name
function normalizeFolderName(name) {
    if (!name) return 'khac';
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

// Login API
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT id, username, name, role FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(401).json({ error: 'Invalid credentials' });
        res.json({ user: row });
    });
});

// Get users API
app.get('/api/users', (req, res) => {
    db.all(`SELECT id, username, name, role FROM users`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// Upload & OCR endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const tempFilePath = req.file.path;
        const mimeType = req.file.mimetype;
        const id = uuidv4();

        console.log(`Received file: ${req.file.originalname} (${mimeType})`);

        // Prepare the model
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `You are a high-precision data extraction AI. Extract the following 8 fields from this document exactly as specified.
CRITICAL RULE: For printed text (chữ đánh máy), you MUST transcribe the text with 100% accuracy, character by character. Do NOT autocorrect, do NOT guess, and do NOT alter the original text. For handwritten text (chữ viết tay), extract it as accurately as possible.

1. "trang_so_van_ban" (Trang số văn bản / Document page number)
2. "co_quan_ban_hanh" (Cơ quan ban hành / Issuing agency, ví dụ: ỦY BAN NHÂN DÂN THỊ XÃ HÀ TIÊN)
3. "so_van_ban" (Số văn bản, ví dụ: 13)
4. "ky_hieu_van_ban" (Ký hiệu văn bản, ví dụ: /QĐ-UB)
5. "ngay_thang_nam_ky" (Ngày tháng năm ký, ví dụ: ngày 24 tháng 01 năm 2000)
6. "ten_loai_van_ban" (Tên loại văn bản, ví dụ: QUYẾT ĐỊNH CỦA UBND THỊ XÃ HÀ TIÊN, Tờ trình, Thông báo...)
7. "noi_dung_van_ban" (Nội dung văn bản / Trích yếu, ví dụ: V/v xử phạt vi phạm hành chính...)
8. "muc_do_tin_cay" (Mức độ tin cậy - Kiểm tra phần chữ ký và con dấu đỏ ở cuối văn bản để đánh giá, ví dụ: Có mộc đỏ và chữ ký / Độ tin cậy cao)

Return the result ONLY as a raw JSON object, without any markdown formatting like \`\`\`json or \`\`\`.
If you can't read it, return a JSON with a single key "error".`;

        const documentPart = fileToGenerativePart(tempFilePath, mimeType);

        console.log("Sending to Gemini 1.5 Flash...");
        const result = await model.generateContent([prompt, documentPart]);
        let text = result.response.text();
        
        // Clean up markdown if AI still outputs it
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let extractedData;
        try {
            extractedData = JSON.parse(text);
            console.log("Successfully parsed JSON.");
        } catch (e) {
            console.error("Failed to parse JSON:", text);
            extractedData = { raw_text: text, parse_error: true };
        }

        // Determine folder and move file
        const docTypeName = extractedData.ten_loai_van_ban || 'Khac';
        const folderName = normalizeFolderName(docTypeName);
        const targetDir = path.join(uploadDir, folderName);
        
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        const finalFilename = folderName + '/' + req.file.filename;
        const finalFilePath = path.join(targetDir, req.file.filename);
        
        // Move the file physically
        fs.renameSync(tempFilePath, finalFilePath);

        // Save to DB
        const stmt = db.prepare(`INSERT INTO documents (id, original_name, filename, mime_type, extracted_data, document_type, step) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        stmt.run([id, req.file.originalname, finalFilename, mimeType, JSON.stringify(extractedData), docTypeName, 'CHO_PHAN_LOAI'], function(err) {
            if (err) {
                console.error("DB Error:", err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({
                id,
                original_name: req.file.originalname,
                extracted_data: extractedData,
                step: 'CHO_PHAN_LOAI',
                filename: finalFilename
            });
        });
        stmt.finalize();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// List all documents
app.get('/api/documents', (req, res) => {
    const query = `
        SELECT d.id, d.original_name, d.filename, d.mime_type, d.created_at, d.extracted_data, d.status, d.step, d.is_seen, d.assigned_to, u.name as assigned_name 
        FROM documents d
        LEFT JOIN users u ON d.assigned_to = u.id
        ORDER BY d.created_at DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const docs = rows.map(row => ({
            ...row,
            extracted_data: JSON.parse(row.extracted_data)
        }));
        res.json(docs);
    });
});

// Get document details
app.get('/api/documents/:id', (req, res) => {
    const query = `
        SELECT d.*, u.name as assigned_name 
        FROM documents d
        LEFT JOIN users u ON d.assigned_to = u.id
        WHERE d.id = ?
    `;
    db.get(query, [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json({
            ...row,
            extracted_data: JSON.parse(row.extracted_data)
        });
    });
});

// Update document data and status
app.put('/api/documents/:id', (req, res) => {
    const { status, step, is_seen, assigned_to, extracted_data } = req.body;
    
    // Build query based on provided fields
    let updates = [];
    let params = [];
    
    if (status !== undefined) {
        updates.push("status = ?");
        params.push(status);
    }
    
    if (step !== undefined) {
        updates.push("step = ?");
        params.push(step);
    }
    
    if (is_seen !== undefined) {
        updates.push("is_seen = ?");
        params.push(is_seen ? 1 : 0);
    }
    
    if (assigned_to !== undefined) {
        updates.push("assigned_to = ?");
        params.push(assigned_to);
    }
    
    if (extracted_data !== undefined) {
        updates.push("extracted_data = ?");
        params.push(JSON.stringify(extracted_data));
        
        // Also update document_type if it was changed during classification
        if (extracted_data.ten_loai_van_ban) {
            updates.push("document_type = ?");
            params.push(extracted_data.ten_loai_van_ban);
            // Note: we aren't physically moving the file again here for simplicity,
            // but in a production app we might want to if the type changes.
        }
    }
    
    if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(req.params.id);
    
    const query = `UPDATE documents SET ${updates.join(', ')} WHERE id = ?`;
    
    db.run(query, params, function(err) {
        if (err) {
            console.error("Update Error:", err);
            return res.status(500).json({ error: 'Database update error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json({ success: true, changes: this.changes });
    });
});

app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});
