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

  // Fast continuous polling every 800ms so the UI updates smoothly and instantly
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

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 20px" }}>
      {/* Top Navbar */}
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
            <span>☁️</span> Cloud File Processor
          </h1>
          <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 13, color: "#94a3b8" }}>
            <span>📍 Region: <strong style={{ color: "#38bdf8" }}>ap-south-1 (Mumbai)</strong></span>
            <span>•</span>
            <span>⚡ Architecture: <strong style={{ color: "#4ade80" }}>S3 + SQS Multi-Worker Microservices</strong></span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={userPill}>
            <span>👤</span>
            <span style={{ fontWeight: 500 }}>{email || "User"}</span>
          </div>
          <button onClick={logout} style={logoutBtn}>
            Log out
          </button>
        </div>
      </div>

      <UploadCard onStarted={loadJobs} />
      <JobTable jobs={jobs} onDeleted={loadJobs} />
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 28,
  paddingBottom: 20,
  borderBottom: "1px solid #334155",
};

const userPill: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "rgba(15, 23, 42, 0.7)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  padding: "6px 14px",
  borderRadius: 20,
  fontSize: 13,
  color: "#e2e8f0",
};

const logoutBtn: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  color: "#94a3b8",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: 8,
  padding: "6px 14px",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.2s",
};