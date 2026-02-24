import { useContext } from "react";
import AuthContext from "../Context/AuthContextInstance";

/**
 * useAuth
 * Custom hook to consume the AuthContext.
 * Must be used within a component wrapped by AuthProvider.
 *
 * @returns {object} Auth context value containing user, login, logout, etc.
 */
const useAuth = () => {
  const context = useContext(AuthContext);

  // Guard: prevent usage outside of AuthProvider
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export default useAuth;
