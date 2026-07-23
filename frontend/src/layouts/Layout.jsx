import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Files, 
  FileSearch, 
  CheckCircle, 
  PieChart, 
  FileText, 
  Settings,
  Users,
  Menu,
  X,
  Bell,
  UserCircle,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import DocumentTreeSidebar from '../components/DocumentTreeSidebar';

const SIDEBAR_ITEMS = [
  { name: 'Trang chủ', path: '/', icon: LayoutDashboard },
  { name: 'Upload tài liệu', path: '/upload', icon: UploadCloud },
  { name: 'Phân loại tài liệu', path: '/classification', icon: Files },
  { name: 'Kiểm tra', path: '/check', icon: FileSearch },
  { name: 'Duyệt phân loại', path: '/approval', icon: CheckCircle },
  { name: 'Tổng hợp phân loại', path: '/summary', icon: PieChart },
];

const CONFIG_ITEMS = [
  { name: 'Loại giấy tờ', path: '/config-types', icon: FileText },
  { name: 'Trường thông tin', path: '/config-fields', icon: Settings },
  { name: 'Tài khoản Admin', path: '/admin-users', icon: Users },
];

export default function Layout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    return (
      <NavLink
        to={item.path}
        onClick={() => setIsMobileOpen(false)}
        title={isSidebarCollapsed ? item.name : ''}
        className={({ isActive }) =>
          `flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 mx-2 rounded-xl transition-all duration-200 font-medium ${
            isActive
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`
        }
      >
        <Icon className="w-5 h-5 shrink-0" />
        {!isSidebarCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 bg-white border-r border-slate-200 z-50 transform transition-all duration-300 ease-in-out flex flex-col ${
          isMobileOpen ? 'translate-x-0 w-72' : `-translate-x-full lg:translate-x-0 ${isSidebarCollapsed ? 'w-20' : 'w-72'}`
        }`}
      >
        <div className={`h-16 flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'} border-b border-slate-100 shrink-0 transition-all`}>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2 text-primary overflow-hidden">
              <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight whitespace-nowrap">VN Doc OCR</span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
            className="hidden lg:block text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
            title="Thu gọn Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600 p-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 space-y-8">
          <div>
            {!isSidebarCollapsed ? (
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-6">Quy trình xử lý</div>
            ) : (
              <div className="h-0 border-t border-slate-200 mx-4 mb-4 opacity-50" />
            )}
            <nav className="space-y-1">
              {SIDEBAR_ITEMS.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </nav>
          </div>

          <div>
            {!isSidebarCollapsed ? (
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-6">Cấu hình</div>
            ) : (
              <div className="h-0 border-t border-slate-200 mx-4 mb-4 opacity-50" />
            )}
            <nav className="space-y-1">
              {CONFIG_ITEMS.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 shrink-0">
          <div className={`flex items-center py-3 rounded-xl hover:bg-slate-100 transition-colors ${isSidebarCollapsed ? 'flex-col justify-center px-0 gap-2' : 'justify-between px-4 bg-slate-50'}`}>
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-3 overflow-hidden">
                <UserCircle className="w-8 h-8 text-slate-400 shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-slate-700 truncate">{user?.name || 'Admin User'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.username}</p>
                </div>
              </div>
            )}
            {isSidebarCollapsed && <UserCircle className="w-8 h-8 text-slate-400 shrink-0" />}
            <button 
              onClick={handleLogout}
              className={`p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 ${isSidebarCollapsed ? '' : ''}`}
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex min-w-0 h-screen overflow-hidden">
        
        {/* Document Tree Sidebar (Secondary Sidebar) */}
        <DocumentTreeSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
            <div className="flex items-center">
              <button 
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg mr-2 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-slate-800 hidden sm:block">Hệ thống chỉnh lý văn thư lưu trữ</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
            </div>
          </header>

          {/* Page Content wrapped in Outlet */}
          <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
