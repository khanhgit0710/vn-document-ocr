import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Search, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8000/api';
const UPLOADS_BASE_URL = 'http://localhost:8000/uploads';

export default function Check() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/documents`);
      // Only show PENDING documents in the Check list
      setDocuments(res.data.filter(doc => doc.status === 'PENDING' || !doc.status));
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const handleUpdateStatus = async (status, message) => {
    setIsProcessing(true);
    try {
      await axios.put(`${API_BASE_URL}/documents/${selectedDoc.id}`, { status });
      toast.success(message);
      setSelectedDoc(null);
      fetchDocuments();
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedDoc) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedDoc(null)}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
            >
              <span className="sr-only">Back</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Kiểm tra dữ liệu</h2>
              <p className="text-slate-500 text-sm mt-1">{selectedDoc.original_name}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => handleUpdateStatus('REJECTED', 'Đã báo lỗi tài liệu!')}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
            >
              <AlertCircle className="w-4 h-4" /> Báo lỗi
            </button>
            <button 
              onClick={() => handleUpdateStatus('CLASSIFIED', 'Đã xác nhận dữ liệu hợp lệ!')}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary-hover font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Xác nhận đúng
            </button>
          </div>
        </div>

        <div className="flex-1 flex gap-6 min-h-0">
          {/* Left Side: Document Preview */}
          <div className="flex-1 bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-700 flex items-center justify-center">
            {selectedDoc.mime_type?.startsWith('image/') ? (
              <img 
                src={`${UPLOADS_BASE_URL}/${selectedDoc.filename}`} 
                alt="Document" 
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <iframe 
                src={`${UPLOADS_BASE_URL}/${selectedDoc.filename}`} 
                className="w-full h-full border-0 bg-white"
                title="Document Preview"
              />
            )}
          </div>

          {/* Right Side: Form */}
          <div className="w-[450px] bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50/80">
              <h3 className="font-semibold text-slate-800">Kết quả bóc tách (AI)</h3>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <FieldInput label="Cơ quan ban hành" value={selectedDoc.extracted_data?.co_quan_ban_hanh} />
              <FieldInput label="Số văn bản" value={selectedDoc.extracted_data?.so_van_ban} />
              <FieldInput label="Ký hiệu văn bản" value={selectedDoc.extracted_data?.ky_hieu_van_ban} />
              <FieldInput label="Ngày tháng năm ký" value={selectedDoc.extracted_data?.ngay_thang_nam_ky} />
              <FieldInput label="Tên loại văn bản" value={selectedDoc.extracted_data?.ten_loai_van_ban} />
              <FieldTextarea label="Nội dung văn bản" value={selectedDoc.extracted_data?.noi_dung_van_ban} />
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-500">Mức độ tin cậy AI: </span>
                <span className="text-xs font-bold text-green-600">{selectedDoc.extracted_data?.muc_do_tin_cay || 'Cao'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Kiểm tra tài liệu</h2>
        <p className="text-slate-500 mt-1">Rà soát lại kết quả phân loại trước khi trình duyệt</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-semibold text-slate-800">Danh sách cần kiểm tra ({documents.length})</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-64"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Tên File</th>
                <th className="px-6 py-4 font-medium">Loại giấy tờ</th>
                <th className="px-6 py-4 font-medium">Trạng thái</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map(doc => {
                return (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-primary flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <Link to={`/document/${doc.id}`} className="truncate max-w-[250px] hover:underline">{doc.original_name}</Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{doc.extracted_data?.ten_loai_van_ban || 'Chưa xác định'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Chờ kiểm tra
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedDoc(doc)}
                        className="text-primary hover:text-primary-hover font-medium bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors"
                      >
                        Kiểm tra
                      </button>
                    </td>
                  </tr>
                );
              })}
              {documents.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                    Không có tài liệu nào cần kiểm tra.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper components
function FieldInput({ label, value }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{label}</label>
      <input 
        type="text" 
        defaultValue={value || ''} 
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
      />
    </div>
  );
}

function FieldTextarea({ label, value }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{label}</label>
      <textarea 
        defaultValue={value || ''} 
        rows={4}
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
      />
    </div>
  );
}
