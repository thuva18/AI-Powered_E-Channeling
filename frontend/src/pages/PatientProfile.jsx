import { useEffect, useState } from "react";
import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function PatientProfile() {
  const { user, reload } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    age: "",
    gender: ""
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) return;
    setForm({
      fullName: user.fullName || "",
      phone: user.phone || "",
      address: user.address || "",
      age: user.age ?? "",
      gender: user.gender || ""
    });
  }, [user]);

  function set(key, val) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  async function save() {
    setMsg("");
    setErr("");
    try {
      await api.put("/patient/me", {
        ...form,
        age: form.age === "" ? null : Number(form.age)
      });
      await reload();
      setMsg("Profile updated ✅");
    } catch (e) {
      setErr(e?.response?.data?.message || "Update failed");
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 520 }}>
      <h2>My Profile</h2>
      {msg && <p style={{ color: "green" }}>{msg}</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <div style={{ display: "grid", gap: 10 }}>
        <input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Full Name" />
        <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Phone" />
        <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Address" />
        <input value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="Age" />
        <select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <button onClick={save}>Save</button>
      </div>
    </div>
  );
}