import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Summary() {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/documents`);
      // Only show APPROVED documents in the Summary table, but we can chart everything
      setDocuments(res.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const approvedDocs = documents.filter(d => d.step === 'DA_DUYET');

  // Prepare data for PieChart (By Type for approved docs)
  const typeCount = {};
  approvedDocs.forEach(doc => {
    const type = doc.extracted_data?.ten_loai_van_ban || 'Chưa phân loại';
    typeCount[type] = (typeCount[type] || 0) + 1;
  });
  const pieData = Object.keys(typeCount).map(key => ({ name: key, value: typeCount[key] }));

  // Prepare data for BarChart (By Step for all docs)
  const stepCount = { 'CHO_PHAN_LOAI': 0, 'CHO_KIEM_TRA': 0, 'CHO_DUYET': 0, 'DA_DUYET': 0, 'LOI': 0 };
  documents.forEach(doc => {
    const step = doc.step || 'CHO_PHAN_LOAI';
    if (stepCount[step] !== undefined) stepCount[step]++;
  });
  const barData = [
    { name: 'Chờ phân loại', count: stepCount.CHO_PHAN_LOAI },
    { name: 'Chờ kiểm tra', count: stepCount.CHO_KIEM_TRA },
    { name: 'Chờ duyệt', count: stepCount.CHO_DUYET },
    { name: 'Đã duyệt', count: stepCount.DA_DUYET },
    { name: 'Từ chối / Lỗi', count: stepCount.LOI },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tổng hợp kết quả phân loại</h2>
          <p className="text-slate-500 mt-1">Thống kê và xuất dữ liệu báo cáo</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-md shadow-sm transition-colors">
          <Download className="w-4 h-4" /> Xuất Excel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col min-h-[300px]">
          <h3 className="font-semibold text-slate-800 mb-4 text-center">Phân bổ loại giấy tờ (Đã duyệt)</h3>
          <div className="flex-1 min-h-[250px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">Chưa có dữ liệu</div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col min-h-[300px]">
          <h3 className="font-semibold text-slate-800 mb-4 text-center">Tiến độ xử lý văn bản</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Chi tiết tài liệu đã duyệt ({approvedDocs.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Tên File</th>
                <th className="px-6 py-4 font-medium">Loại giấy tờ</th>
                <th className="px-6 py-4 font-medium">Số văn bản</th>
                <th className="px-6 py-4 font-medium">Cơ quan ban hành</th>
                <th className="px-6 py-4 font-medium">Ngày tải lên</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {approvedDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-primary">
                    <Link to={`/document/${doc.id}`} className="truncate block max-w-[200px] hover:underline" title={doc.original_name}>{doc.original_name}</Link>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{doc.extracted_data?.ten_loai_van_ban || '-'}</td>
                  <td className="px-6 py-4 text-slate-700">{doc.extracted_data?.so_van_ban || '-'}</td>
                  <td className="px-6 py-4 text-slate-700">
                    <span className="truncate block max-w-[200px]" title={doc.extracted_data?.co_quan_ban_hanh}>
                      {doc.extracted_data?.co_quan_ban_hanh || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(doc.created_at).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))}
              {approvedDocs.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    Chưa có tài liệu nào được duyệt.
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
