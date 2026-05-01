"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registrarUsuario } from "@/lib/firebaseService";
import { FirebaseError } from "firebase/app";
import { UserRole } from "@/lib/types";

type RolInvitado = Extract<UserRole, "pre-cliente" | "cliente">;

export default function RegistroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState<RolInvitado | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    nombre: "",
    apellido: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "email") {
      setUserRole(null);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resolverRolInvitado = async (email: string): Promise<RolInvitado> => {
    const response = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No fue posible validar la invitacion");
    }

    if (data.isPermitted && (data.role === "pre-cliente" || data.role === "cliente")) {
      return data.role;
    }

    throw new Error(
      "Este email no tiene una invitacion activa. Contacta al equipo de Nexel para obtener acceso +5939 63328168."
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!formData.nombre.trim() || !formData.apellido.trim()) {
      setError("Por favor completa tu nombre y apellido");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const role = await resolverRolInvitado(formData.email);
      setUserRole(role);

      await registrarUsuario(
        formData.email,
        formData.password,
        formData.nombre.trim(),
        formData.apellido.trim(),
        role
      );

      if (role === "pre-cliente") {
        router.push("/mi-tienda");
      } else {
        router.push("/cliente/dashboard");
      }
    } catch (err) {
      const firebaseError = err as FirebaseError;
      if (firebaseError.code === "auth/email-already-in-use") {
        setError("Este email ya está registrado");
      } else if (firebaseError.code === "auth/weak-password") {
        setError("La contraseña es muy débil");
      } else {
        setError(firebaseError.message || "Error al registrar usuario");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="w-full max-w-md md:max-w-5xl relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-start md:items-center justify-items-center md:justify-items-start">
          <div className="hidden md:block text-white space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-6xl font-black bg-gradient-to-r from-green-300 via-cyan-300 to-green-300 bg-clip-text text-transparent leading-tight">
                Comienza hoy
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed">
                Crea tu tienda virtual profesional en pocos minutos
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex gap-4 group cursor-pointer">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-xl transform group-hover:scale-110 transition-transform">
                  ✨
                </div>
                <div>
                  <h3 className="font-bold text-lg">Fácil de usar</h3>
                  <p className="text-slate-400">
                    Interfaz intuitiva, sin necesidad de código
                  </p>
                </div>
              </div>

              <div className="flex gap-4 group cursor-pointer">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-xl transform group-hover:scale-110 transition-transform">
                  🎁
                </div>
                <div>
                  <h3 className="font-bold text-lg">30 días gratis</h3>
                  <p className="text-slate-400">
                    Prueba todas las funcionalidades sin pagar
                  </p>
                </div>
              </div>

              <div className="flex gap-4 group cursor-pointer">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-xl transform group-hover:scale-110 transition-transform">
                  🚀
                </div>
                <div>
                  <h3 className="font-bold text-lg">Lanza rápido</h3>
                  <p className="text-slate-400">
                    Tu tienda lista en minutos, no semanas
                  </p>
                </div>
              </div>

              <div className="flex gap-4 group cursor-pointer">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl transform group-hover:scale-110 transition-transform">
                  💬
                </div>
                <div>
                  <h3 className="font-bold text-lg">Soporte premium</h3>
                  <p className="text-slate-400">Equipo dedicado para tu éxito</p>
                </div>
              </div>
            </div>

            {userRole && (
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-xl p-5 backdrop-blur mt-8">
                <p className="text-green-300 font-bold mb-1">✓ Invitación encontrada</p>
                <p className="text-sm text-green-200">
                  {formData.email} se registrará como{" "}
                  <span className="font-semibold">{userRole}</span>
                </p>
              </div>
            )}
          </div>

          <div className="w-full max-w-md mx-auto animate-slide-up">
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-2xl rounded-3xl shadow-2xl py-6 px-4 border border-white/15 relative overflow-hidden">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-green-500/0 via-cyan-500/5 to-green-500/0 pointer-events-none"></div>

              <div className="relative z-10">
                <div className="mb-10 space-y-3">
                  <h2 className="text-3xl font-black text-white">Crear Cuenta</h2>
                  <p className="text-sm text-slate-400">
                    La validación es por invitación. No necesitas verificar tu
                    email antes.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-1">
                      Correo Electrónico
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/20 to-cyan-500/20 blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="tu@email.com"
                        required
                        className="relative w-full px-6 py-5 bg-slate-900/50 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all backdrop-blur text-base"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                        ✉️
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">
                      Solo necesitas una invitación aprobada.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-200 mb-3">
                        Nombre
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                        <input
                          type="text"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleChange}
                          placeholder="Juan"
                          required
                          className="relative w-full px-6 py-5 bg-slate-900/50 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur text-base"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-200 mb-3">
                        Apellido
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                        <input
                          type="text"
                          name="apellido"
                          value={formData.apellido}
                          onChange={handleChange}
                          placeholder="Perez"
                          required
                          className="relative w-full px-6 py-5 bg-slate-900/50 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur text-base"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-3">
                      Contraseña
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Mínimo 6 caracteres"
                        required
                        className="relative w-full px-6 py-5 bg-slate-900/50 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition text-xl"
                      >
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-3">
                      Confirmar Contraseña
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirma tu contraseña"
                        required
                        className="relative w-full px-6 py-5 bg-slate-900/50 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur text-base"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl text-sm font-medium backdrop-blur">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-500 disabled:to-slate-500 text-white font-bold py-5 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg disabled:shadow-none text-base"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span> Creando...
                      </span>
                    ) : (
                      "Crear Cuenta"
                    )}
                  </button>
                </form>

                <div className="mt-10 pt-8 border-t border-white/10 space-y-3">
                  <p className="text-center text-slate-400 text-sm">
                    ¿Ya tienes cuenta?{" "}
                    <Link
                      href="/login"
                      className="font-bold text-cyan-400 hover:text-cyan-300 transition"
                    >
                      Inicia sesión
                    </Link>
                  </p>
                  <p className="text-xs text-center text-slate-500">
                    Solo usuarios con invitación pueden registrarse
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
