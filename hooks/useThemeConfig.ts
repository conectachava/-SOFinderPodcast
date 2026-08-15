import { useState, useEffect } from "react";

export function useThemeConfig() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const savedTheme = localStorage.getItem("sf_theme");
      if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    } catch (e) {}
    return "light";
  });
  const [systemSync, setSystemSync] = useState(() => {
    try { return localStorage.getItem("sf_system_sync") === "true"; } catch (e) { return false; }
  });
  const [themeSchedule, setThemeSchedule] = useState(() => {
    try { return localStorage.getItem("sf_theme_schedule") === "true"; } catch (e) { return false; }
  });

  useEffect(() => {
    // Only keep the DOM class synchronization here
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("sf_theme", theme);
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return { theme, toggleTheme, systemSync, setSystemSync, themeSchedule, setThemeSchedule };
}
