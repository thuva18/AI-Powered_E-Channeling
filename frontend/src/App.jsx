import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientRegister from './pages/PatientRegister';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorProfile from './pages/DoctorProfile';
import DoctorAppointments from './pages/DoctorAppointments';
import PersonalJournal from './pages/PersonalJournal';
import AdminDashboard from './pages/AdminDashboard';
import AdminAllDoctors from './pages/AdminAllDoctors';
import PatientBookAppointment from './pages/PatientBookAppointment';
import PatientMyAppointments from './pages/PatientMyAppointments';
import PatientMedicalHistory from './pages/PatientMedicalHistory';
import PatientPaymentHistory from './pages/PatientPaymentHistory';
import PatientProfile from './pages/PatientProfile';
import { EmptyState } from './components/ui/Common';
import { Users } from 'lucide-react';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth routes (Login/Register) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/patient/register" element={<PatientRegister />} />
        </Route>

        {/* Doctor */}
        <Route element={<DashboardLayout allowedRoles={['DOCTOR']} />}>
          <Route path="/dashboard" element={<DoctorDashboard />} />
          <Route path="/dashboard/appointments" element={<DoctorAppointments />} />
          <Route path="/dashboard/journal" element={<PersonalJournal />} />
          <Route path="/dashboard/profile" element={<DoctorProfile />} />
          <Route path="/dashboard/patients" element={
            <div className="card">
              <EmptyState icon={<Users size={28} />} title="Patient Directory" description="Patient records will be populated once appointments are completed." />
            </div>
          } />
        </Route>

        {/* Admin */}
        <Route element={<DashboardLayout allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/doctors" element={<AdminAllDoctors />} />
        </Route>

        {/* Patient */}
        <Route element={<DashboardLayout allowedRoles={['PATIENT']} />}>
          <Route path="/patient" element={<PatientBookAppointment />} />
          <Route path="/patient/appointments" element={<PatientMyAppointments />} />
          <Route path="/patient/history" element={<PatientMedicalHistory />} />
          <Route path="/patient/payments" element={<PatientPaymentHistory />} />
          <Route path="/patient/profile" element={<PatientProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
