import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AdminRoute() {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/admin/login" replace />;
  if (auth.role !== 'admin') return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}

export function DashboardRoute({ requiredPermission }) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (!auth.permissions || auth.permissions.length === 0) return <Navigate to="/unauthorized" replace />;
  if (requiredPermission && !auth.permissions.includes(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}

// Legacy default export kept for backward compatibility
export default function ProtectedRoute() {
  const { auth } = useAuth();
  return auth ? <Outlet /> : <Navigate to="/login" replace />;
}
