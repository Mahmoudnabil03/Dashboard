import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export function currentTheme() {
  try {
    const saved = localStorage.getItem("sh-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return "dark";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => (typeof document !== "undefined" && document.documentElement.dataset.theme) || currentTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("sh-theme", theme); } catch {}
  }, [theme]);

  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      onClick={() => setTheme(next)}
      className="flex items-center px-4 py-3 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition w-full rounded-xl"
      aria-label={"Switch to " + next + " mode"}
      title={"Switch to " + next + " mode"}
    >
      {theme === "dark" ? <Sun size={20} className="mr-3" /> : <Moon size={20} className="mr-3" />}
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
