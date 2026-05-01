"use client";
import React, { useEffect, useState } from "react";
import { themeManager } from "./themeManager";
import { Icons } from "./Icons";

const ThemeToggle = () => {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    setTheme(themeManager.getTheme());
    const handler = (e) => setTheme(e.detail.theme);
    window.addEventListener("theme-changed", handler);
    return () => window.removeEventListener("theme-changed", handler);
  }, []);

  const handleToggleTheme = () => {
    themeManager.toggleTheme();
    setTheme(themeManager.getTheme());
  };

  return (
    <button
      className="p-2 rounded-lg dark:hover:bg-white/10 hover:bg-gray-100 transition-colors"
      onClick={handleToggleTheme}
      title="Cambiar tema"
    >
      {theme === "dark" ? Icons.dark_mode : Icons.light_mode}
    </button>
  );
};

export default ThemeToggle;
