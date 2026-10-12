import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isLoggedIn } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const redirectTarget = location.state?.from || "/dashboard";

  // If already logged in, redirect after render
  useEffect(() => {
    if (isLoggedIn) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isLoggedIn, navigate, redirectTarget]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      setError("You must accept the Terms & Conditions.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (result.success) {
        navigate(redirectTarget, { replace: true });
      } else {
        setError(result.message || "Failed to create account.");
      }
    } catch {
      setError("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#f5f5f5] px-4">
      {/* Register Card */}
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
          py-9
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
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-black tracking-[-0.04em] text-black">
              REGISTER
            </h1>

            <p className="mt-1.5 text-xs text-black/50">
              Create your account
            </p>
          </div>

          {/* Login / Register Toggle */}
          <div className="mb-6 flex justify-center">
            <div className="flex rounded-full bg-[#f1f1f1] p-1 text-xs">
              {/* Login */}
              <button
                type="button"
                onClick={() => navigate("/login", { state: location.state })}
                className="
                  rounded-full
                  px-5
                  py-2
                  text-black/50
                  transition
                  hover:text-black
                "
              >
                Login
              </button>

              {/* Register */}
              <button
                type="button"
                onClick={() => navigate("/register", { state: location.state })}
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
                Register
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-lg border border-black/10 bg-black/5 px-4 py-2 text-center text-xs font-medium text-black">
              {error}
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-black">
                Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter your name"
                className="
                  h-10
                  w-full
                  rounded-lg
                  border
                  border-black/15
                  bg-[#f7f7f7]
                  px-3.5
                  text-sm
                  text-black
                  outline-none
                  placeholder:text-black/35
                  transition
                  focus:border-black
                  focus:bg-white
                  focus:ring-1
                  focus:ring-black
                "
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-black">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter your email"
                autoComplete="email"
                className="
                  h-10
                  w-full
                  rounded-lg
                  border
                  border-black/15
                  bg-[#f7f7f7]
                  px-3.5
                  text-sm
                  text-black
                  outline-none
                  placeholder:text-black/35
                  transition
                  focus:border-black
                  focus:bg-white
                  focus:ring-1
                  focus:ring-black
                "
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-black">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Create a password (min 6 characters)"
                autoComplete="new-password"
                className="
                  h-10
                  w-full
                  rounded-lg
                  border
                  border-black/15
                  bg-[#f7f7f7]
                  px-3.5
                  text-sm
                  text-black
                  outline-none
                  placeholder:text-black/35
                  transition
                  focus:border-black
                  focus:bg-white
                  focus:ring-1
                  focus:ring-black
                "
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-black">
                Confirm Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Confirm your password"
                autoComplete="new-password"
                className="
                  h-10
                  w-full
                  rounded-lg
                  border
                  border-black/15
                  bg-[#f7f7f7]
                  px-3.5
                  text-sm
                  text-black
                  outline-none
                  placeholder:text-black/35
                  transition
                  focus:border-black
                  focus:bg-white
                  focus:ring-1
                  focus:ring-black
                "
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2 pt-1 text-[11px] text-black/60">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => {
                  setAgreeTerms(e.target.checked);
                  if (error) setError("");
                }}
                id="terms-checkbox"
                className="
                  mt-0.5
                  h-3.5
                  w-3.5
                  cursor-pointer
                  accent-black
                "
              />

              <label htmlFor="terms-checkbox" className="cursor-pointer select-none">
                I agree to the{" "}
                <span className="font-medium text-black underline underline-offset-2">
                  Terms & Conditions
                </span>
              </label>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                mt-2
                h-11
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
                disabled:opacity-50
              "
            >
              {isLoading ? "Creating Account..." : "Register"}
            </button>
          </form>

          {/* Login */}
          <p className="mt-6 text-center text-[11px] text-black/50">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login", { state: location.state })}
              className="
                font-semibold
                text-black
                underline
                underline-offset-2
                transition
                hover:text-black/60
              "
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
