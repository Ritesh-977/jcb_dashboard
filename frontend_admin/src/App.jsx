import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MarketProvider } from './context/MarketContext';
import { useAuth } from './context/AuthContext';
import AdminLogin from './pages/AdminLogin';
import AdminUsers from './pages/AdminUsers';
import ChangePassword from './pages/ChangePassword';
import CsvUpload from './pages/CsvUpload';
import ManageMarkets from './pages/ManageMarkets';
import ManageCampaigns from './pages/ManageCampaigns';

function AdminRoute() {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (auth.role !== 'admin') return <Navigate to="/login" replace />;
  return <Outlet />;
}

function App() {
  return (
    <AuthProvider>
      <MarketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AdminLogin />} />
            <Route element={<AdminRoute />}>
              <Route path="/users" element={<AdminUsers />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/upload" element={<CsvUpload />} />
              <Route path="/markets" element={<ManageMarkets />} />
              <Route path="/campaigns" element={<ManageCampaigns />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </MarketProvider>
    </AuthProvider>
  );
}

export default App;
