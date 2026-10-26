import { api } from "../api/client";
import type { Job } from "../api/client";

const colors: Record<Job["status"], string> = {
  UPLOADING: "#6b7280",
  QUEUED: "#d97706",
  PROCESSING: "#2563eb",
  COMPLETED: "#16a34a",
  FAILED: "#dc2626",
};

async function download(id: string) {
  const res = await api.get(`/jobs/${id}/download`);
  window.location.href = res.data.downloadUrl;
}

export default function JobTable({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0) return <p>No jobs yet. Upload a CSV above.</p>;

  return (
    <div style={{ background: "white", borderRadius: 12, overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", background: "#f9fafb" }}>
            <th style={cell}>File</th>
            <th style={cell}>Status</th>
            <th style={cell}>Progress</th>
            <th style={cell}>Created</th>
            <th style={cell}></th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => {
            const pct = j.totalChunks
              ? Math.round((j.completedChunks / j.totalChunks) * 100)
              : 0;
            return (
              <tr key={j.id} style={{ borderTop: "1px solid #eee" }}>
                <td style={cell}>{j.fileName}</td>
                <td style={cell}>
                  <span style={{ color: colors[j.status], fontWeight: 600 }}>{j.status}</span>
                  {j.error && <div style={{ fontSize: 12, color: "#dc2626" }}>{j.error}</div>}
                </td>
                <td style={cell}>
                  <div style={{ background: "#e5e7eb", height: 8, borderRadius: 4, width: 140 }}>
                    <div style={{ width: `${pct}%`, height: 8, borderRadius: 4,
                      background: colors[j.status], transition: "width .3s" }} />
                  </div>
                  <small>{j.completedChunks}/{j.totalChunks} chunks</small>
                </td>
                <td style={cell}>{new Date(j.createdAt).toLocaleString()}</td>
                <td style={cell}>
                  {j.status === "COMPLETED" && (
                    <button onClick={() => download(j.id)}>Download</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const cell: React.CSSProperties = { padding: "10px 14px", fontSize: 14 };