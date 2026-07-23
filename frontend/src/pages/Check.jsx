import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, CheckCircle, AlertCircle, Loader2, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_URL || 'http://localhost:8000/uploads';

export default function Check() {
  const location = useLocation();
  const navigate = useNavigate();
  const document = location.state?.document;

  const [isProcessing, setIsProcessing] = useState(false);
  const [isErroring, setIsErroring] = useState(false);

  useEffect(() => {
    if (document && document.is_seen === 0) {
      axios.put(`${API_BASE_URL}/documents/${document.id}`, { is_seen: 1 })
        .catch(err => console.error("Could not mark as seen", err));
    }
  }, [document]);

  const handleUpdateStep = async (step, message, setErroringState = false) => {
    if (setErroringState) setIsErroring(true);
    else setIsProcessing(true);
    
    try {
      await axios.put(`${API_BASE_URL}/documents/${document.id}`, { 
        step,
        is_seen: 0 
      });
      toast.success(message);
      navigate('/');
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      if (setErroringState) setIsErroring(false);
      else setIsProcessing(false);
    }
  };

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <p className="text-slate-500">Chưa chọn tài liệu nào để kiểm tra.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-primary text-white rounded-md"
        >
          Quay về Bảng Điều Khiển
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
            <h2 className="text-2xl font-bold text-slate-800">Kiểm tra dữ liệu</h2>
            <p className="text-slate-500 text-sm mt-1">{document.original_name}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleUpdateStep('LOI', 'Đã báo lỗi tài liệu!', true)}
            disabled={isProcessing || isErroring}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
          >
            {isErroring ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />} Báo lỗi
          </button>
          <button 
            onClick={() => handleUpdateStep('CHO_DUYET', 'Đã xác nhận dữ liệu hợp lệ!')}
            disabled={isProcessing || isErroring}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary-hover font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Xác nhận đúng
          </button>
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

        {/* Right Side: Form */}
        <div className="w-[450px] bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/80">
            <h3 className="font-semibold text-slate-800">Kết quả bóc tách (AI)</h3>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            <FieldInput label="Cơ quan ban hành" value={document.extracted_data?.co_quan_ban_hanh} />
            <FieldInput label="Số văn bản" value={document.extracted_data?.so_van_ban} />
            <FieldInput label="Ký hiệu văn bản" value={document.extracted_data?.ky_hieu_van_ban} />
            <FieldInput label="Ngày tháng năm ký" value={document.extracted_data?.ngay_thang_nam_ky} />
            <FieldInput label="Tên loại văn bản" value={document.extracted_data?.ten_loai_van_ban} />
            <FieldTextarea label="Nội dung văn bản" value={document.extracted_data?.noi_dung_van_ban} />
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500">Mức độ tin cậy AI: </span>
              <span className="text-xs font-bold text-green-600">{document.extracted_data?.muc_do_tin_cay || 'Cao'}</span>
            </div>
          </div>
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
        readOnly
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-800 focus:outline-none bg-slate-50"
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
        readOnly
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-800 focus:outline-none bg-slate-50 resize-none"
      />
    </div>
  );
}
