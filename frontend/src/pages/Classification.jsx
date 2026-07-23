import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Loader2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_URL || 'http://localhost:8000/uploads';

export default function Classification() {
  const location = useLocation();
  const navigate = useNavigate();
  const document = location.state?.document;

  const [docType, setDocType] = useState(document?.extracted_data?.ten_loai_van_ban || 'Quyết định');
  const [isSaving, setIsSaving] = useState(false);
  const [isErroring, setIsErroring] = useState(false);

  // Field states
  const [soVanBan, setSoVanBan] = useState(document?.extracted_data?.so_van_ban || '');
  const [coQuanBanHanh, setCoQuanBanHanh] = useState(document?.extracted_data?.co_quan_ban_hanh || '');
  const [ngayKy, setNgayKy] = useState(document?.extracted_data?.ngay_thang_nam_ky || '');
  const [nguoiKy, setNguoiKy] = useState(document?.extracted_data?.nguoi_ky || ''); // If not extracted by AI, user can add

  useEffect(() => {
    if (document && document.is_seen === 0) {
      // Mark as seen
      axios.put(`${API_BASE_URL}/documents/${document.id}`, { is_seen: 1 })
        .catch(err => console.error("Could not mark as seen", err));
    }
  }, [document]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedData = {
        ...document.extracted_data,
        ten_loai_van_ban: docType,
        so_van_ban: soVanBan,
        co_quan_ban_hanh: coQuanBanHanh,
        ngay_thang_nam_ky: ngayKy,
        nguoi_ky: nguoiKy
      };

      await axios.put(`${API_BASE_URL}/documents/${document.id}`, {
        step: 'CHO_KIEM_TRA',
        is_seen: 0, // Reset for next person
        extracted_data: updatedData
      });
      
      toast.success('Phân loại tài liệu thành công!');
      navigate('/');
    } catch (error) {
      console.error("Lỗi khi lưu phân loại:", error);
      toast.error('Có lỗi xảy ra khi lưu phân loại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleError = async () => {
    setIsErroring(true);
    try {
      await axios.put(`${API_BASE_URL}/documents/${document.id}`, {
        step: 'LOI',
        is_seen: 0 // Reset for whoever fixes it
      });
      
      toast.success('Đã báo lỗi tài liệu!');
      navigate('/');
    } catch (error) {
      console.error("Lỗi khi báo lỗi:", error);
      toast.error('Có lỗi xảy ra.');
    } finally {
      setIsErroring(false);
    }
  };

  // Handle case where accessed directly without document state
  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <p className="text-slate-500">Chưa chọn tài liệu nào để phân loại.</p>
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
            <h2 className="text-2xl font-bold text-slate-800">Phân loại tài liệu</h2>
            <p className="text-slate-500 text-sm mt-1">{document.original_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleError}
            disabled={isErroring || isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 font-medium rounded-md transition-colors disabled:opacity-50"
          >
            {isErroring ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            Báo lỗi
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || isErroring}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary-hover font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Hoàn thành Phân loại
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

        {/* Right Side: Classification Form */}
        <div className="w-[450px] bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/80">
            <h3 className="font-semibold text-slate-800">Thông tin phân loại</h3>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Loại giấy tờ</label>
              <select 
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              >
                <option value="Quyết định">Quyết định</option>
                <option value="Tờ trình">Tờ trình</option>
                <option value="Thông báo">Thông báo</option>
                <option value="Công văn">Công văn</option>
                <option value="Giấy khai sinh">Giấy khai sinh</option>
              </select>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Trường thông tin chi tiết</h4>
              
              <FieldInput label="Số văn bản" value={soVanBan} onChange={setSoVanBan} />
              <FieldInput label="Cơ quan ban hành" value={coQuanBanHanh} onChange={setCoQuanBanHanh} />
              <FieldInput label="Ngày ký" value={ngayKy} onChange={setNgayKy} />
              <FieldInput label="Người ký" value={nguoiKy} onChange={setNguoiKy} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component
function FieldInput({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
      />
    </div>
  );
}

