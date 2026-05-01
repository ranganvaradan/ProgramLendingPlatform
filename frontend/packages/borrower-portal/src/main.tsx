import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@plp/shared';
import './index.css';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LoanRequestPage from './pages/LoanRequestPage';
import MyLoansPage from './pages/MyLoansPage';
import InvoiceDiscountingPage from './pages/InvoiceDiscountingPage';
import BorrowerLayout from './layouts/BorrowerLayout';

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
          <Route path="/" element={<ProtectedRoute><BorrowerLayout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="request-loan" element={<LoanRequestPage />} />
            <Route path="my-loans" element={<MyLoansPage />} />
            <Route path="invoice-discounting" element={<InvoiceDiscountingPage />} />
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
