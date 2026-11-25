import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { SubmitPublication } from './pages/shared/SubmitPublication';
import { ManageResearchers } from './pages/vice_dean/ManageResearchers';
import { SupervisorDashboard } from './pages/supervisor/SupervisorDashboard';
import { PendingPublications } from './pages/publication_officer/PendingPublications';
import { ViewPublications } from './pages/shared/ViewPublications';
import { Reports } from './pages/shared/Reports';
import Layout from './components/Layout';
import './index.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-muted)' }}>
        Loading repository portal...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/publications/submit" element={
            <ProtectedRoute>
              <SubmitPublication />
            </ProtectedRoute>
          } />
          <Route path="/publications/pending" element={
            <ProtectedRoute>
              <PendingPublications />
            </ProtectedRoute>
          } />
          <Route path="/researchers" element={
            <ProtectedRoute>
              <ManageResearchers />
            </ProtectedRoute>
          } />
          <Route path="/publications/all" element={
            <ProtectedRoute>
              <SupervisorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/publications/view" element={
            <ProtectedRoute>
              <ViewPublications />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
