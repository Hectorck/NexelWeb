"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { usuario, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    // Si no hay usuario o no es admin, redirigir
    if (!usuario || usuario.role !== "admin") {
      router.push("/");
    }
  }, [usuario, loading, router]);

  if (loading || !usuario || usuario.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
