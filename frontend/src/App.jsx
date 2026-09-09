import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RegistrationPage from './pages/RegistrationPage';
import PatientPage from './pages/PatientPage';
import QueuePage from './pages/QueuePage';
import MedicalRecordPage from './pages/MedicalRecordPage';


function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/registrations" element={<RegistrationPage />} />
      <Route path="/queues" element={<QueuePage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
      <Route path="/patients" element={<PatientPage />} />
      <Route path="/medical-records" element={<MedicalRecordPage />} />
    </Routes>
  );
}

export default App;