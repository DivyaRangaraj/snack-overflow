import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { ActivityPage } from './pages/ActivityPage';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { AdminRequestsPage } from './pages/AdminRequestsPage';

export default function App() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="my-requests" element={<MyRequestsPage />} />

          {/* Admin-only routes */}
          <Route element={<AdminRoute />}>
            <Route path="activity" element={<ActivityPage />} />
            <Route path="admin/requests" element={<AdminRequestsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
