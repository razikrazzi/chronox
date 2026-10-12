import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Safely resolves the intended navigation destination based on
 * the authenticated user's role and any saved route state.
 */
function resolveRedirectDestination(authenticatedUser, fromLocationState) {
  const isAdmin = authenticatedUser?.role === "admin";

  let targetPath = null;
  if (typeof fromLocationState === "string") {
    targetPath = fromLocationState;
  } else if (fromLocationState?.pathname) {
    targetPath =
      fromLocationState.pathname +
      (fromLocationState.search || "") +
      (fromLocationState.hash || "");
  }

  // Prevent circular or invalid login/register loops
  if (
    targetPath &&
    (targetPath.startsWith("/login") || targetPath.startsWith("/register"))
  ) {
    targetPath = null;
  }

  // If destination is an admin route
  if (targetPath && targetPath.startsWith("/admin")) {
    // Only administrators can proceed to /admin routes
    return isAdmin ? targetPath : "/dashboard";
  }

  // If destination is a customer protected route (e.g., /cart, /wishlist, /orders, /profile)
  if (targetPath) {
    // If an administrator logs in, always direct them to the admin panel
    return isAdmin ? "/admin" : targetPath;
  }

  // Default role-based destinations
  return isAdmin ? "/admin" : "/dashboard";
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login, isLoggedIn, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guard to prevent duplicate redirects when submitting the form
  const hasNavigatedRef = useRef(false);

  // Redirect users who are already authenticated on initial page render
  useEffect(() => {
    // Wait until background session verification completes
    if (authLoading) return;

    if (isLoggedIn && !isSubmitting && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      const target = resolveRedirectDestination(user, location.state?.from);
      navigate(target, { replace: true });
    }
  }, [isLoggedIn, user, authLoading, isSubmitting, navigate, location.state]);

  // Handle login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submissions while in progress
    if (isSubmitting) return;
    setError("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login({
        email: email.trim(),
        password,
      });

      if (result.success && result.user) {
        hasNavigatedRef.current = true;
        // Use the authenticated user returned by the login function
        const destination = resolveRedirectDestination(
          result.user,
          location.state?.from
        );
        navigate(destination, { replace: true });
      } else {
        setError(result.message || "Invalid email or password.");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Login submission error:", err);
      setError("Unable to process login. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#f5f5f5] px-4">
      {/* Login Card */}
      <div
        className="
          relative
          w-full
          max-w-sm
          overflow-hidden
          rounded-2xl
          border
          border-black/10
          bg-white
          px-8
          py-10
          shadow-[0_20px_60px_rgba(0,0,0,0.12)]
        "
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="
            absolute
            right-5
            top-5
            z-20
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-full
            text-xl
            text-black/50
            transition
            hover:bg-black/5
            hover:text-black
          "
          aria-label="Close"
        >
          ×
        </button>

        {/* Content */}
        <div className="relative z-10">
          {/* Heading */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black tracking-[-0.04em] text-black">
              LOGIN
            </h1>

            <p className="mt-2 text-xs text-black/50">
              Sign in to continue
            </p>
          </div>

          {/* Login / Register Toggle */}
          <div className="mb-7 flex justify-center">
            <div className="flex rounded-full bg-[#f1f1f1] p-1 text-xs">
              <button
                type="button"
                onClick={() =>
                  navigate("/login", { state: location.state })
                }
                className="
                  rounded-full
                  bg-black
                  px-5
                  py-2
                  font-medium
                  text-white
                  shadow-sm
                  transition
                "
              >
                Login
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/register", { state: location.state })
                }
                className="
                  rounded-full
                  px-5
                  py-2
                  text-black/50
                  transition
                  hover:text-black
                "
              >
                Register
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="
                mb-5
                rounded-lg
                border
                border-red-200
                bg-red-50
                px-4
                py-2.5
                text-center
                text-xs
                font-medium
                text-red-700
              "
            >
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-black">
                Email
              </label>

              <input
                type="email"
                value={email}
                disabled={isSubmitting}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter your email"
                autoComplete="email"
                required
                className="
                  h-11
                  w-full
                  rounded-lg
                  border
                  border-black/15
                  bg-[#f7f7f7]
                  px-4
                  text-sm
                  text-black
                  outline-none
                  placeholder:text-black/35
                  transition
                  focus:border-black
                  focus:bg-white
                  focus:ring-1
                  focus:ring-black
                  disabled:opacity-60
                "
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-black">
                Password
              </label>

              <input
                type="password"
                value={password}
                disabled={isSubmitting}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="
                  h-11
                  w-full
                  rounded-lg
                  border
                  border-black/15
                  bg-[#f7f7f7]
                  px-4
                  text-sm
                  text-black
                  outline-none
                  placeholder:text-black/35
                  transition
                  focus:border-black
                  focus:bg-white
                  focus:ring-1
                  focus:ring-black
                  disabled:opacity-60
                "
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-[11px] text-black/60">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  disabled={isSubmitting}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer accent-black disabled:opacity-60"
                />

                <span>Remember me</span>
              </label>

              <span className="text-[10px] text-black/40">
                CHRONOX Account
              </span>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isSubmitting || authLoading}
              className="
                mt-3
                h-12
                w-full
                rounded-full
                bg-black
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-[#222]
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {isSubmitting ? "Signing In..." : "Login"}
            </button>
          </form>

          {/* Register */}
          <p className="mt-8 text-center text-[11px] text-black/50">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() =>
                navigate("/register", { state: location.state })
              }
              className="
                font-semibold
                text-black
                underline
                underline-offset-2
                transition
                hover:text-black/60
              "
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;