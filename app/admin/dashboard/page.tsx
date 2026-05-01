"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  obtenerPreCientes,
  actualizarPreCliente,
  obtenerClientes,
  crearPreCliente,
  cerrarSesion,
  cambiarRolUsuario,
  obtenerUsuario,
} from "@/lib/firebaseService";
import { PreCliente, Cliente } from "@/lib/types";

export default function AdminDashboard() {
  const router = useRouter();
  const { usuario, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"pre-clientes" | "clientes" | "invitar">(
    "pre-clientes"
  );
  const [preClientes, setPreClientes] = useState<(PreCliente & { id: string })[]>([]);
  const [clientes, setClientes] = useState<(Cliente & { rol?: string })[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [message, setMessage] = useState("");
  const [rolDropdownOpen, setRolDropdownOpen] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (usuario?.role !== "admin") {
      router.push("/");
      return;
    }

    cargarDatos();
  }, [loading, usuario, router]);

  const cargarDatos = async () => {
    setLoadingData(true);
    try {
      const preClientesData = await obtenerPreCientes();
      const clientesData = await obtenerClientes();
      
      // Cargar el rol de cada cliente
      const clientesConRol = await Promise.all(
        clientesData.map(async (cliente) => {
          const usuario = await obtenerUsuario(cliente.uid);
          return {
            ...cliente,
            rol: usuario?.role || "cliente",
          };
        })
      );
      
      setPreClientes(preClientesData);
      setClientes(clientesConRol);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInvitar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      await crearPreCliente({
        uid: "",
        email,
        nombre,
        apellido,
        estado: "aprobado",
      });
      setMessage("✓ Invitación enviada exitosamente");
      setEmail("");
      setNombre("");
      setApellido("");
      setTimeout(() => cargarDatos(), 1000);
    } catch (error: any) {
      setMessage("✗ Error al invitar: " + error.message);
    }
  };

  const handleCambiarEstado = async (
    id: string,
    nuevoEstado: "aprobado" | "rechazado" | "convertido"
  ) => {
    try {
      await actualizarPreCliente(id, { estado: nuevoEstado });
      await cargarDatos();
    } catch (error) {
      console.error("Error actualizando estado:", error);
    }
  };

  const handleCambiarRol = async (uid: string, nuevoRol: "cliente" | "pre-cliente") => {
    try {
      await cambiarRolUsuario(uid, nuevoRol);
      await cargarDatos();
      setRolDropdownOpen(null);
    } catch (error) {
      console.error("Error cambiando rol:", error);
    }
  };

  const handleLogout = async () => {
    await cerrarSesion();
    router.push("/");
  };

  if (loading || !usuario) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900/80 to-blue-900/80 backdrop-blur-xl border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">Gestiona clientes y pre-clientes de Nexel</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Tabs */}
        <div className="flex gap-3 mb-8 border-b border-white/10">
          {(["pre-clientes", "clientes", "invitar"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                activeTab === tab
                  ? "border-cyan-500 text-cyan-300 bg-cyan-500/10 rounded-t-lg"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab === "pre-clientes"
                ? "👥 Pre-clientes"
                : tab === "clientes"
                ? "💼 Clientes"
                : "✉️ Invitar Usuario"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
          {/* PRE-CLIENTES */}
          {activeTab === "pre-clientes" && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Pre-clientes</h2>
              {loadingData ? (
                <p className="text-slate-400">Cargando...</p>
              ) : preClientes.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No hay pre-clientes</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-4 px-4 text-slate-300 font-semibold">Email</th>
                        <th className="text-left py-4 px-4 text-slate-300 font-semibold">Nombre</th>
                        <th className="text-left py-4 px-4 text-slate-300 font-semibold">Estado</th>
                        <th className="text-center py-4 px-4 text-slate-300 font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preClientes.map((pc) => (
                        <tr
                          key={pc.id}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                        >
                          <td className="py-4 px-4 text-white">{pc.email}</td>
                          <td className="py-4 px-4 text-slate-200">
                            {pc.nombre} {pc.apellido}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                pc.estado === "aprobado"
                                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                  : pc.estado === "rechazado"
                                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                  : pc.estado === "convertido"
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                              }`}
                            >
                              {pc.estado === "aprobado" && "✓"}
                              {pc.estado === "rechazado" && "✗"}
                              {pc.estado === "convertido" && "→"}
                              {pc.estado === "pendiente" && "⏳"}
                              {" " + pc.estado}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex justify-center gap-2">
                              {pc.estado !== "convertido" && pc.estado !== "rechazado" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleCambiarEstado(pc.id, "aprobado")
                                    }
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200"
                                  >
                                    Aprobar
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleCambiarEstado(pc.id, "rechazado")
                                    }
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200"
                                  >
                                    Rechazar
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleCambiarEstado(pc.id, "convertido")
                                    }
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200"
                                  >
                                    Convertir
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CLIENTES */}
          {activeTab === "clientes" && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Clientes</h2>
              {loadingData ? (
                <p className="text-slate-400">Cargando...</p>
              ) : clientes.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No hay clientes</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-4 px-4 text-slate-300 font-semibold">Email</th>
                        <th className="text-left py-4 px-4 text-slate-300 font-semibold">Nombre</th>
                        <th className="text-left py-4 px-4 text-slate-300 font-semibold">Empresa</th>
                        <th className="text-left py-4 px-4 text-slate-300 font-semibold">Plan</th>
                        <th className="text-center py-4 px-4 text-slate-300 font-semibold">Tiendas</th>
                        <th className="text-center py-4 px-4 text-slate-300 font-semibold">Rol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientes.map((cliente) => (
                        <tr
                          key={cliente.uid}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                        >
                          <td className="py-4 px-4 text-white">{cliente.email}</td>
                          <td className="py-4 px-4 text-slate-200">
                            {cliente.nombre} {cliente.apellido}
                          </td>
                          <td className="py-4 px-4 text-slate-200">{cliente.empresa}</td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              💎 {cliente.plan}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold">
                              {cliente.tiendas.length}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="relative inline-block">
                              <button
                                onClick={() =>
                                  setRolDropdownOpen(
                                    rolDropdownOpen === cliente.uid ? null : cliente.uid
                                  )
                                }
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-medium text-sm transition-all duration-200 border border-white/10"
                              >
                                {cliente.rol === "cliente" ? "👤 Cliente" : "⏳ Pre-cliente"}
                                <svg
                                  className={`w-4 h-4 transition-transform ${
                                    rolDropdownOpen === cliente.uid ? "rotate-180" : ""
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                  />
                                </svg>
                              </button>

                              {rolDropdownOpen === cliente.uid && (
                                <div className="absolute top-full mt-2 right-0 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50 min-w-max">
                                  <button
                                    onClick={() => handleCambiarRol(cliente.uid, "cliente")}
                                    className="w-full text-left px-4 py-3 text-white hover:bg-cyan-600/50 transition-colors border-b border-white/5 font-medium flex items-center gap-2"
                                  >
                                    👤 Cliente
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleCambiarRol(cliente.uid, "pre-cliente")
                                    }
                                    className="w-full text-left px-4 py-3 text-white hover:bg-cyan-600/50 transition-colors font-medium flex items-center gap-2"
                                  >
                                    ⏳ Pre-cliente
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* INVITAR */}
          {activeTab === "invitar" && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Invitar nuevo usuario</h2>
              <p className="text-slate-400 mb-6">Crea una nueva invitación para un pre-cliente</p>
              {message && (
                <div
                  className={`mb-6 p-4 rounded-lg border backdrop-blur ${
                    message.startsWith("✓")
                      ? "bg-green-500/20 border-green-500/30 text-green-300"
                      : "bg-red-500/20 border-red-500/30 text-red-300"
                  }`}
                >
                  {message}
                </div>
              )}
              <form onSubmit={handleInvitar} className="max-w-md space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="usuario@example.com"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all backdrop-blur"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                      placeholder="Juan"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all backdrop-blur"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      required
                      placeholder="Pérez"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all backdrop-blur"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  ✉️ Enviar Invitación
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
