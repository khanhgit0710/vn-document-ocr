import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Loader2, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api';
const UPLOADS_BASE_URL = 'http://localhost:8000/uploads';

export default function ViewDocument() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/documents/${id}`);
        setDocument(res.data);
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDocument();
  }, [id]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED': return <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-bold"><CheckCircle className="w-4 h-4"/> ĐÃ DUYỆT</span>;
      case 'CLASSIFIED': return <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-bold"><Clock className="w-4 h-4"/> CHỜ DUYỆT</span>;
      case 'REJECTED': return <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-bold"><AlertCircle className="w-4 h-4"/> TỪ CHỐI</span>;
      default: return <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-bold"><Clock className="w-4 h-4"/> CHỜ KIỂM TRA</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <p className="text-slate-500">Không tìm thấy tài liệu.</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-primary text-white rounded-md"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              Thông tin tài liệu
              {getStatusBadge(document.status)}
            </h2>
            <p className="text-slate-500 text-sm mt-1">{document.original_name}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Side: Document Preview */}
        <div className="flex-1 bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-700 flex items-center justify-center">
          {document.mime_type?.startsWith('image/') ? (
            <img 
              src={`${UPLOADS_BASE_URL}/${document.filename}`} 
              alt="Document" 
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <iframe 
              src={`${UPLOADS_BASE_URL}/${document.filename}`} 
              className="w-full h-full border-0 bg-white"
              title="Document Preview"
            />
          )}
        </div>

        {/* Right Side: Information Panel */}
        <div className="w-[450px] bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            <h3 className="font-semibold text-slate-800">Dữ liệu trích xuất</h3>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Ngày tải lên</p>
                <p className="text-sm font-medium text-slate-700 mt-1">{new Date(document.created_at).toLocaleString('vi-VN')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Độ tin cậy AI</p>
                <p className="text-sm font-bold text-green-600 mt-1">{document.extracted_data?.muc_do_tin_cay || 'Cao'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <FieldDisplay label="Loại giấy tờ" value={document.extracted_data?.ten_loai_van_ban} />
              <FieldDisplay label="Số văn bản" value={document.extracted_data?.so_van_ban} />
              <FieldDisplay label="Ký hiệu văn bản" value={document.extracted_data?.ky_hieu_van_ban} />
              <FieldDisplay label="Cơ quan ban hành" value={document.extracted_data?.co_quan_ban_hanh} />
              <FieldDisplay label="Ngày tháng năm ký" value={document.extracted_data?.ngay_thang_nam_ky} />
              <FieldDisplay label="Người ký" value={document.extracted_data?.nguoi_ky} />
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Trích yếu nội dung</label>
                <div className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-700 min-h-[100px] whitespace-pre-wrap">
                  {document.extracted_data?.noi_dung_van_ban || '-'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldDisplay({ label, value }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-700 font-medium">
        {value || '-'}
      </div>
    </div>
  );
}
