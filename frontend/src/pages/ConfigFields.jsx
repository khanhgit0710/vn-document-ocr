import React from 'react';
import { Plus } from 'lucide-react';

export default function ConfigFields() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cấu hình Trường Thông Tin</h2>
          <p className="text-slate-500 mt-1">Định nghĩa các trường dữ liệu cần trích xuất</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary-hover font-medium rounded-md shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> Thêm trường mới
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-medium">Tên Trường</th>
              <th className="px-6 py-4 font-medium">Kiểu dữ liệu</th>
              <th className="px-6 py-4 font-medium">Bắt buộc</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {['Số văn bản', 'Cơ quan ban hành', 'Ngày tháng năm ký', 'Người ký'].map((field, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800">{field}</td>
                <td className="px-6 py-4 text-slate-500">Text</td>
                <td className="px-6 py-4 text-slate-500">{i % 2 === 0 ? 'Có' : 'Không'}</td>
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
