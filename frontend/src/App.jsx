import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import XssDemo from './pages/XssDemo';
import CsrfDemo from './pages/CsrfDemo';
import RotationDemo from './pages/RotationDemo';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Učitavanje...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" />} />
      <Route
        path="/xss-demo"
        element={
          <ProtectedRoute>
            <XssDemo />
          </ProtectedRoute>
        }
      />

      <Route
        path="/csrf-demo"
        element={
          <ProtectedRoute>
            <CsrfDemo />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rotation-demo"
        element={
          <ProtectedRoute>
            <RotationDemo />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

export default App;
