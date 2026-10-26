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
      setError(err.response?.data?.error ?? "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      {/* Topographic glow halo behind the card */}
      <div style={styles.halo} />

      <form onSubmit={onSubmit} style={styles.card}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={styles.logoBadge}>☁️</div>
          <h2 style={styles.title}>Cloud File Processor</h2>
          <p style={styles.subtitle}>Sign in to access distributed S3 + SQS pipeline</p>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Email Address</label>
          <input
            style={styles.input}
            type="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p style={styles.error}>⚠️ {error}</p>}

        <button style={styles.button} disabled={loading}>
          {loading ? "Authenticating..." : "Sign in →"}
        </button>

        <p style={styles.footerText}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}

export const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 20,
    position: "relative",
  },
  halo: {
    position: "absolute",
    width: 380,
    height: 380,
    background: "radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(37, 99, 235, 0.05) 50%, transparent 70%)",
    filter: "blur(40px)",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    padding: "36px 32px",
    borderRadius: 18,
    width: 360,
    maxWidth: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
  },
  logoBadge: {
    fontSize: 28,
    background: "rgba(56, 189, 248, 0.1)",
    border: "1px solid rgba(56, 189, 248, 0.25)",
    width: 52,
    height: 52,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    margin: "0 auto 12px",
    boxShadow: "0 0 20px rgba(56, 189, 248, 0.2)",
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "#f8fafc",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: 13,
    color: "#94a3b8",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#cbd5e1",
    letterSpacing: "0.02em",
  },
  input: {
    padding: "11px 14px",
    fontSize: 14,
    borderRadius: 10,
    border: "1px solid #334155",
    background: "rgba(8, 12, 20, 0.7)",
    color: "#f8fafc",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  button: {
    marginTop: 6,
    padding: "12px",
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #38bdf8, #2563eb)",
    color: "white",
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(37, 99, 235, 0.4)",
    transition: "transform 0.1s, box-shadow 0.2s",
  },
  error: {
    color: "#f87171",
    margin: 0,
    fontSize: 13,
    background: "rgba(239, 68, 68, 0.1)",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid rgba(239, 68, 68, 0.2)",
  },
  footerText: {
    margin: "8px 0 0",
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
  },
  link: {
    color: "#38bdf8",
    textDecoration: "none",
    fontWeight: 600,
  },
};