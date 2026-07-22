import React from 'react';
import { Plus } from 'lucide-react';

export default function ConfigTypes() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cấu hình Loại Giấy Tờ</h2>
          <p className="text-slate-500 mt-1">Quản lý các loại giấy tờ trong hệ thống</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary-hover font-medium rounded-md shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> Thêm loại mới
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-medium">Tên Loại Giấy Tờ</th>
              <th className="px-6 py-4 font-medium">Mã Loại</th>
              <th className="px-6 py-4 font-medium">Trạng Thái</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {['Quyết định', 'Tờ trình', 'Thông báo', 'Công văn'].map((type, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800">{type}</td>
                <td className="px-6 py-4 text-slate-500">TYPE_{i+1}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Đang sử dụng
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-primary hover:underline font-medium">Sửa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
