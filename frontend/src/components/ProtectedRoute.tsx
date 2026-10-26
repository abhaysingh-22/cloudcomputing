import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { isLoggedIn } from "../auth";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  return isLoggedIn() ? <>{children}</> : <Navigate to="/login" replace />;
}