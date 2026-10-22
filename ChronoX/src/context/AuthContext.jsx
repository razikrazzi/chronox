import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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
  fetchWishlist,
} from "../redux/slices/wishlistSlice";

const AuthContext = createContext(null);

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/api\/?$/, "");
const USERS_URL = `${API_URL}/users`;
const SESSION_KEY = "chronox_user";

/*
 * Development authentication for JSON Server.
 * JSON Server does not provide /auth/me, /auth/login, or /auth/logout.
 *
 * IMPORTANT: This is not production-safe authentication. A production
 * application needs a backend that hashes passwords and verifies sessions.
 */

const normalizeUser = (user) => {
  if (!user) return null;

  return {
    id: String(user.id),
    name: user.name || user.fullName || "",
    email: String(user.email || "").trim().toLowerCase(),
    role: String(user.role || "user").toLowerCase(),
  };
};

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem(SESSION_KEY);
    if (!rawUser) return null;

    return normalizeUser(JSON.parse(rawUser));
  } catch (error) {
    console.error("Could not read the saved ChronoX session:", error);
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

const setPrivateStateForUser = (user) => {
  if (!user) return;

  store.dispatch(initializeUserCart(user.id));
  store.dispatch(initializeUserWishlist(user.id));
  store.dispatch(fetchWishlist(user.id));
};

const clearPrivateState = () => {
  store.dispatch(clearUserCart());
  store.dispatch(clearUserWishlist());
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  const isLoggedIn = Boolean(user);

  useEffect(() => {
    const storedUser = getStoredUser();

    if (storedUser) {
      setUser(storedUser);
      setPrivateStateForUser(storedUser);
    } else {
      setUser(null);
      clearPrivateState();
    }

    setLoading(false);
  }, []);

  const refreshSession = useCallback(async () => {
    const storedUser = getStoredUser();

    if (storedUser) {
      setUser(storedUser);
      setPrivateStateForUser(storedUser);
      return storedUser;
    }

    setUser(null);
    clearPrivateState();
    return null;
  }, []);

  // Supports both login(email, password) and login({ email, password }).
  const login = useCallback(async (emailOrData, passwordArg) => {
    try {
      const email =
        emailOrData && typeof emailOrData === "object"
          ? emailOrData.email
          : emailOrData;
      const password =
        emailOrData && typeof emailOrData === "object"
          ? emailOrData.password
          : passwordArg;

      const normalizedEmail = String(email || "").trim().toLowerCase();
      const normalizedPassword = String(password ?? "");

      if (!normalizedEmail || !normalizedPassword) {
        return {
          success: false,
          message: "Please enter your email and password.",
        };
      }

      // Fetch all records to avoid relying on JSON Server's email filter
      // behaviour and compare email case-insensitively.
      const response = await axios.get(USERS_URL);
      const users = Array.isArray(response.data) ? response.data : [];

      const matchedUser = users.find(
        (item) =>
          String(item.email || item.Email || "")
            .trim()
            .toLowerCase() === normalizedEmail &&
          String(item.password ?? "") === normalizedPassword,
      );

      

      if (!matchedUser) {
        return {
          success: false,
          message: "Invalid email or password.",
        };
      }

       if(matchedUser.blocked === true){
          return {
             success: false,
            message: "this account is blocked",
          }
        }

      const safeUser = normalizeUser(matchedUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      setUser(safeUser);
      setPrivateStateForUser(safeUser);

      return { success: true, user: safeUser };
    } catch (error) {
      console.error("ChronoX login failed:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Unable to connect to the users API. Make sure JSON Server is running on port 3000.",
      };
    }
  }, []);

  // Supports register(name, email, password) and register({ name, email, password }).
  const register = useCallback(
    async (nameOrData, emailArg, passwordArg, extraDataArg = {}) => {
      try {
        const input =
          nameOrData && typeof nameOrData === "object"
            ? nameOrData
            : {
                ...extraDataArg,
                name: nameOrData,
                email: emailArg,
                password: passwordArg,
              };

        const normalizedName = String(
          input.name || input.fullName || "",
        ).trim();
        const normalizedEmail = String(input.email || "")
          .trim()
          .toLowerCase();
        const normalizedPassword = String(input.password || "");

        if (!normalizedName || !normalizedEmail || !normalizedPassword) {
          return {
            success: false,
            message: "Name, email, and password are required.",
          };
        }
        

        const existingResponse = await axios.get(USERS_URL);
        const existingUsers = Array.isArray(existingResponse.data)
          ? existingResponse.data
          : [];

        const emailAlreadyExists = existingUsers.some(
          (item) =>
            String(item.email || item.Email || "")
              .trim()
              .toLowerCase() === normalizedEmail,
        );

       

        if (emailAlreadyExists) {
          return {
            success: false,
            message: "An account with this email already exists.",
          };
        }

        // Do not accept an admin role from public registration data.
        const { id: ignoredId, role: ignoredRole, ...additionalFields } = input;
        const newUser = {
          ...additionalFields,
          name: normalizedName,
          email: normalizedEmail,
          password: normalizedPassword,
          role: "user",
          createdAt: new Date().toISOString(),
        };

        const response = await axios.post(USERS_URL, newUser, {
          headers: { "Content-Type": "application/json" },
        });

        const safeUser = normalizeUser(response.data);
        localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
        setUser(safeUser);
        setPrivateStateForUser(safeUser);

        return { success: true, user: safeUser };
      } catch (error) {
        console.error("ChronoX registration failed:", error);
        return {
          success: false,
          message:
            error.response?.data?.message ||
            "Unable to register. Make sure JSON Server is running on port 3000.",
        };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    clearPrivateState();
    return { success: true };
  }, []);

  const isAdmin = user?.role === "admin";

  const value = useMemo(
    () => ({
      user,
      currentUser: user,
      isLoggedIn,
      isAdmin,
      loading,
      login,
      register,
      logout,
      refreshSession,
    }),
    [user, isLoggedIn, isAdmin, loading, login, register, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}

export default AuthContext;
