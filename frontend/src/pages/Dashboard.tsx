import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Job } from "../api/client";
import { clearToken } from "../auth";
import UploadCard from "../components/UploadCard";
import JobTable from "../components/JobTable";

export default function Dashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
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

  const loadJobs = useCallback(async () => {
    try {
      const res = await api.get<Job[]>("/jobs");
      setJobs(res.data);
    } catch {
      // ignore transient poll error
    }
  }, []);

  useEffect(() => {
    api.get("/me").then((res) => setEmail(res.data.email));
    loadJobs();
  }, [loadJobs]);

  // Fast continuous polling every 800ms
  const hasActive = jobs.some((j) => ["UPLOADING", "QUEUED", "PROCESSING"].includes(j.status));
  useEffect(() => {
    if (!hasActive) return;
    const t = setInterval(loadJobs, 800);
    return () => clearInterval(t);
  }, [hasActive, loadJobs]);

  function logout() {
    clearToken();
    navigate("/login");
  }

  // Calculate live stats for the KPI metric cards
  const totalDatasets = jobs.length;
  const totalChunksProcessed = jobs.reduce((acc, j) => acc + (j.completedChunks || (j.totalChunks || 25)), 0);

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "36px 20px 60px" }}>
      {/* Top Navbar */}
      <header style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={logoWrapper}>☁️</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={brandTitle}>File Ingestion System</h1>
              <span style={regionBadge}>
                <span className="live-dot" />
                AWS ap-south-1
              </span>
            </div>
            <p style={brandSubtitle}>
              Microservice Architecture • Direct S3 Ingestion • SQS Distributed Worker Processing
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Light / Dark Mode Switch */}
          <button onClick={toggleTheme} style={themeBtn} title="Toggle Light / Dark Mode">
            {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>

          <div style={userBadge}>
            <div style={avatarCircle}>
              {email ? email[0].toUpperCase() : "U"}
            </div>
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-title)" }}>
              {email || "User"}
            </span>
          </div>

          <button onClick={logout} style={logoutBtn} title="Sign Out">
            Sign out
          </button>
        </div>
      </header>

      {/* KPI Stats Bar */}
      {/* <section style={metricsGrid}>
        <div style={metricCard}>
          <div style={metricIconBox}>📊</div>
          <div>
            <div style={metricValue}>{totalDatasets}</div>
            <div style={metricLabel}>Total Ingestions</div>
          </div>
        </div>

        <div style={metricCard}>
          <div style={metricIconBox}>🧩</div>
          <div>
            <div style={metricValue}>{totalChunksProcessed}</div>
            <div style={metricLabel}>Chunks Streamed</div>
          </div>
        </div>

        <div style={metricCard}>
          <div style={metricIconBox}>⚡</div>
          <div>
            <div style={metricValue}>
              <span style={{ color: "#10b981" }}>99.9%</span>
            </div>
            <div style={metricLabel}>Pipeline Reliability</div>
          </div>
        </div>

        <div style={metricCard}>
          <div style={metricIconBox}>⚙️</div>
          <div>
            <div style={metricValue}>
              <span style={{ color: "var(--badge-color)" }}>Active</span>
            </div>
            <div style={metricLabel}>SQS Workers Cluster</div>
          </div>
        </div>
      </section> */}

      {/* Upload Zone */}
      <UploadCard onStarted={loadJobs} />

      {/* Datasets Table */}
      <JobTable jobs={jobs} onDeleted={loadJobs} />
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 28,
  paddingBottom: 22,
  borderBottom: "1px solid var(--border-card)",
  flexWrap: "wrap",
  gap: 16,
};

const logoWrapper: React.CSSProperties = {
  width: 50,
  height: 50,
  borderRadius: 15,
  background: "linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(129, 140, 248, 0.2))",
  border: "1px solid var(--badge-border)",
  display: "grid",
  placeItems: "center",
  fontSize: 26,
  boxShadow: "0 0 20px rgba(56, 189, 248, 0.25)",
};

const brandTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 800,
  color: "var(--text-title)",
  letterSpacing: "-0.02em",
};

const brandSubtitle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: 12,
  color: "var(--text-muted)",
};

const regionBadge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "var(--badge-bg)",
  color: "var(--badge-color)",
  border: "1px solid var(--badge-border)",
  borderRadius: 14,
  padding: "3px 10px",
  fontSize: 11,
  fontWeight: 700,
};

const themeBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "var(--bg-card)",
  backdropFilter: "blur(12px)",
  border: "1px solid var(--border-card)",
  color: "var(--text-title)",
  borderRadius: 10,
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s",
  boxShadow: "var(--card-shadow)",
};

const userBadge: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  background: "var(--bg-card)",
  backdropFilter: "blur(12px)",
  border: "1px solid var(--border-card)",
  padding: "5px 14px 5px 6px",
  borderRadius: 30,
};

const avatarCircle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "linear-gradient(135deg, #38bdf8, #2563eb)",
  color: "white",
  fontWeight: 700,
  fontSize: 12,
  display: "grid",
  placeItems: "center",
};

const logoutBtn: React.CSSProperties = {
  background: "var(--pill-bg)",
  color: "var(--text-muted)",
  border: "1px solid var(--border-card)",
  borderRadius: 10,
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s",
};

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 16,
  marginBottom: 28,
};

const metricCard: React.CSSProperties = {
  background: "var(--bg-card)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid var(--border-card)",
  borderRadius: 16,
  padding: "16px 20px",
  display: "flex",
  alignItems: "center",
  gap: 14,
  boxShadow: "var(--card-shadow)",
  transition: "all 0.3s ease",
};

const metricIconBox: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 12,
  background: "var(--pill-bg)",
  border: "1px solid var(--border-card)",
  display: "grid",
  placeItems: "center",
  fontSize: 20,
};

const metricValue: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: "var(--text-title)",
  letterSpacing: "-0.02em",
  lineHeight: 1.1,
};

const metricLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginTop: 4,
};