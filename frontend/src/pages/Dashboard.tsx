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
    const res = await api.get<Job[]>("/jobs");
    setJobs(res.data);
  }, []);

  useEffect(() => {
    api.get("/me").then((res) => setEmail(res.data.email));
    loadJobs();
  }, [loadJobs]);

  // Poll every 2s, but only while some job is still in progress
  const hasActive = jobs.some((j) => ["QUEUED", "PROCESSING"].includes(j.status));
  useEffect(() => {
    if (!hasActive) return;
    const t = setInterval(loadJobs, 2000);
    return () => clearInterval(t);
  }, [hasActive, loadJobs]);

  function logout() {
    clearToken();
    navigate("/login");
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Cloud File Processor</h1>
        <div>
          <span style={{ marginRight: 12 }}>{email}</span>
          <button onClick={logout}>Log out</button>
        </div>
      </div>

      <UploadCard onStarted={loadJobs} />
      <JobTable jobs={jobs} />
    </div>
  );
}