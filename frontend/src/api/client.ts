import axios from "axios";

const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const apiBaseUrl = isLocal
  ? "http://localhost:4000"
  : (import.meta.env.VITE_API_URL || "https://elect-hiring-second-bookmark.trycloudflare.com");

export const api = axios.create({
  baseURL: apiBaseUrl,
});

// Attach the JWT and bypass tunnel reminder header to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["Bypass-Tunnel-Reminder"] = "true";
  return config;
});

// If the token is expired or invalid, log out
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export type Job = {
  id: string;
  fileName: string;
  status: "UPLOADING" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  totalChunks: number;
  completedChunks: number;
  error: string | null;
  createdAt: string;
};