import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUserRole } from "../lib/useUserRole";

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useUserRole();

  if (loading) {
    return <div className="py-10 text-center text-slate-600">Loading...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/creator" replace />;

  return <>{children}</>;
}
