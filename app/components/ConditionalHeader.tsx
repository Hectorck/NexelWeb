"use client";

import { useAuth } from "@/lib/AuthContext";
import Header from "./Header";

export default function ConditionalHeader() {
  const { usuario, loading } = useAuth();

  // Solo muestra el Header si el usuario NO está autenticado
  if (loading) return null;
  if (usuario) return null;

  return <Header />;
}
