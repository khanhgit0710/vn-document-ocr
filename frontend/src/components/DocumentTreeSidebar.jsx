import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronDown, Folder, FileText, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function DocumentTreeSidebar() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState({});
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/documents`);
      setDocuments(res.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // Set up an interval to refresh the tree periodically
    const interval = setInterval(fetchDocuments, 10000);
    return () => clearInterval(interval);
  }, []);

  const getFilteredDocs = () => {
    if (!user) return [];
    if (user.role === 'ADMIN') return documents;
    if (user.role === 'PHAN_LOAI') return documents.filter(d => d.step === 'CHO_PHAN_LOAI');
    if (user.role === 'KIEM_TRA') return documents.filter(d => d.step === 'CHO_KIEM_TRA');
    if (user.role === 'DUYET') return documents.filter(d => d.step === 'CHO_DUYET');
    return documents;
  };

  const filteredDocs = getFilteredDocs();

  // Group by document_type
  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    const type = doc.document_type || 'Khác';
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {});

  // Expand folders by default
  useEffect(() => {
    if (Object.keys(groupedDocs).length > 0 && Object.keys(expandedFolders).length === 0) {
      const initialExpanded = {};
      Object.keys(groupedDocs).forEach(folder => {
        initialExpanded[folder] = true;
      });
      setExpandedFolders(initialExpanded);
    }
  }, [groupedDocs]);

  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  const handleFileClick = (doc) => {
    if (user?.role === 'PHAN_LOAI') navigate('/classification', { state: { document: doc } });
    else if (user?.role === 'KIEM_TRA') navigate('/check', { state: { document: doc } });
    else if (user?.role === 'DUYET') navigate('/approval', { state: { document: doc } });
    else navigate(`/document/${doc.id}`, { state: { document: doc } });
  };

  const getStepColor = (step) => {
    switch (step) {
      case 'CHO_PHAN_LOAI': return 'bg-blue-500';
      case 'CHO_KIEM_TRA': return 'bg-amber-500';
      case 'CHO_DUYET': return 'bg-purple-500';
      case 'DA_DUYET': return 'bg-green-500';
      case 'LOI': return 'bg-red-500';
      default: return 'bg-slate-300';
    }
  };

  // Only show on specific routes to avoid clutter, e.g. not on Login, Config, or Home pages
  const hiddenRoutes = ['/', '/login', '/config-types', '/config-fields', '/admin-users'];
  if (hiddenRoutes.includes(location.pathname)) {
    return null;
  }

  return (
    <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col h-full shrink-0">
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-white shrink-0">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Cây Thư Mục</h2>
        <button onClick={fetchDocuments} className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-md transition-colors" title="Làm mới">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {Object.entries(groupedDocs).length === 0 ? (
          <div className="p-4 text-sm text-slate-500 text-center italic">
            Không có tài liệu nào trong hàng đợi của bạn.
          </div>
        ) : (
          Object.entries(groupedDocs).map(([folderName, docs]) => {
            const isExpanded = expandedFolders[folderName];
            return (
              <div key={folderName} className="select-none">
                {/* Folder Header */}
                <div 
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-200 rounded-md cursor-pointer text-slate-700 transition-colors"
                  onClick={() => toggleFolder(folderName)}
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
                  <Folder className="w-4 h-4 text-amber-500 shrink-0 fill-amber-100" />
                  <span className="text-sm font-semibold truncate flex-1">{folderName}</span>
                  <span className="text-xs text-slate-400 font-medium bg-white px-1.5 py-0.5 rounded-full border border-slate-200">{docs.length}</span>
                </div>

                {/* Folder Contents */}
                {isExpanded && (
                  <div className="ml-5 mt-1 border-l border-slate-200 pl-2 space-y-1">
                    {docs.map(doc => {
                      const isActive = location.state?.document?.id === doc.id;
                      return (
                        <div 
                          key={doc.id}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group transition-colors text-sm ${
                            isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-slate-200 text-slate-600'
                          }`}
                          onClick={() => handleFileClick(doc)}
                          title={doc.original_name}
                        >
                          <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`} />
                          <span className="truncate flex-1">{doc.original_name}</span>
                          
                          {/* Status Indicator */}
                          <div className={`w-2 h-2 rounded-full shrink-0 ${getStepColor(doc.step)}`} title={`Trạng thái: ${doc.step}`} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
