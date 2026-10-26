import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
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