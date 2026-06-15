"use client"

import { createContext, useContext, useEffect, useState } from "react"

const ThemeProviderContext = createContext({
  theme: "light",
  isDark: false,
  setTheme: () => null,
})

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "catalance-theme",
  ...props
}) {
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored === "light" || stored === "dark") return stored
    return defaultTheme === "dark" ? "dark" : "light"
  })

  const [isDark, setIsDark] = useState(theme === "dark")

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    setIsDark(theme === "dark")
    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    isDark,
    setTheme: (newTheme) => {
      if (newTheme !== "light" && newTheme !== "dark") return
      localStorage.setItem(storageKey, newTheme)
      setThemeState(newTheme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
