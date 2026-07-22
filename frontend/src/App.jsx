import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Layout from './layouts/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Classification from './pages/Classification';
import Check from './pages/Check';
import Approval from './pages/Approval';
import Summary from './pages/Summary';
import ConfigTypes from './pages/ConfigTypes';
import ConfigFields from './pages/ConfigFields';
import AdminUsers from './pages/AdminUsers';
import ViewDocument from './pages/ViewDocument';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="upload" element={<Upload />} />
              <Route path="classification" element={<Classification />} />
              <Route path="check" element={<Check />} />
              <Route path="approval" element={<Approval />} />
              <Route path="summary" element={<Summary />} />
              <Route path="config-types" element={<ConfigTypes />} />
              <Route path="config-fields" element={<ConfigFields />} />
              <Route path="admin-users" element={<AdminUsers />} />
              <Route path="document/:id" element={<ViewDocument />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
