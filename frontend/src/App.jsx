import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RegistrationPage from './pages/RegistrationPage';
import PatientPage from './pages/PatientPage';
import QueuePage from './pages/QueuePage';
import MedicalRecordPage from './pages/MedicalRecordPage';

function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/registrations"
          element={
            <RequireAuth>
              <RegistrationPage />
            </RequireAuth>
          }
        />
        <Route
          path="/queues"
          element={
            <RequireAuth>
              <QueuePage />
            </RequireAuth>
          }
        />
        <Route
          path="/patients"
          element={
            <RequireAuth>
              <PatientPage />
            </RequireAuth>
          }
        />
        <Route
          path="/medical-records"
          element={
            <RequireAuth>
              <MedicalRecordPage />
            </RequireAuth>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
