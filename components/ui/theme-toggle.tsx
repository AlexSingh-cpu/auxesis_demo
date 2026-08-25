"use client";

import { useCallback, useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { DEFAULT_THEME, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";
import { IconButton } from "./button";

/** The root element class is the source of truth, since the pre-hydration
 *  script sets it before React ever runs. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

function getServerSnapshot(): Theme {
  return DEFAULT_THEME;
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next: Theme = getSnapshot() === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage is unavailable in some private modes. The toggle still works
      // for the current session.
    }
  }, []);

  return (
    <IconButton
      label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggle}
      className={className}
    >
      {theme === "dark" ? <MoonIcon size={18} /> : <SunIcon size={18} />}
    </IconButton>
  );
}
