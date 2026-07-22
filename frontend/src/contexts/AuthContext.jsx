import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState(() => {
    const savedAccounts = localStorage.getItem('adminAccounts');
    if (savedAccounts) {
      return JSON.parse(savedAccounts);
    }
    // Default mock account
    const defaultAccounts = [{ username: 'admin', password: '1234', name: 'Admin User' }];
    localStorage.setItem('adminAccounts', JSON.stringify(defaultAccounts));
    return defaultAccounts;
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (username, password) => {
    const foundUser = accounts.find(acc => acc.username === username && acc.password === password);
    if (foundUser) {
      const userData = { username: foundUser.username, name: foundUser.name };
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const addAccount = (newAccount) => {
    // Check if username already exists
    if (accounts.some(acc => acc.username === newAccount.username)) {
      return { success: false, message: 'Tên đăng nhập đã tồn tại!' };
    }
    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    localStorage.setItem('adminAccounts', JSON.stringify(updatedAccounts));
    return { success: true };
  };
  
  const removeAccount = (username) => {
    const updatedAccounts = accounts.filter(acc => acc.username !== username);
    setAccounts(updatedAccounts);
    localStorage.setItem('adminAccounts', JSON.stringify(updatedAccounts));
  };

  const value = {
    user,
    accounts,
    login,
    logout,
    addAccount,
    removeAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
