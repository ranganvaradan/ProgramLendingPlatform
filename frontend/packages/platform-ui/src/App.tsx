import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@plp/shared';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProgramsPage from './pages/ProgramsPage';
import AnchorsPage from './pages/AnchorsPage';
import LoansPage from './pages/LoansPage';
import ReportsPage from './pages/ReportsPage';
import AuditTrailPage from './pages/AuditTrailPage';
import NotificationsPage from './pages/NotificationsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="programs" element={<ProgramsPage />} />
        <Route path="anchors" element={<AnchorsPage />} />
        <Route path="loans" element={<LoansPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit" element={<AuditTrailPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
    </Routes>
  );
}
