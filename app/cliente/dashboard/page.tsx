"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  obtenerTiendasUsuario,
  crearTienda,
  cerrarSesion,
  obtenerLimitesCliente,
  obtenerCliente,
} from "@/lib/firebaseService";
import { Tienda, Cliente } from "@/lib/types";

export default function ClienteDashboard() {
  const router = useRouter();
  const { usuario, loading } = useAuth();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nombreTienda, setNombreTienda] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (loading) return;
    if (usuario?.role !== "cliente") {
      router.push("/");
      return;
    }

    cargarDatos();
  }, [loading, usuario, router]);

  const cargarDatos = async () => {
    setLoadingData(true);
    try {
      const clienteData = await obtenerCliente(usuario!.uid);
      const tiendasData = await obtenerTiendasUsuario(usuario!.uid);
      setCliente(clienteData);
      setTiendas(tiendasData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCrearTienda = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!nombreTienda.trim() || !descripcion.trim()) {
      setMessage("✗ Por favor completa todos los campos");
      return;
    }

    if (!cliente) {
      setMessage("✗ No se encontraron datos del cliente");
      return;
    }

    try {
      const limites = obtenerLimitesCliente(cliente.plan);
      const tiendaId = await crearTienda(
        usuario!.uid,
        nombreTienda,
        descripcion,
        cliente.plan,
        limites
      );

      setMessage("✓ Tienda creada exitosamente");
      setNombreTienda("");
      setDescripcion("");
      setShowForm(false);
      setTimeout(() => cargarDatos(), 1000);
    } catch (error: any) {
      setMessage("✗ Error al crear tienda: " + error.message);
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mi Dashboard</h1>
            <p className="text-sm text-gray-600">
              Cliente • {usuario.nombre} {usuario.apellido}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Plan Info */}
        {cliente && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-2">{cliente.empresa}</h2>
            <p className="mb-4">Plan: <span className="font-bold uppercase">{cliente.plan}</span></p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-blue-100">Tiendas</p>
                <p className="text-3xl font-bold">{cliente.tiendas.length}</p>
              </div>
              <div>
                <p className="text-blue-100">Estado</p>
                <p className="text-3xl font-bold capitalize">{cliente.estado}</p>
              </div>
              <div>
                <p className="text-blue-100">Cliente desde</p>
                <p className="text-lg font-bold">
                  {new Date(cliente.fechaRegistro).toLocaleDateString("es-ES")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botón crear tienda */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            {showForm ? "Cancelar" : "+ Crear Nueva Tienda"}
          </button>
        </div>

        {/* Formulario crear tienda */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Crear Nueva Tienda</h2>
            {message && (
              <div
                className={`mb-4 p-3 rounded ${
                  message.startsWith("✓")
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {message}
              </div>
            )}
            <form onSubmit={handleCrearTienda} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la tienda
                </label>
                <input
                  type="text"
                  value={nombreTienda}
                  onChange={(e) => setNombreTienda(e.target.value)}
                  placeholder="Mi tienda virtual"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe tu tienda..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                Crear Tienda
              </button>
            </form>
          </div>
        )}

        {/* Lista de tiendas */}
        <div>
          <h2 className="text-xl font-bold mb-4">Mis Tiendas</h2>
          {loadingData ? (
            <p>Cargando...</p>
          ) : tiendas.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
              <p>No tienes tiendas aún. Crea una para comenzar a vender.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tiendas.map((tienda) => (
                <Link
                  key={tienda.id}
                  href={`/cliente/tienda/${tienda.id}`}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 cursor-pointer"
                >
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {tienda.nombre}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {tienda.descripcion}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {tienda.productos} productos
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        tienda.estado === "activa"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {tienda.estado}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
