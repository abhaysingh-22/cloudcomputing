import { useRef, useState } from "react";
import axios from "axios";
import { api } from "../api/client";

type Stage = "idle" | "creating" | "uploading" | "starting";

export default function UploadCard({ onStarted }: { onStarted: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  async function submit() {
    if (!file) return;
    setError("");
    try {
      // 1. Ask the API for a job + presigned URL
      setStage("creating");
      const created = await api.post("/jobs", { fileName: file.name });
      const { job, uploadUrl } = created.data;

      // 2. Upload straight to S3 (plain axios: no JWT header!)
      setStage("uploading");
      setProgress(0);
      await axios.put(uploadUrl, file, {
        onUploadProgress: (e) =>
          setProgress(Math.round((e.loaded * 100) / (e.total ?? file.size))),
      });

      // 3. Tell the API to chunk + queue the work
      setStage("starting");
      await api.post(`/jobs/${job.id}/start`);

      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onStarted();
    } catch (err: any) {
      setError(err.response?.data?.error ?? err.message ?? "Upload failed");
    } finally {
      setStage("idle");
    }
  }

  const busy = stage !== "idle";

  return (
    <div style={card}>
      <h3 style={{ marginTop: 0 }}>Upload a CSV</h3>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        disabled={busy}
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <button style={btn} onClick={submit} disabled={!file || busy}>
        {stage === "idle" && "Upload & process"}
        {stage === "creating" && "Creating job..."}
        {stage === "uploading" && `Uploading ${progress}%`}
        {stage === "starting" && "Starting..."}
      </button>
      {error && <p style={{ color: "#b91c1c", marginBottom: 0 }}>{error}</p>}
    </div>
  );
}

const card: React.CSSProperties = {
  background: "white", padding: 20, borderRadius: 12,
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 24,
  display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start",
};
const btn: React.CSSProperties = {
  padding: "8px 16px", borderRadius: 8, border: "none",
  background: "#2563eb", color: "white", cursor: "pointer",
};