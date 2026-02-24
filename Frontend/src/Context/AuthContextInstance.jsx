import { createContext } from "react";

/**
 * AuthContext holds the authenticated user, helper methods and state flags.
 * The actual logic lives in `AuthContext.jsx`; this file only exports the context
 * to avoid circular dependencies when hooks/components consume it.
 */
const AuthContext = createContext({
  user: null,
  login: async () => ({ success: false }),
  logout: async () => {},
  isAuthenticated: false,
  isLoading: true,
});

export default AuthContext;
