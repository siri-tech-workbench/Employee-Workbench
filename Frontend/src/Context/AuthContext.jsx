import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "./AuthContextInstance";
import { loginUser } from "../Services/authServices";
import { encryptData, decryptData } from "../utils/secureStorage";
import {
  endSession,
  setupActivityListeners,
  removeActivityListeners,
  startSession,
} from "../utils/sessionManager";
import Loading from "../Components/loading";

const SESSION_KEY = "userSession";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Reads and decrypts the persisted session on app load.
   * Restores the user state if a valid token exists, otherwise clears it.
   */
  const hydrateSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const session = await decryptData(SESSION_KEY);
      if (session?.token) {
        setUser(session);
        startSession();
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to hydrate session:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clears session data from storage and state, then ends the activity timer.
   * Called on explicit logout and on sessionExpired events.
   */
  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    try {
      localStorage.removeItem("Navigation_state");
      localStorage.removeItem("sessionKey");
      setUser(null);
      endSession();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Authenticates credentials against the API.
   * On success, encrypts and persists the session payload.
   * Returns { success: true } or { success: false, error: string }.
   */
  const handleLogin = useCallback(async (username, password) => {
    setIsLoading(true);
    try {
      const result = await loginUser(username, password);

      if (result?.Status === 1) {
        const sessionPayload = {
          ...result.data.user,
          token: result.data.token,
        };
        await encryptData(SESSION_KEY, sessionPayload);
        localStorage.setItem("Navigation_state", true);
        setUser(sessionPayload);
        startSession();
        return { success: true };
      }

      return {
        success: false,
        error: result?.Message || "Invalid login credentials",
      };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Login failed" };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hydrate session on mount, wire up activity listeners, and listen for
  // session expiry events dispatched by the sessionManager utility
  useEffect(() => {
    hydrateSession();
    setupActivityListeners();

    window.addEventListener("sessionExpired", handleLogout);

    return () => {
      removeActivityListeners();
      window.removeEventListener("sessionExpired", handleLogout);
    };
  }, [handleLogout, hydrateSession]);

  const contextValue = useMemo(
    () => ({
      user,
      login: handleLogin,
      logout: handleLogout,
      isAuthenticated: Boolean(user),
      isLoading,
    }),
    [handleLogin, handleLogout, isLoading, user],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

/**
 * PrivateRoute
 *
 * Wraps protected routes. Redirects unauthenticated users to the root path
 * and renders a loading indicator while the session is being verified.
 */
export function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect to login once loading is complete and no session exists
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return <Loading text="Checking access" />;
  }

  // Return null while redirect is in flight to avoid rendering protected content
  if (!isAuthenticated) {
    return null;
  }

  return children;
}
