import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { FileText, UploadCloud, Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8000/api';

export default function Upload() {
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/documents`);
      setDocuments(res.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      setUploadProgress(`Đang quét file ${i + 1}/${acceptedFiles.length} bằng AI...`);
      
      const formData = new FormData();
      formData.append('file', file);

      try {
        await axios.post(`${API_BASE_URL}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        successCount++;
        await fetchDocuments();
      } catch (error) {
        console.error(`Upload error cho file ${file.name}:`, error);
        failCount++;
      }
    }
    
    if (failCount === 0) {
      setUploadProgress(`Thành công quét ${successCount} file!`);
    } else {
      setUploadProgress(`Hoàn tất! Quét được ${successCount} file. Thất bại ${failCount} file.`);
    }
    setTimeout(() => setIsUploading(false), 3000);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Upload Tài Liệu</h2>
        <p className="text-slate-500 mt-1">Tải tệp lên hệ thống để bắt đầu quá trình xử lý</p>
      </div>

      {/* Upload Area */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Chọn hoặc kéo thả tệp</h3>
        
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-200 ${
            isDragActive ? 'border-primary bg-blue-50' : 'border-slate-300 hover:border-primary hover:bg-slate-50'
          } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
        >
          <input {...getInputProps()} />
          
          {isUploading ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              {uploadProgress.includes('Thành công') ? (
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              ) : uploadProgress.includes('Lỗi') || uploadProgress.includes('Thất bại') ? (
                <AlertCircle className="w-12 h-12 text-red-500" />
              ) : (
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              )}
              <p className="text-slate-600 font-medium">{uploadProgress}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <UploadCloud className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-slate-700 font-medium text-lg">Kéo thả file PDF hoặc Hình ảnh vào đây</p>
                <p className="text-slate-400 text-sm mt-1">hoặc click để chọn file từ máy tính</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* List View */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-semibold text-slate-800">Tài liệu đã tải lên ({documents.length})</h3>
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
                <th className="px-6 py-4 font-medium">Số văn bản</th>
                <th className="px-6 py-4 font-medium">Ngày tải lên</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map(doc => {
                const data = doc.extracted_data || {};
                return (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-primary flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <Link to={`/document/${doc.id}`} className="truncate max-w-[250px] hover:underline" title={doc.original_name}>{doc.original_name}</Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{data.so_van_ban || '-'}</td>
                    <td className="px-6 py-4 text-slate-700">
                      {new Date(doc.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate('/classification', { state: { document: doc } })}
                        className="text-primary hover:text-primary-hover font-medium bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors"
                      >
                        Tiến hành phân loại
                      </button>
                    </td>
                  </tr>
                );
              })}
              {documents.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                    Chưa có tài liệu nào được tải lên.
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
