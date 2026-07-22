import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminUsers() {
  const { accounts, addAccount, removeAccount, user } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [message, setMessage] = useState(null);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newName) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin' });
      return;
    }

    const res = addAccount({ username: newUsername, password: newPassword, name: newName });
    if (res.success) {
      setMessage({ type: 'success', text: 'Thêm tài khoản thành công' });
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      setTimeout(() => {
        setShowForm(false);
        setMessage(null);
      }, 1500);
    } else {
      setMessage({ type: 'error', text: res.message });
    }
  };

  const handleRemove = (username) => {
    if (username === user.username) {
      alert("Không thể xóa tài khoản đang đăng nhập!");
      return;
    }
    if (window.confirm(`Bạn có chắc muốn xóa tài khoản ${username}?`)) {
      removeAccount(username);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quản lý Tài Khoản Admin</h2>
          <p className="text-slate-500 mt-1">Danh sách tài khoản có quyền truy cập hệ thống</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary-hover font-medium rounded-md shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Thêm tài khoản mới
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in slide-in-from-top-2">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Thêm tài khoản mới</h3>
          
          {message && (
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleAdd} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên hiển thị</label>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="VD: Quản trị viên 1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên đăng nhập</label>
              <input 
                type="text" 
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="VD: admin_1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="Nhập mật khẩu"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => { setShowForm(false); setMessage(null); }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-md transition-colors"
              >
                Hủy
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-primary text-white hover:bg-primary-hover font-medium rounded-md transition-colors"
              >
                Lưu tài khoản
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-medium">Tên hiển thị</th>
              <th className="px-6 py-4 font-medium">Tên đăng nhập</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {accounts.map((acc, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800">
                  {acc.name} {acc.username === user.username && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Bạn</span>}
                </td>
                <td className="px-6 py-4 text-slate-500">{acc.username}</td>
                <td className="px-6 py-4 text-right">
                  {acc.username !== user.username && (
                    <button 
                      onClick={() => handleRemove(acc.username)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors"
                      title="Xóa tài khoản"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
