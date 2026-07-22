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

// Setup Multer for file uploads
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
    db.run(`CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        original_name TEXT,
        filename TEXT,
        mime_type TEXT,
        extracted_data TEXT,
        status TEXT DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Try to add status column if it doesn't exist (for existing databases)
    db.run(`ALTER TABLE documents ADD COLUMN status TEXT DEFAULT 'PENDING'`, (err) => {
        // Ignore error if column already exists
    });
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

// Upload & OCR endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
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
6. "ten_loai_van_ban" (Tên loại văn bản, ví dụ: QUYẾT ĐỊNH CỦA UBND THỊ XÃ HÀ TIÊN)
7. "noi_dung_van_ban" (Nội dung văn bản / Trích yếu, ví dụ: V/v xử phạt vi phạm hành chính...)
8. "muc_do_tin_cay" (Mức độ tin cậy - Kiểm tra phần chữ ký và con dấu đỏ ở cuối văn bản để đánh giá, ví dụ: Có mộc đỏ và chữ ký / Độ tin cậy cao)

Return the result ONLY as a raw JSON object, without any markdown formatting like \`\`\`json or \`\`\`.
If you can't read it, return a JSON with a single key "error".`;

        const documentPart = fileToGenerativePart(filePath, mimeType);

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

        // Save to DB
        const stmt = db.prepare(`INSERT INTO documents (id, original_name, filename, mime_type, extracted_data) VALUES (?, ?, ?, ?, ?)`);
        stmt.run([id, req.file.originalname, req.file.filename, mimeType, JSON.stringify(extractedData)], function(err) {
            if (err) {
                console.error("DB Error:", err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({
                id,
                original_name: req.file.originalname,
                extracted_data: extractedData
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
    db.all(`SELECT id, original_name, filename, mime_type, created_at, extracted_data, status FROM documents ORDER BY created_at DESC`, [], (err, rows) => {
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
    db.get(`SELECT * FROM documents WHERE id = ?`, [req.params.id], (err, row) => {
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
    const { status, extracted_data } = req.body;
    
    // Build query based on provided fields
    let updates = [];
    let params = [];
    
    if (status !== undefined) {
        updates.push("status = ?");
        params.push(status);
    }
    
    if (extracted_data !== undefined) {
        updates.push("extracted_data = ?");
        params.push(JSON.stringify(extracted_data));
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
