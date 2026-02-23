import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import NavBar from "./components/NavBar.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import PatientDashboard from "./pages/PatientDashboard.jsx";
import PatientProfile from "./pages/PatientProfile.jsx";
import AppointmentHistory from "./pages/AppointmentHistory.jsx";
import PaymentHistory from "./pages/PaymentHistory.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavBar />

        <Routes>
          {/* Default route */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/profile"
            element={
              <ProtectedRoute>
                <PatientProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute>
                <AppointmentHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/payments"
            element={
              <ProtectedRoute>
                <PaymentHistory />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route
            path="*"
            element={<div style={{ padding: 20 }}>404 Not Found</div>}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}