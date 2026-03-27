<<<<<<< Updated upstream
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
=======
import { BrowserRouter, Routes, Route } from 'react-router-dom';
>>>>>>> Stashed changes
import LandingPage from './pages/LandingPage';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientRegister from './pages/PatientRegister';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorProfile from './pages/DoctorProfile';
import DoctorAppointments from './pages/DoctorAppointments';
import DoctorPatients from './pages/DoctorPatients';
import PersonalJournal from './pages/PersonalJournal';
import AdminDashboard from './pages/AdminDashboard';
import AdminAllDoctors from './pages/AdminAllDoctors';
import PatientBookAppointment from './pages/PatientBookAppointment';
import PatientMyAppointments from './pages/PatientMyAppointments';
import PatientMedicalHistory from './pages/PatientMedicalHistory';
import PatientPaymentHistory from './pages/PatientPaymentHistory';
import PatientProfile from './pages/PatientProfile';
import AdminPayments from './pages/AdminPayments';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminReports from './pages/AdminReports';
import PaymentReceipt from './pages/PaymentReceipt';
<<<<<<< Updated upstream
import { EmptyState } from './components/ui/Common';
import { Users } from 'lucide-react';

=======
>>>>>>> Stashed changes
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
          <Route path="/dashboard/patients" element={<DoctorPatients />} />
        </Route>

        {/* Admin */}
        <Route element={<DashboardLayout allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/doctors" element={<AdminAllDoctors />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/users" element={<AdminUserManagement />} />
          <Route path="/admin/reports" element={<AdminReports />} />
        </Route>

        {/* Patient */}
        <Route element={<DashboardLayout allowedRoles={['PATIENT']} />}>
          <Route path="/patient" element={<PatientBookAppointment />} />
          <Route path="/patient/appointments" element={<PatientMyAppointments />} />
          <Route path="/patient/history" element={<PatientMedicalHistory />} />
          <Route path="/patient/payments" element={<PatientPaymentHistory />} />
          <Route path="/patient/payments/receipt/:transactionId" element={<PaymentReceipt />} />
          <Route path="/patient/profile" element={<PatientProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
