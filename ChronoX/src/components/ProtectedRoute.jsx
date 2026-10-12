import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f4f2] text-black">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
          Verifying credentials...
        </p>
      </div>
    );
  }

  if (!isLoggedIn) {
    // Preserve the page user intended to visit
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
