import { useState, useEffect, useCallback } from "react";

export type ThemePreference = "light" | "dark" | "system";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

function getInitialPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const savedPref = localStorage.getItem("sf_theme_preference");
    if (savedPref === "light" || savedPref === "dark" || savedPref === "system") {
      return savedPref;
    }
    const savedSync = localStorage.getItem("sf_system_sync");
    if (savedSync === "true") {
      return "system";
    }
    const savedTheme = localStorage.getItem("sf_theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
  } catch {}
  return "system";
}

export function useThemeConfig() {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(getInitialPreference);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(getSystemTheme);
  const [themeSchedule, setThemeSchedule] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("sf_theme_schedule") === "true";
    } catch {
      return false;
    }
  });

  // Listen for OS prefers-color-scheme changes and cross-component preference updates
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    const handleCustomPrefChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ preference?: ThemePreference }>;
      const nextPref = customEvent.detail?.preference;
      if (nextPref === "light" || nextPref === "dark" || nextPref === "system") {
        setThemePreferenceState(nextPref);
      }
    };

    mediaQuery.addEventListener("change", handleMediaChange);
    window.addEventListener("sf_theme_preference_change", handleCustomPrefChange);
    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.removeEventListener("sf_theme_preference_change", handleCustomPrefChange);
    };
  }, []);

  // Resolve effective theme ('light' | 'dark')
  const resolvedTheme: "light" | "dark" = (() => {
    if (themePreference === "system") {
      if (themeSchedule && typeof window !== "undefined") {
        const hour = new Date().getHours();
        if (hour >= 18 || hour < 6) return "dark";
      }
      return systemTheme;
    }
    return themePreference;
  })();

  const systemSync = themePreference === "system";

  // Synchronize DOM classes, color-scheme, and localStorage
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
      root.dataset.theme = "dark";
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.dataset.theme = "light";
      root.style.colorScheme = "light";
    }
    root.dataset.themePreference = themePreference;

    try {
      localStorage.setItem("sf_theme", resolvedTheme);
      localStorage.setItem("sf_theme_preference", themePreference);
      localStorage.setItem("sf_system_sync", String(themePreference === "system"));
    } catch {}
  }, [resolvedTheme, themePreference]);

  const setThemePreference = useCallback((pref: ThemePreference) => {
    setThemePreferenceState(pref);
    if (pref === "system") {
      setSystemTheme(getSystemTheme());
    }
    try {
      localStorage.setItem("sf_theme_preference", pref);
      localStorage.setItem("sf_system_sync", String(pref === "system"));
      if (pref !== "system") {
        localStorage.setItem("sf_theme", pref);
      }
      window.dispatchEvent(
        new CustomEvent("sf_theme_preference_change", { detail: { preference: pref } })
      );
    } catch {}
  }, []);

  const setSystemSync = useCallback(
    (sync: boolean) => {
      if (sync) {
        setThemePreference("system");
      } else {
        setThemePreference(resolvedTheme);
      }
    },
    [resolvedTheme, setThemePreference]
  );

  const toggleTheme = useCallback(() => {
    const next: ThemePreference = resolvedTheme === "light" ? "dark" : "light";
    setThemePreference(next);
  }, [resolvedTheme, setThemePreference]);

  return {
    theme: resolvedTheme,
    themePreference,
    setThemePreference,
    toggleTheme,
    systemSync,
    setSystemSync,
    themeSchedule,
    setThemeSchedule,
  };
}
