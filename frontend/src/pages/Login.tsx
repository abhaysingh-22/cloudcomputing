import { useState, useEffect } from "react";
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
  const [theme, setTheme] = useState(() => localStorage.getItem("cfp_theme") || "dark");

  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
    localStorage.setItem("cfp_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

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
      {/* Top right theme toggle */}
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <button onClick={toggleTheme} style={styles.themeToggleBtn}>
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>

      <div style={styles.halo} />

      <form onSubmit={onSubmit} style={styles.card}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={styles.logoBadge}>☁️</div>
          <h2 style={styles.title}>Cloud File Ingestion</h2>
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
  themeToggleBtn: {
    background: "var(--bg-card)",
    backdropFilter: "blur(12px)",
    border: "1px solid var(--border-card)",
    color: "var(--text-title)",
    borderRadius: 10,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "var(--card-shadow)",
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
    background: "var(--bg-card)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    padding: "36px 32px",
    borderRadius: 20,
    width: 380,
    maxWidth: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    border: "1px solid var(--border-card)",
    boxShadow: "var(--card-shadow)",
    transition: "all 0.3s ease",
  },
  logoBadge: {
    fontSize: 28,
    background: "var(--badge-bg)",
    border: "1px solid var(--badge-border)",
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
    fontSize: 22,
    fontWeight: 800,
    color: "var(--text-title)",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: 13,
    color: "var(--text-muted)",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-title)",
    letterSpacing: "0.02em",
  },
  input: {
    padding: "11px 14px",
    fontSize: 14,
    borderRadius: 10,
    border: "1px solid var(--border-dropzone)",
    background: "var(--bg-dropzone)",
    color: "var(--text-title)",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  button: {
    marginTop: 6,
    padding: "12px",
    fontSize: 14,
    fontWeight: 700,
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
    color: "var(--text-muted)",
    textAlign: "center",
  },
  link: {
    color: "var(--badge-color)",
    textDecoration: "none",
    fontWeight: 700,
  },
};