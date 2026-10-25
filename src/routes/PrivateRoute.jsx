import { Navigate, useLocation } from "react-router-dom";
import { useAuthUser } from "../lib/useAuthUser";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuthUser();
  const location = useLocation();
  if (loading) return <div className="py-10 text-center text-slate-600">Loading...</div>;
  return user ? children : <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
}
