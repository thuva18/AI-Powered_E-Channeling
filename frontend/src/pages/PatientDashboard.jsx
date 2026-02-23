import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // IMPORTANT: Change this route to whatever your teammate's appointment booking module uses
  const APPOINTMENT_BOOKING_ROUTE = "/appointments/book";

  return (
    <div style={{ padding: 20 }}>
      <h2>Patient Dashboard</h2>
      <p>Welcome, {user?.fullName || user?.email}</p>

      <button
        style={{ padding: "12px 16px", fontSize: 16, cursor: "pointer" }}
        onClick={() => navigate(APPOINTMENT_BOOKING_ROUTE)}
      >
        Book Appointment
      </button>

      <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
        <button onClick={() => navigate("/patient/appointments")}>View Appointment History</button>
        <button onClick={() => navigate("/patient/payments")}>View Payment History</button>
      </div>

      <p style={{ marginTop: 12, color: "#666" }}>
        (This module only redirects you to booking — booking is handled by the Appointment module.)
      </p>
    </div>
  );
}