import { Navigate, useLocation } from "react-router-dom";

/**
 * ProtectedRoute
 * Guards routes that require authentication.
 * Redirects unauthenticated users to the login page ("/").
 * Allows public paths like /reset-password to bypass the auth check.
 *
 * @param {React.ReactNode} children - The route component to render if access is granted
 */
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("AUTH_TOKEN");
  const location = useLocation();

  // Allow the reset-password flow without requiring an active session
  if (location.pathname.startsWith("/reset-password")) {
    return children;
  }

  // Redirect unauthenticated users to the login page, preserving no back-history
  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}
