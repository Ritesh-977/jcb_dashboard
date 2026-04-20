import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SentimentDashboard from './pages/SentimentDashboard';
import CommentsDashboard from './pages/CommentsDashboard';
import TrendDashboard from './pages/TrendDashboard';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="sentiment" element={<SentimentDashboard />} />
            <Route path="comments" element={<CommentsDashboard />} />
            <Route path="trend" element={<TrendDashboard />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
