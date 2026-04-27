import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import { DashboardRoute } from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import SentimentDashboard from './pages/SentimentDashboard';
import CommentsDashboard from './pages/CommentsDashboard';
import TrendDashboard from './pages/TrendDashboard';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import ChangePassword from './pages/ChangePassword';
import AccessDenied from './pages/AccessDenied';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/unauthorized" element={<AccessDenied />} />

          <Route element={<DashboardRoute requiredPermission="view_kpi" />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="change-password" element={<ChangePassword />} />
            </Route>
          </Route>
          <Route element={<DashboardRoute requiredPermission="view_sentiment" />}>
            <Route element={<Layout />}>
              <Route path="sentiment" element={<SentimentDashboard />} />
            </Route>
          </Route>
          <Route element={<DashboardRoute requiredPermission="view_comments" />}>
            <Route element={<Layout />}>
              <Route path="comments" element={<CommentsDashboard />} />
            </Route>
          </Route>
          <Route element={<DashboardRoute requiredPermission="view_trend" />}>
            <Route element={<Layout />}>
              <Route path="trend" element={<TrendDashboard />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
