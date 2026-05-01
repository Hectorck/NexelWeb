"use client";

import React from "react";
import { useAuth } from "./AuthContext";
import { useRouter } from "next/navigation";
import { UserRole } from "./types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  fallback,
}) => {
  const { isAuthenticated, usuario, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  if (!isAuthenticated) {
    router.push("/login");
    return fallback || <div>Redirigiendo al login...</div>;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(usuario?.role as UserRole)) {
    return fallback || <div>No tienes permiso para acceder a esta página</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
