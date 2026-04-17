import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SentimentDashboard from './pages/SentimentDashboard';
import CommentsDashboard from './pages/CommentsDashboard';
import TrendDashboard from './pages/TrendDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="sentiment" element={<SentimentDashboard />} />
          <Route path="comments" element={<CommentsDashboard />} />
          <Route path="trend" element={<TrendDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
