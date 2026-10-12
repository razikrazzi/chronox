import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import axios from "axios";

import { store } from "../redux/store";
import {
  initializeUserCart,
  clearUserCart,
} from "../redux/slices/cartSlice";
import {
  initializeUserWishlist,
  clearUserWishlist,
} from "../redux/slices/wishlistSlice";

const AuthContext = createContext();

const API_URL = "http://localhost:3000/users";

const CURRENT_USER_KEY = "chronox_current_user";
const LEGACY_USER_KEY = "user";

/**
 * Normalizes user data retrieved from JSON Server or localStorage.
 * Ensures role is preserved: "admin" for administrators, and the
 * customer's original role (e.g. "user" or "customer") for regular users.
 */
export function normalizeUser(userData) {
  if (!userData) return null;

  const rawRole = String(userData.role || "user").toLowerCase().trim();
  const role = rawRole === "admin" ? "admin" : (userData.role || "user");

  return {
    id: String(userData.id),
    name: userData.name || (role === "admin" ? "Admin" : "Member"),
    email: userData.email,
    role,
  };
}

/**
 * Safely loads the stored user from localStorage.
 */
function getStoredCurrentUser() {
  try {
    const raw =
      localStorage.getItem(CURRENT_USER_KEY) ||
      localStorage.getItem(LEGACY_USER_KEY);

    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalizeUser(parsed);
  } catch {
    return null;
  }
}

/**
 * Safely persists the user in localStorage.
 */
function saveStoredCurrentUser(userData) {
  try {
    const serialized = JSON.stringify(userData);
    localStorage.setItem(CURRENT_USER_KEY, serialized);
    localStorage.setItem(LEGACY_USER_KEY, serialized);
  } catch (err) {
    console.error("Failed to save user session to localStorage:", err);
  }
}

/**
 * Clears stored user session from localStorage.
 */
function clearStoredCurrentUser() {
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
  } catch (err) {
    console.error("Failed to clear user session from localStorage:", err);
  }
}

export function AuthProvider({ children }) {
  // Initialize with stored user (if present)
  const [user, setUser] = useState(() => {
    const initial = getStoredCurrentUser();
    if (initial?.id) {
      store.dispatch(initializeUserCart(initial.id));
      store.dispatch(initializeUserWishlist(initial.id));
    }
    return initial;
  });

  // If a stored session exists, start in loading state to verify role with backend
  const [loading, setLoading] = useState(() => {
    const stored = getStoredCurrentUser();
    return Boolean(stored?.id);
  });

  // Verify and re-authenticate the stored user with JSON Server on initial mount
  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      const stored = getStoredCurrentUser();

      if (!stored?.id) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        // Retrieve fresh user record from JSON Server to confirm current role & existence
        const response = await axios.get(`${API_URL}/${stored.id}`);

        if (cancelled) return;

        if (response.data && response.data.id) {
          const freshUser = normalizeUser(response.data);
          setUser(freshUser);
          saveStoredCurrentUser(freshUser);

          store.dispatch(initializeUserCart(freshUser.id));
          store.dispatch(initializeUserWishlist(freshUser.id));
        } else {
          // Record not valid, invalidate session
          clearStoredCurrentUser();
          setUser(null);
          store.dispatch(clearUserCart());
          store.dispatch(clearUserWishlist());
        }
      } catch (err) {
        if (cancelled) return;

        // If user was removed from backend (404), clear stale credentials
        if (err.response?.status === 404) {
          clearStoredCurrentUser();
          setUser(null);
          store.dispatch(clearUserCart());
          store.dispatch(clearUserWishlist());
        } else {
          // If server is unreachable/offline, retain normalized stored user safely without crashing
          console.warn("Could not verify session with backend:", err.message);
          const normalized = normalizeUser(stored);
          setUser(normalized);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    verifySession();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Login using users stored in JSON Server.
   * Compares email case-insensitively and preserves exact db role.
   */
  const login = async (credentials) => {
    const { email, password } = credentials || {};

    if (!email || !email.trim()) {
      return {
        success: false,
        message: "Email is required.",
      };
    }

    if (!password) {
      return {
        success: false,
        message: "Password is required.",
      };
    }

    setLoading(true);

    try {
      // Fetch users list from JSON Server
      const response = await axios.get(API_URL);
      const usersList = Array.isArray(response.data) ? response.data : [];

      const normalizedInputEmail = email.trim().toLowerCase();

      // Find user case-insensitively
      const matchedUser = usersList.find(
        (storedUser) =>
          storedUser.email &&
          storedUser.email.trim().toLowerCase() === normalizedInputEmail &&
          String(storedUser.password) === String(password)
      );

      if (!matchedUser) {
        return {
          success: false,
          message: "Invalid email or password. Please try again.",
        };
      }

      // Preserve actual role from backend
      const userData = normalizeUser(matchedUser);

      setUser(userData);
      saveStoredCurrentUser(userData);

      // Initialize cart and wishlist for authenticated user
      store.dispatch(initializeUserCart(userData.id));
      store.dispatch(initializeUserWishlist(userData.id));

      return {
        success: true,
        user: userData,
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message:
          "Unable to connect to the server. Please ensure JSON Server is running.",
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register a new customer in JSON Server.
   */
  const register = async ({ name, email, password }) => {
    if (!name || !name.trim()) {
      return {
        success: false,
        message: "Name is required.",
      };
    }

    if (!email || !email.trim()) {
      return {
        success: false,
        message: "Email is required.",
      };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return {
        success: false,
        message: "Please enter a valid email address.",
      };
    }

    if (!password) {
      return {
        success: false,
        message: "Password is required.",
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        message: "Password must be at least 6 characters.",
      };
    }

    setLoading(true);

    try {
      // Check whether email already exists
      const existingResponse = await axios.get(API_URL);
      const usersList = Array.isArray(existingResponse.data)
        ? existingResponse.data
        : [];

      const existingUser = usersList.find(
        (storedUser) =>
          storedUser.email &&
          storedUser.email.trim().toLowerCase() === normalizedEmail
      );

      if (existingUser) {
        return {
          success: false,
          message: "An account with this email already exists. Please log in.",
        };
      }

      // Create new customer account in JSON Server
      const response = await axios.post(API_URL, {
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: "user",
        createdAt: new Date().toISOString(),
      });

      const sessionUser = normalizeUser(response.data);

      setUser(sessionUser);
      saveStoredCurrentUser(sessionUser);

      store.dispatch(initializeUserCart(sessionUser.id));
      store.dispatch(initializeUserWishlist(sessionUser.id));

      return {
        success: true,
        user: sessionUser,
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        message:
          "Registration failed. Check whether JSON Server is running.",
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout and clear the current session.
   */
  const logout = () => {
    clearStoredCurrentUser();
    setUser(null);
    store.dispatch(clearUserCart());
    store.dispatch(clearUserWishlist());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: Boolean(user?.id),
        isAdmin: user?.role === "admin",
        loading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export default AuthContext;
