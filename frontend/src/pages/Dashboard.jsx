import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);

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

  const statusCount = { 'PENDING': 0, 'CLASSIFIED': 0, 'APPROVED': 0, 'REJECTED': 0 };
  documents.forEach(doc => {
    const status = doc.status || 'PENDING';
    if (statusCount[status] !== undefined) statusCount[status]++;
  });

  const stats = [
    { name: 'Tổng số tài liệu', value: documents.length.toString(), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Đã phân loại / Chờ duyệt', value: statusCount.CLASSIFIED.toString(), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Chờ kiểm tra', value: statusCount.PENDING.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    { name: 'Bị từ chối (Cần sửa)', value: statusCount.REJECTED.toString(), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED': return <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-bold">ĐÃ DUYỆT</span>;
      case 'CLASSIFIED': return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">CHỜ DUYỆT</span>;
      case 'REJECTED': return <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">TỪ CHỐI</span>;
      default: return <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">CHỜ KIỂM TRA</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tổng quan hệ thống</h2>
          <p className="text-slate-500 mt-1">Theo dõi tình trạng xử lý tài liệu hôm nay</p>
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

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Hoạt động gần đây</h3>
        <div className="space-y-4">
          {documents.slice(0, 5).map((doc) => (
            <div key={doc.id} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Tài liệu <Link to={`/document/${doc.id}`} className="font-semibold text-primary hover:underline">{doc.original_name}</Link> 
                  <span className="ml-2">{getStatusBadge(doc.status)}</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">Cập nhật lúc: {new Date(doc.created_at).toLocaleString('vi-VN')}</p>
              </div>
            </div>
          ))}
          {documents.length === 0 && (
            <div className="text-sm text-slate-500 italic">Chưa có hoạt động nào.</div>
          )}
        </div>
      </div>
    </div>
  );
}
