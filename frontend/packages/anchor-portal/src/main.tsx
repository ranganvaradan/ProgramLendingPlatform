import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@plp/shared';
import './index.css';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import SalaryUploadPage from './pages/SalaryUploadPage';
import InvoiceUploadPage from './pages/InvoiceUploadPage';
import SettlementsPage from './pages/SettlementsPage';
import ReportsPage from './pages/ReportsPage';
import AnchorLayout from './layouts/AnchorLayout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><AnchorLayout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="salary-upload" element={<SalaryUploadPage />} />
            <Route path="invoice-upload" element={<InvoiceUploadPage />} />
            <Route path="settlements" element={<SettlementsPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
