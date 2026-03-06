import { createContext, useContext, useEffect } from "react";

const initialState = {
  theme: "dark",
  setTheme: () => null,
};

const ThemeProviderContext = createContext(initialState);

export function ThemeProvider({
  children,
  storageKey = "vite-ui-theme",
  ...props
}) {
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add("dark");
    localStorage.setItem(storageKey, "dark");
  }, [storageKey]);

  const value = {
    theme: "dark",
    setTheme: () => {
      localStorage.setItem(storageKey, "dark");
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
