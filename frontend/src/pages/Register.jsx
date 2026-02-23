import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await register({ fullName, email, password });
      navigate("/patient/dashboard");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Register failed");
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 420 }}>
      <h2>Register (Patient)</h2>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password (min 6)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Create Account</button>
      </form>

      <p style={{ marginTop: 12 }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}