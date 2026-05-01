"use client";
import React, { useState, useEffect, useMemo } from "react";
import type { Producto } from "@/lib/productos-db";
import CategoriasAdminPanel from "./CategoriasAdminPanel";
import MarcasAdminPanel from "./MarcasAdminPanel";
import BodegasAdminPanel from "./BodegasAdminPanel";
import ProductoFormModal from "./ProductoFormModal";
import {
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from "@/lib/productos-db";
import { obtenerProductosUsuario, obtenerTiendasUsuario } from "@/lib/firebaseService";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import { crearBodegaDefaultUsuario } from "@/lib/bodegas-db";

type FiltroStock = "todos" | "con-stock" | "poco-stock" | "sin-stock";
type Vista = "productos" | "marcas" | "categorias" | "bodegas";

export default function AdminInventario() {
  const { usuario } = useAuth();
  const { currentColors } = useTheme();

  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<Producto | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [orden, setOrden] = useState("newest");
  const [vista, setVista] = useState<Vista>("productos");
  const [filtroStock, setFiltroStock] = useState<FiltroStock>("todos");
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [tiendaLoading, setTiendaLoading] = useState(false);

  const resumen = useMemo(() => {
    const total = productos.length;
    let conStock = 0, pocoStock = 0, sinStock = 0;
    productos.forEach((p) => {
      const s = Number(p.stock ?? 0);
      if (s === 0) sinStock++;
      else if (s <= 5) pocoStock++;
      else conStock++;
    });
    return { total, conStock, pocoStock, sinStock };
  }, [productos]);

  useEffect(() => {
    if (!usuario?.uid) return;
    crearBodegaDefaultUsuario(usuario.uid).catch(console.error);
    cargarProductos();
  }, [usuario?.uid]);

  if (!usuario || !currentColors) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: currentColors?.bgPrimary || "#0f172a" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p style={{ color: currentColors?.textSecondary || "#64748b" }}>Cargando...</p>
        </div>
      </div>
    );
  }

  async function cargarProductos() {
    if (!usuario?.uid) return;
    setLoading(true);
    try {
      const prods = await obtenerProductosUsuario(usuario.uid);
      setProductos(
        (prods as Producto[]).map((p) => ({
          ...p,
          precio: Number(p.precio ?? 0),
          stock: Number(p.stock ?? 0),
        }))
      );
    } catch (err) {
      console.error(err);
      alert("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  }

  const productosFiltrados = productos
    .filter((p) => {
      const texto = search.trim().toLowerCase();
      const nombre = p.nombre?.toLowerCase() || "";
      const desc = p.descripcion?.toLowerCase() || "";
      if (texto && !nombre.includes(texto) && !desc.includes(texto)) return false;
      if (filtroStock === "sin-stock") return p.stock === 0;
      if (filtroStock === "poco-stock") return p.stock > 0 && p.stock <= 5;
      if (filtroStock === "con-stock") return p.stock > 5;
      return true;
    })
    .sort((a, b) => {
      if (orden === "price-low") return a.precio - b.precio;
      if (orden === "price-high") return b.precio - a.precio;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

  const navItems: { key: Vista; label: string; emoji: string }[] = [
    { key: "productos", label: "Productos", emoji: "📦" },
    { key: "marcas", label: "Marcas", emoji: "🏷️" },
    { key: "categorias", label: "Categorías", emoji: "🗂️" },
    { key: "bodegas", label: "Bodegas", emoji: "🏠" },
  ];

  const badgeStock = (stock: number) => {
    if (stock === 0)
      return (
        <span 
          style={{
            backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#fef2f2' : 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
          }}
          className="px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap"
        >
          Sin stock
        </span>
      );
    if (stock <= 5)
      return (
        <span 
          style={{
            backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#fef3c7' : 'rgba(245, 158, 11, 0.1)',
            color: '#f59e0b',
          }}
          className="px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap"
        >
          {stock} poco
        </span>
      );
    return (
      <span 
        style={{
          backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#f0fdf4' : 'rgba(34, 197, 94, 0.1)',
          color: '#22c55e',
        }}
        className="px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap"
      >
        {stock}
      </span>
    );
  };

  return (
    <div style={{ backgroundColor: currentColors.bgPrimary, color: currentColors.textPrimary }} className="min-h-screen flex flex-col transition-colors">
      <div className="flex-1 w-full max-w-5xl mx-auto py-4 sm:py-6 px-3 sm:px-4 pb-28">

        {/* NAV — 2x2 en móvil, fila en desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          {navItems.map(({ key, label, emoji }) => {
            const isActive = vista === key;
            return (
              <button
                key={key}
                onClick={() => setVista(key)}
                style={{
                  backgroundColor: isActive ? currentColors.accentColor : currentColors.bgPrimary,
                  color: isActive ? currentColors.buttonText : currentColors.textSecondary,
                  borderColor: isActive ? currentColors.accentColor : currentColors.borderColor,
                }}
                className="
                  flex items-center justify-center gap-2
                  py-3 rounded-xl font-bold border-2 text-sm
                  transition-all
                "
              >
                {emoji} {label}
              </button>
            );
          })}
        </div>

        {/* ====== VISTA PRODUCTOS ====== */}
        {vista === "productos" && (
          <>
            {/* RESUMEN */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
              {[
                { label: "Total",      value: resumen.total,     color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200" },
                { label: "Con stock",  value: resumen.conStock,  color: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300" },
                { label: "Poco stock", value: resumen.pocoStock, color: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
                { label: "Sin stock",  value: resumen.sinStock,  color: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300" },
              ].map(({ label, value, color }) => (
                <div key={label} className={`rounded-xl px-3 sm:px-4 py-3 ${color}`}>
                  <p className="text-xs font-medium opacity-70">{label}</p>
                  <p className="text-2xl font-black">{value}</p>
                </div>
              ))}
            </div>

            {/* FILTROS STOCK — scroll horizontal, sangría negativa para tocar bordes */}
            <div className="-mx-3 px-3 overflow-x-auto scrollbar-none mb-4">
              <div className="flex gap-2 pb-1 w-max">
                {([
                  { key: "todos",      label: `Todos (${resumen.total})`,        active: "bg-slate-700 text-white border-slate-700",  idle: "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600" },
                  { key: "con-stock",  label: `Con stock (${resumen.conStock})`, active: "bg-green-600 text-white border-green-600",  idle: "bg-white dark:bg-slate-900 text-green-700 dark:text-green-400 border-green-400" },
                  { key: "poco-stock", label: `Poco (${resumen.pocoStock})`,     active: "bg-amber-500 text-white border-amber-500",  idle: "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 border-amber-400" },
                  { key: "sin-stock",  label: `Sin stock (${resumen.sinStock})`, active: "bg-red-600 text-white border-red-600",      idle: "bg-white dark:bg-slate-900 text-red-700 dark:text-red-400 border-red-400" },
                ] as const).map(({ key, label, active, idle }) => (
                  <button
                    key={key}
                    onClick={() => setFiltroStock(key)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border transition-all ${filtroStock === key ? active : idle}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ACCIONES */}
            <div className="flex gap-2 mb-3">
              <button
                className="flex-1 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold py-2.5 rounded-lg transition text-sm"
                onClick={() => { setEditData(null); setShowForm((v) => !v); }}
              >
                {showForm && !editData ? "✕ Cerrar" : "+ Crear producto"}
              </button>
              <button
                className="px-4 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm"
                onClick={cargarProductos}
                disabled={loading}
                title="Recargar"
              >
                {loading ? "⏳" : "↺"}
              </button>
            </div>

            {/* BÚSQUEDA + ORDEN */}
            <div className="flex flex-col sm:flex-row gap-2 mb-5">
              <input
                type="text"
                placeholder="Buscar productos..."
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
              >
                <option value="newest">Más nuevos</option>
                <option value="price-low">Menor precio</option>
                <option value="price-high">Mayor precio</option>
              </select>
            </div>

            {/* MODAL */}
            <ProductoFormModal
              show={showForm}
              initialData={editData}
              onClose={() => { setShowForm(false); setEditData(null); }}
              onSave={async (data) => {
                try {
                  if (editData) {
                    await actualizarProducto(editData.id, data);
                  } else {
                    await crearProducto({ ...data, usuarioId: usuario.uid });
                  }
                  setShowForm(false);
                  setEditData(null);
                  await cargarProductos();
                } catch (err) {
                  console.error(err);
                  alert("Error al guardar el producto");
                }
              }}
            />

            {/* TABLA */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* overflow-x-auto FUERA del max-h para que ambos scrolls funcionen independiente */}
              <div className="overflow-x-auto">
                <div className="max-h-[55vh] overflow-y-auto">
                  <table className="text-sm min-w-[520px] w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 text-xs sm:text-sm w-[40%]">Nombre</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 text-xs sm:text-sm">Stock</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 text-xs sm:text-sm">Precio</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 text-xs sm:text-sm">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="text-center py-12 text-slate-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2" />
                            Cargando...
                          </td>
                        </tr>
                      ) : productosFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                            No hay productos {search && `para "${search}"`}
                          </td>
                        </tr>
                      ) : (
                        productosFiltrados.map((p) => (
                          <tr
                            key={p.id}
                            className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100 max-w-[160px] truncate text-xs sm:text-sm">
                              {p.nombre}
                            </td>
                            <td className="px-4 py-3">{badgeStock(p.stock)}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm whitespace-nowrap">
                              ${Number(p.precio ?? 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1.5 whitespace-nowrap">
                                <button
                                  className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/60 transition border border-blue-200 dark:border-blue-800"
                                  onClick={() => { setEditData(p); setShowForm(true); }}
                                >
                                  ✏️ Editar
                                </button>
                                <button
                                  className="px-3 py-1 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-semibold text-xs hover:bg-red-100 dark:hover:bg-red-900/60 transition border border-red-200 dark:border-red-800"
                                  onClick={async () => {
                                    if (!window.confirm(`¿Eliminar "${p.nombre}"?`)) return;
                                    try {
                                      await eliminarProducto(p.id);
                                      await cargarProductos();
                                    } catch (err) {
                                      console.error(err);
                                      alert("Error al eliminar");
                                    }
                                  }}
                                >
                                  🗑️ Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {!loading && productosFiltrados.length > 0 && (
                <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
                  {productosFiltrados.length} de {productos.length} productos
                </div>
              )}
            </div>
          </>
        )}

        {vista === "marcas" && <MarcasAdminPanel usuarioId={usuario!.uid} />}
        {vista === "categorias" && <CategoriasAdminPanel usuarioId={usuario!.uid} />}
        {vista === "bodegas" && <BodegasAdminPanel />}
      </div>
    </div>
  );
}