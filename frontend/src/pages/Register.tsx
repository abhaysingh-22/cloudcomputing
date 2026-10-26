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
      setError(err.response?.data?.error ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <form onSubmit={onSubmit} style={styles.card}>
        <h2 style={{ margin: 0 }}>Create account</h2>
        <input style={styles.input} type="email" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input style={styles.input} type="password" placeholder="Password (min 8 characters)"
          value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.button} disabled={loading}>
          {loading ? "Creating..." : "Register"}
        </button>
        <p style={{ margin: 0, fontSize: 14 }}>
          Have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}