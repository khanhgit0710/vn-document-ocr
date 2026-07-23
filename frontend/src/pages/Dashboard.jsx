import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const { user } = useAuth();
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

  const getFilteredDocs = () => {
    if (!user) return [];
    if (user.role === 'ADMIN') return documents;
    if (user.role === 'PHAN_LOAI') return documents.filter(d => d.step === 'CHO_PHAN_LOAI');
    if (user.role === 'KIEM_TRA') return documents.filter(d => d.step === 'CHO_KIEM_TRA');
    if (user.role === 'DUYET') return documents.filter(d => d.step === 'CHO_DUYET');
    return [];
  };

  const filteredDocs = getFilteredDocs();

  const stepCount = { 'CHO_PHAN_LOAI': 0, 'CHO_KIEM_TRA': 0, 'CHO_DUYET': 0, 'DA_DUYET': 0, 'LOI': 0 };
  documents.forEach(doc => {
    const step = doc.step || 'CHO_PHAN_LOAI';
    if (stepCount[step] !== undefined) stepCount[step]++;
  });

  const stats = [
    { name: 'Chờ Phân Loại', value: stepCount.CHO_PHAN_LOAI.toString(), icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Chờ Kiểm Tra', value: stepCount.CHO_KIEM_TRA.toString(), icon: FileText, color: 'text-amber-600', bg: 'bg-amber-100' },
    { name: 'Chờ Duyệt', value: stepCount.CHO_DUYET.toString(), icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'Đã Duyệt', value: stepCount.DA_DUYET.toString(), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  const getStepBadge = (step) => {
    switch (step) {
      case 'CHO_PHAN_LOAI': return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">CHỜ PHÂN LOẠI</span>;
      case 'CHO_KIEM_TRA': return <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">CHỜ KIỂM TRA</span>;
      case 'CHO_DUYET': return <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold">CHỜ DUYỆT</span>;
      case 'DA_DUYET': return <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-bold">ĐÃ DUYỆT</span>;
      case 'LOI': return <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">CÓ LỖI</span>;
      default: return null;
    }
  };

  const handleAction = (doc) => {
    if (user.role === 'PHAN_LOAI') navigate('/classification', { state: { document: doc } });
    else if (user.role === 'KIEM_TRA') navigate('/check', { state: { document: doc } });
    else if (user.role === 'DUYET') navigate('/approval', { state: { document: doc } });
    else navigate(`/document/${doc.id}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tổng quan hệ thống</h2>
          <p className="text-slate-500 mt-1">Xin chào {user?.name}, theo dõi tình trạng xử lý tài liệu hôm nay</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Công việc của bạn {user?.role !== 'ADMIN' && `(${filteredDocs.length})`}
        </h3>
        <div className="space-y-4">
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-medium text-slate-800 flex items-center gap-2">
                    <button onClick={() => handleAction(doc)} className="font-semibold text-primary hover:underline text-left">
                      {doc.original_name}
                    </button> 
                    {getStepBadge(doc.step)}
                    {doc.is_seen === 0 && <span className="px-2 py-0.5 rounded bg-pink-100 text-pink-700 text-[10px] font-bold animate-pulse">MỚI</span>}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Thư mục: {doc.document_type || 'Khác'} | Cập nhật lúc: {new Date(doc.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              <div>
                {user?.role !== 'ADMIN' && (
                   <button onClick={() => handleAction(doc)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-md transition-colors">
                     Xử lý ngay
                   </button>
                )}
              </div>
            </div>
          ))}
          {filteredDocs.length === 0 && (
            <div className="text-sm text-slate-500 italic">Không có công việc nào đang chờ bạn xử lý.</div>
          )}
        </div>
      </div>
    </div>
  );
}
