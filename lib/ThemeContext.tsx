"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface ThemeColors {
  bgPrimary: string; // Fondo principal
  bgSecondary: string; // Fondo secundario
  bgAccent: string; // Fondo de acentos
  textPrimary: string; // Texto principal
  textSecondary: string; // Texto secundario
  buttonBg: string; // Fondo de botones
  buttonText: string; // Texto de botones
  borderColor: string; // Color de bordes
  accentColor: string; // Color de acento
  whatsappColor: string; // Color de WhatsApp
}

export interface ThemeConfig {
  light: ThemeColors;
  dark: ThemeColors;
  currentTheme: "light" | "dark";
}

interface ThemeContextType {
  themeConfig: ThemeConfig | null;
  updateTheme: (newTheme: Partial<ThemeConfig>) => Promise<void>;
  currentColors: ThemeColors | null;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const DEFAULT_LIGHT_THEME: ThemeColors = {
  bgPrimary: "#ffffff",
  bgSecondary: "#f5f5f5",
  bgAccent: "#f0f4ff",
  textPrimary: "#1f2937",
  textSecondary: "#6b7280",
  buttonBg: "#3b82f6",
  buttonText: "#ffffff",
  borderColor: "#e5e7eb",
  accentColor: "#06b6d4",
  whatsappColor: "#25d366",
};

export const DEFAULT_DARK_THEME: ThemeColors = {
  bgPrimary: "#0f172a",
  bgSecondary: "#1e293b",
  bgAccent: "#1e3a8a",
  textPrimary: "#f1f5f9",
  textSecondary: "#cbd5e1",
  buttonBg: "#0ea5e9",
  buttonText: "#ffffff",
  borderColor: "#334155",
  accentColor: "#06b6d4",
  whatsappColor: "#128c7e",
};

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  light: DEFAULT_LIGHT_THEME,
  dark: DEFAULT_DARK_THEME,
  currentTheme: "dark",
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario } = useAuth();
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario?.uid) {
      setThemeConfig(DEFAULT_THEME_CONFIG);
      setLoading(false);
      return;
    }

    cargarTema();
  }, [usuario?.uid]);

  const cargarTema = async () => {
    try {
      setLoading(true);
      const temaDoc = await getDoc(doc(db, "usuarios", usuario!.uid, "preferencias", "tema"));

      if (temaDoc.exists()) {
        setThemeConfig(temaDoc.data() as ThemeConfig);
      } else {
        setThemeConfig(DEFAULT_THEME_CONFIG);
      }
    } catch (error) {
      console.error("Error cargando tema:", error);
      setThemeConfig(DEFAULT_THEME_CONFIG);
    } finally {
      setLoading(false);
    }
  };

  const updateTheme = async (newTheme: Partial<ThemeConfig>) => {
    try {
      const updated = { ...themeConfig, ...newTheme } as ThemeConfig;
      setThemeConfig(updated);

      if (usuario?.uid) {
        await setDoc(doc(db, "usuarios", usuario.uid, "preferencias", "tema"), updated);
      }
    } catch (error) {
      console.error("Error guardando tema:", error);
    }
  };

  const currentColors = themeConfig ? themeConfig[themeConfig.currentTheme] : null;

  return (
    <ThemeContext.Provider value={{ themeConfig, updateTheme, currentColors, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe ser usado dentro de ThemeProvider");
  }
  return context;
};
