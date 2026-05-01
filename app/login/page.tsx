"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { iniciarSesion } from "@/lib/firebaseService";
import { obtenerUsuario } from "@/lib/firebaseService";
import { FirebaseError } from "firebase/app";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await iniciarSesion(formData.email, formData.password);
      const usuario = await obtenerUsuario(user.uid);

      if (!usuario) {
        setError("Usuario no encontrado");
        return;
      }

      switch (usuario.role) {
        case "admin":
          router.push("/admin/dashboard");
          break;
        case "pre-cliente":
          // Redireccionar inmediatamente a la tienda del usuario
          (async () => {
            try {
              // Obtener tiendas del usuario para determinar su URL dinámica
              const response = await fetch(`/api/tiendas?userId=${user.uid}`);
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              // Verificar que la respuesta sea JSON antes de parsear
              const contentType = response.headers.get('content-type');
              if (!contentType || !contentType.includes('application/json')) {
                throw new Error('La respuesta no es JSON');
              }
              
              const data = await response.json();
              
              if (data.tiendas && data.tiendas.length > 0) {
                // Generar slug para la primera tienda
                const tienda = data.tiendas[0];
                const tiendaSlug = tienda.nombre
                  .toLowerCase()
                  .replace(/[^a-z0-9\s-]/g, '')
                  .replace(/\s+/g, '-')
                  .replace(/-+/g, '-')
                  .trim();
                
                // Redirección inmediata
                window.location.href = `/${tiendaSlug}`;
              } else {
                // Si no tiene tiendas, redirigir al fallback
                router.push("/mi-tienda");
              }
            } catch (error) {
              // En caso de error, redirigir al fallback
              router.push("/mi-tienda");
            }
          })();
          break;
        case "cliente":
          router.push("/cliente/dashboard");
          break;
        default:
          router.push("/");
      }
    } catch (err) {
      const firebaseError = err as FirebaseError;
      if (
        firebaseError.code === "auth/user-not-found" ||
        firebaseError.code === "auth/wrong-password"
      ) {
        setError("Email o contraseña incorrectos");
      } else {
        setError(firebaseError.message || "Error al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: "2s"}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: "4s"}}></div>
      </div>

      <div className="w-full max-w-md md:max-w-5xl relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center justify-items-center md:justify-items-start">
          {/* Left Side - Hero Section */}
          <div className="hidden md:block text-white space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-6xl font-black bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent leading-tight">
                Bienvenido a Nexel
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed">
                Tu plataforma completa para crear y gestionar tiendas virtuales profesionales
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="space-y-4 pt-4">
              <div className="flex gap-4 group cursor-pointer">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xl transform group-hover:scale-110 transition-transform">
                  🚀
                </div>
                <div>
                  <h3 className="font-bold text-lg">Crea en minutos</h3>
                  <p className="text-slate-400">Sin necesidad de código o experiencia técnica</p>
                </div>
              </div>

              <div className="flex gap-4 group cursor-pointer">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-xl transform group-hover:scale-110 transition-transform">
                  🎁
                </div>
                <div>
                  <h3 className="font-bold text-lg">30 días gratis</h3>
                  <p className="text-slate-400">Prueba todas las funcionalidades sin costo</p>
                </div>
              </div>

              <div className="flex gap-4 group cursor-pointer">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl transform group-hover:scale-110 transition-transform">
                  ⚡
                </div>
                <div>
                  <h3 className="font-bold text-lg">Soporte 24/7</h3>
                  <p className="text-slate-400">Equipo listo para ayudarte en cualquier momento</p>
                </div>
              </div>

              <div className="flex gap-4 group cursor-pointer">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-xl transform group-hover:scale-110 transition-transform">
                  📊
                </div>
                <div>
                  <h3 className="font-bold text-lg">Herramientas potentes</h3>
                  <p className="text-slate-400">Analytics, marketing y más incluidos</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
              <div className="text-center">
                <p className="text-3xl font-bold text-cyan-400">2500+</p>
                <p className="text-sm text-slate-400">Tiendas activas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-cyan-400">98%</p>
                <p className="text-sm text-slate-400">Satisfacción</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-cyan-400">24/7</p>
                <p className="text-sm text-slate-400">Soporte técnico</p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto animate-slide-up">
            <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-2xl rounded-3xl shadow-2xl py-8 px-6 border border-white/15 relative overflow-hidden">
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/0 via-cyan-500/5 to-blue-500/0 pointer-events-none"></div>

              <div className="relative z-10">
                <div className="mb-12">
                  <h2 className="text-4xl font-black text-white mb-3">
                    Bienvenido
                  </h2>
                  <p className="text-slate-300 text-lg">
                    Inicia sesión en tu cuenta
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Email Input */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-3">
                      Correo Electrónico
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="tu@email.com"
                        required
                        className="relative w-full px-6 py-5 bg-slate-900/50 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all backdrop-blur text-base"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                        ✉️
                      </span>
                    </div>
                  </div>

                  {/* Password Input */}
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
                        placeholder="Tu contraseña"
                        required
                        className="relative w-full px-6 py-5 bg-slate-900/50 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all backdrop-blur text-base"
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

                  {/* Error Alert */}
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl text-sm font-medium backdrop-blur">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-500 disabled:to-slate-500 text-white font-bold py-5 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg disabled:shadow-none mt-10 text-base"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span> Iniciando...
                      </span>
                    ) : (
                      "Iniciar Sesión"
                    )}
                  </button>
                </form>

                {/* Footer Links */}
                <div className="mt-10 pt-8 border-t border-white/10 space-y-4">
                  <p className="text-center text-slate-400">
                    ¿No tienes cuenta?{" "}
                    <Link
                      href="/registro"
                      className="font-bold text-cyan-400 hover:text-cyan-300 transition"
                    >
                      Regístrate gratis
                    </Link>
                  </p>
                  <p className="text-xs text-center text-slate-500">
                    Solo usuarios autorizados pueden acceder
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
