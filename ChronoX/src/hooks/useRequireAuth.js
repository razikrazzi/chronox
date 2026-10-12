import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export function useRequireAuth() {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const requireAuth = (action, customRedirectState = {}) => {
    if (!isLoggedIn) {
      navigate("/login", {
        state: {
          from: location.pathname,
          ...customRedirectState,
        },
      });
      return false;
    }

    if (typeof action === "function") {
      action();
    }
    return true;
  };

  return {
    isLoggedIn,
    user,
    requireAuth,
  };
}

export default useRequireAuth;
