import { createContext, useContext, useState } from "react";

// Context for sharing the active menu state across the component tree
const MenuContext = createContext(null);

/**
 * MenuProvider
 * Wraps the application (or a section of it) to provide access to the current menu state.
 *
 * @param {React.ReactNode} children - Child components that need menu context
 */
export const MenuProvider = ({ children }) => {
  // Tracks the currently active/selected menu item or menu object
  const [currentMenu, setCurrentMenu] = useState(null);

  return (
    <MenuContext.Provider value={{ currentMenu, setCurrentMenu }}>
      {children}
    </MenuContext.Provider>
  );
};

/**
 * useMenu
 * Custom hook to consume the MenuContext.
 * Must be used within a component wrapped by MenuProvider.
 *
 * @returns {{ currentMenu: object|null, setCurrentMenu: Function }}
 */
export const useMenu = () => {
  const context = useContext(MenuContext);

  // Guard: prevent usage outside of MenuProvider
  if (context === null) {
    throw new Error("useMenu must be used within a MenuProvider");
  }

  return context;
};
