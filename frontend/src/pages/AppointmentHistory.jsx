import { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function AppointmentHistory() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/appointments/my");
        setItems(res.data);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load appointments");
      }
    })();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Appointment History</h2>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {items.length === 0 ? (
        <p>No appointments found.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Status</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a._id}>
                <td>{new Date(a.dateTime).toLocaleString()}</td>
                <td>{a.status}</td>
                <td>{a.note || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}