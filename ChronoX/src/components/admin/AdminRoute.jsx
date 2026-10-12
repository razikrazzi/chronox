import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Route protection guard for the /admin nested section.
 * - Displays a loading screen during background session verification.
 * - Redirects unauthenticated visitors to /login preserving the requested location.
 * - Redirects authenticated customers to /dashboard.
 * - Allows authenticated administrators to access child routes via <Outlet />.
 */
function AdminRoute() {
  const { isLoggedIn, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Prevent premature redirect while verifying credentials
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
            Verifying administrative access...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to login and save the attempted admin URL
  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Logged in but not an administrator -> Redirect to customer dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Authenticated administrator -> Render nested admin routes
  return <Outlet />;
}

export default AdminRoute;