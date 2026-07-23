import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/users`);
      setAccounts(res.data);
    } catch (error) {
      console.error("Failed to fetch accounts", error);
    }
  };

  const login = async (username, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/login`, { username, password });
      if (res.data && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('currentUser', JSON.stringify(res.data.user));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const addAccount = async (newAccount) => {
    // For prototype: we don't have an add user endpoint yet, so we'll mock it 
    // or you can add the endpoint to backend. 
    // Just returning error for now if they try to add from UI.
    return { success: false, message: 'Chức năng thêm tài khoản tạm khóa. Xin cấu hình trong DB.' };
  };
  
  const removeAccount = async (username) => {
    alert("Chức năng xóa tài khoản tạm khóa. Xin cấu hình trong DB.");
  };

  const value = {
    user,
    accounts,
    login,
    logout,
    addAccount,
    removeAccount,
    refreshAccounts: fetchAccounts
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
