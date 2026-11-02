
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getAccessToken, setAccessToken } from "@/lib/api";
import { getCurrentUser } from "@/features/auth/services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(
    () =>
      Boolean(
        getAccessToken() || sessionStorage.getItem("attendance_access_token"),
      ),
  );
  const [authError, setAuthError] = useState("");
  const sessionVersion = useRef(0);

  const restoreSession = useCallback(async () => {
    const version = ++sessionVersion.current;
    const token =
      getAccessToken() || sessionStorage.getItem("attendance_access_token");
    if (!token) {
      return;
    }

    setAccessToken(token);
    try {
      const currentUser = await getCurrentUser();
      if (sessionVersion.current === version) {
        setUser(currentUser);
        setAuthError("");
      }
    } catch (error) {
      if (sessionVersion.current === version) {
        if (error.status === 401 || error.status === 403) {
          setAccessToken(null);
          setUser(null);
        } else {
          setAuthError(error.message || "Unable to restore your session.");
        }
      }
    } finally {
      if (sessionVersion.current === version) {
        setIsLoading(false);
      }
    }
  }, []);

  const retrySession = useCallback(() => {
    setIsLoading(true);
    setAuthError("");
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback((authenticatedUser) => {
    sessionVersion.current += 1;
    setUser(authenticatedUser);
    setAuthError("");
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    sessionVersion.current += 1;
    setAccessToken(null);
    setUser(null);
    setAuthError("");
    setIsLoading(false);
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, isLoading, authError, retrySession }),
    [user, login, logout, isLoading, authError, retrySession],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
