import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { setToken } from "../auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      setToken(res.data.token);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <form onSubmit={onSubmit} style={styles.card}>
        <h2 style={{ margin: 0 }}>Log in</h2>
        <input style={styles.input} type="email" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input style={styles.input} type="password" placeholder="Password"
          value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.button} disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>
        <p style={{ margin: 0, fontSize: 14 }}>
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

export const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "grid", placeItems: "center" },
  card: {
    background: "white", padding: 32, borderRadius: 12, width: 320,
    display: "flex", flexDirection: "column", gap: 14,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  input: { padding: 10, fontSize: 15, borderRadius: 8, border: "1px solid #ccc" },
  button: {
    padding: 10, fontSize: 15, borderRadius: 8, border: "none",
    background: "#2563eb", color: "white", cursor: "pointer",
  },
  error: { color: "#b91c1c", margin: 0, fontSize: 14 },
};