import { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function PaymentHistory() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/payments/my");
        setItems(res.data);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load payments");
      }
    })();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Payment History</h2>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {items.length === 0 ? (
        <p>No payments found.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Appointment</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p._id}>
                <td>{new Date(p.createdAt).toLocaleString()}</td>
                <td>{p.amount}</td>
                <td>{p.method}</td>
                <td>{p.status}</td>
                <td>{p.appointmentId || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}