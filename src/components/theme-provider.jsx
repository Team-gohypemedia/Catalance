import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const initialState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem(storageKey) || defaultTheme
  );
  const location = useLocation();

  const DASHBOARD_PREFIXES = ["/client", "/project-manager", "/freelancer", "/admin"];
  const isDashboard = DASHBOARD_PREFIXES.some(prefix => location.pathname.startsWith(prefix));

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    // Force Light Mode on non-dashboard routes
    if (!isDashboard) {
      root.classList.add("light");
      return;
    }

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme, isDashboard]);

  const value = {
    theme: isDashboard ? theme : "light",
    setTheme: (newTheme) => {
      // Only allow theme changes if we are in a dashboard context
      // OR if the user is forcing a change (though UI should hide it otherwise)
      // We'll trust the UI to hide the toggle, but here we can just update storage always
      // so preference persists when they eventually log in.
      localStorage.setItem(storageKey, newTheme);
      setThemeState(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
