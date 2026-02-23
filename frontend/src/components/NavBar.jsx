import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", gap: 12, padding: 12, borderBottom: "1px solid #ddd" }}>
      <Link to="/">Home</Link>

      {user ? (
        <>
          <Link to="/patient/dashboard">Dashboard</Link>
          <Link to="/patient/profile">Profile</Link>
          <Link to="/patient/appointments">Appointment History</Link>
          <Link to="/patient/payments">Payment History</Link>

          <button
            style={{ marginLeft: "auto" }}
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </>
      ) : (
        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      )}
    </div>
  );
}