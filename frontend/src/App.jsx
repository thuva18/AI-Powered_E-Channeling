import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorProfile from './pages/DoctorProfile';
import DoctorAppointments from './pages/DoctorAppointments';
import PersonalJournal from './pages/PersonalJournal';
import AdminDashboard from './pages/AdminDashboard';
import { EmptyState } from './components/ui/Common';
import { Users } from 'lucide-react';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
          <Route path="/admin/doctors" element={
            <div className="card">
              <EmptyState icon={<Users size={28} />} title="All Doctors" description="This section will list all approved doctors in the system." />
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
