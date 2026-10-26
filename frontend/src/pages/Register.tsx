import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { setToken } from "../auth";
import { styles } from "./Login";

export default function Register() {
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
      const res = await api.post("/auth/register", { email, password });
      setToken(res.data.token);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.halo} />

      <form onSubmit={onSubmit} style={styles.card}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={styles.logoBadge}>✨</div>
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Get started with cloud-distributed file processing</p>
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
          <label style={styles.label}>Password (minimum 8 characters)</label>
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
          {loading ? "Creating account..." : "Register Account →"}
        </button>

        <p style={styles.footerText}>
          Already registered?{" "}
          <Link to="/login" style={styles.link}>
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}