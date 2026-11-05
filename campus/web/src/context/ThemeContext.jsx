import { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * preference: "light" | "dark" | "system" (saved in localStorage "campus-theme")
 * theme: the resolved "light" | "dark" actually applied to <html>
 */
const ThemeContext = createContext({ theme: "light", preference: "system", setPreference: () => {}, setTheme: () => {}, toggleTheme: () => {} });

const KEY = "campus-theme";
const systemTheme = () => (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
const readPreference = () => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "dark" || v === "system" ? v : "light"; // light by default, like Catalance
  } catch {
    return "light";
  }
};

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(readPreference);
  const [system, setSystem] = useState(systemTheme);
  const theme = preference === "system" ? system : preference;

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onChange = () => setSystem(systemTheme());
    mq?.addEventListener?.("change", onChange);
    return () => mq?.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setPreference = useCallback((p) => {
    setPreferenceState(p);
    try {
      localStorage.setItem(KEY, p);
    } catch {
      /* ignore */
    }
  }, []);

  const setTheme = useCallback((t) => setPreference(t), [setPreference]);
  const toggleTheme = useCallback(() => setPreference(theme === "dark" ? "light" : "dark"), [setPreference, theme]);

  return <ThemeContext.Provider value={{ theme, preference, setPreference, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
