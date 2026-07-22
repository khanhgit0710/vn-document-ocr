import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8000/api';

export default function Approval() {
  const [documents, setDocuments] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/documents`);
      setDocuments(res.data.filter(doc => doc.status === 'CLASSIFIED'));
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const handleUpdateStatus = async (id, status, message) => {
    setProcessingId(id);
    try {
      await axios.put(`${API_BASE_URL}/documents/${id}`, { status });
      toast.success(message);
      fetchDocuments();
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Duyệt phân loại</h2>
        <p className="text-slate-500 mt-1">Phê duyệt kết quả phân loại tài liệu</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-semibold text-slate-800">Tài liệu chờ duyệt ({documents.length})</h3>
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
                <th className="px-6 py-4 font-medium">Người trình duyệt</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-primary flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <Link to={`/document/${doc.id}`} className="truncate max-w-[250px] hover:underline">{doc.original_name}</Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{doc.extracted_data?.ten_loai_van_ban || 'Chưa xác định'}</td>
                  <td className="px-6 py-4 text-slate-700">Hệ thống AI</td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button 
                      onClick={() => handleUpdateStatus(doc.id, 'REJECTED', 'Đã từ chối tài liệu')}
                      disabled={processingId === doc.id}
                      className="flex items-center gap-1 text-red-600 hover:bg-red-50 font-medium px-3 py-1.5 rounded transition-colors border border-transparent hover:border-red-200 disabled:opacity-50"
                    >
                      {processingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Từ chối
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(doc.id, 'APPROVED', 'Đã phê duyệt tài liệu thành công!')}
                      disabled={processingId === doc.id}
                      className="flex items-center gap-1 text-green-600 hover:bg-green-50 font-medium px-3 py-1.5 rounded transition-colors border border-transparent hover:border-green-200 disabled:opacity-50"
                    >
                      {processingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Duyệt
                    </button>
                  </td>
                </tr>
              ))}
              {documents.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                    Không có tài liệu nào chờ duyệt.
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
