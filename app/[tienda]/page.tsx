"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import { useUser } from "../context/UserContext";
import { useTiendaContext } from "@/lib/TiendaContext";
import ProductoCard from "@/app/components/ProductoCard";
import { obtenerProductosUsuario, obtenerTiendasUsuario, obtenerLogo } from "@/lib/firebaseService";
import { obtenerProductos } from "@/lib/productos-db";
import { obtenerCategorias, obtenerCategoriasUsuario } from "@/lib/categorias-db";
import { Tienda } from "@/lib/types";
import type { Producto } from "@/lib/productos-db";

export default function PreClienteDashboard({ params }: { params: { tienda: string } }) {
  const router = useRouter();
  const { usuario, loading } = useAuth();
  const { currentColors } = useTheme();
  const { addCarrito } = useUser();
  const tiendaSlug = params.tienda;

  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [tiendaActual, setTiendaActual] = useState<Tienda | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [nombreTienda, setNombreTienda] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [message, setMessage] = useState("");
  const [hasLogo, setHasLogo] = useState(false);
  const [hasProducts, setHasProducts] = useState(false);
  const [hasCategories, setHasCategories] = useState(false);
  const [allConfigured, setAllConfigured] = useState(true);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosLoading, setProductosLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [orden, setOrden] = useState("newest");
  const [showPrecio, setShowPrecio] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(12);
  const [catMap, setCatMap] = useState<any>({});
  const [subcatMap, setSubcatMap] = useState<any>({});
  const [subsubcatMap, setSubsubcatMap] = useState<any>({});
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!usuario || usuario.role !== "pre-cliente") {
      router.push("/");
      return;
    }
    cargarDatos();
  }, [loading, usuario]);

  const cargarDatos = async () => {
    setLoadingData(true);
    try {
      const tiendasData = await obtenerTiendasUsuario(usuario!.uid);
      setTiendas(tiendasData);
      
      if (tiendasData.length > 0) {
        const tiendaActualData = tiendasData[0];
        setTiendaActual(tiendaActualData);
        
        const [productosData, categoriasData, logoUrl] = await Promise.all([
          obtenerProductosUsuario(usuario!.uid),
          obtenerCategoriasUsuario(usuario!.uid, tiendaActualData.id),
          obtenerLogo(usuario!.uid),
        ]);
        
        setHasProducts(productosData && productosData.length > 0);
        setHasCategories(categoriasData && categoriasData.length > 0);
        setHasLogo(!!logoUrl);
        const configured = !!logoUrl && categoriasData?.length > 0 && productosData?.length > 0;
        setAllConfigured(configured);
        
        if (logoUrl) {
          await cargarProductosTienda();
          await cargarCategorias();
        }
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const cargarProductosTienda = async () => {
    setProductosLoading(true);
    try {
      const data = await obtenerProductos();
      setProductos(data || []);
    } catch (error) {
      console.error("Error cargando productos:", error);
      setProductos([]);
    } finally {
      setProductosLoading(false);
    }
  };

  const cargarCategorias = async () => {
    try {
      if (!tiendaActual) return;
      
      const cats = await obtenerCategoriasUsuario(usuario!.uid, tiendaActual.id);
      const catObj: any = {};
      const subcatObj: any = {};
      const subsubcatObj: any = {};
      cats.forEach((cat: any) => {
        catObj[cat.id] = cat.nombre || cat.id;
        if (cat.subcategorias) {
          cat.subcategorias.forEach((sub: any) => {
            subcatObj[sub.id] = sub.nombre || sub.id;
            if (sub.subcategorias) {
              sub.subcategorias.forEach((subsub: any) => {
                subsubcatObj[subsub.id] = subsub.nombre || subsub.id;
              });
            }
          });
        }
      });
      setCatMap(catObj);
      setSubcatMap(subcatObj);
      setSubsubcatMap(subsubcatObj);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  };

  const productosFiltrados = useMemo(() => {
    return productos
      .filter((p: any) => {
        const texto = search.toLowerCase().trim();
        const matchTexto =
          !texto ||
          (p.nombre?.toLowerCase() || "").includes(texto) ||
          (p.descripcion?.toLowerCase() || "").includes(texto);
        const base = Number(p.precio || 0);
        const disc = Number(p.descuento || 0);
        const finalPrice = disc > 0 && disc < 100 ? base * (1 - disc / 100) : base;
        const min = precioMin ? parseFloat(precioMin) : null;
        const max = precioMax ? parseFloat(precioMax) : null;
        return matchTexto && (min === null || finalPrice >= min) && (max === null || finalPrice <= max);
      })
      .sort((a: any, b: any) => {
        const fp = (p: any) => {
          const base = Number(p.precio || 0);
          const d = Number(p.descuento || 0);
          return d > 0 && d < 100 ? base * (1 - d / 100) : base;
        };
        if (orden === "price-low") return fp(a) - fp(b);
        if (orden === "price-high") return fp(b) - fp(a);
        if (orden === "newest" && a.createdAt && b.createdAt) return b.createdAt - a.createdAt;
        return 0;
      });
  }, [productos, search, precioMin, precioMax, orden]);

  useEffect(() => {
    function handleResize() {
      if (typeof window === "undefined") return;
      if (window.innerWidth < 640) setProductsPerPage(10);
      else if (window.innerWidth >= 1024) setProductsPerPage(12);
      else if (window.innerWidth >= 768) setProductsPerPage(9);
      else setProductsPerPage(6);
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalPages = Math.ceil(productosFiltrados.length / productsPerPage);
  const paginatedProducts = productosFiltrados.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );
  const hasFilters = !!(search || precioMin || precioMax || orden !== "newest");

  const clearFilters = useCallback(() => {
    setSearch("");
    setPrecioMin("");
    setPrecioMax("");
    setOrden("newest");
    setCurrentPage(1);
  }, []);

  const ordenOpciones = [
    { value: "newest",    label: "Más nuevos"   },
    { value: "price-low", label: "Menor precio" },
    { value: "price-high",label: "Mayor precio" },
  ];

  const inputCls = "px-3 py-2 rounded-xl border text-sm transition-all focus:outline-none";

  const handleProductoClick = (producto: any) => console.log("Click:", producto);
  const handleEyeClick      = (producto: any) => console.log("Eye:", producto);
  const handleAddToCart     = (producto: any) => {
    addCarrito({ ...producto, cantidad: 1 });
  };

  const handlePublicarTienda = () => {
    const tiendaActual = tiendas[0];
    const msg = `¡Hola! Quiero una tienda virtual.\n\n📋 *Información de la Tienda:*\n• Nombre: ${tiendaActual?.nombre || "Mi Tienda"}\n• Descripción: ${tiendaActual?.descripcion || "Sin descripción"}\n• Productos: ${productos.length} productos disponibles\n\n🚀 *Solicitud:*\nQuiero publicar mi tienda y conocer los planes disponibles.\n\n¡Gracias!`;
    window.open(`https://wa.me/593963328168?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleCrearTienda = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!nombreTienda.trim() || !descripcion.trim()) {
      setMessage("✗ Por favor completa todos los campos");
      return;
    }
    try {
      const limites = obtenerLimitesPreCliente();
      await crearTienda(usuario!.uid, nombreTienda, descripcion, "demo", limites);
      setMessage("✓ Tienda creada exitosamente");
      setNombreTienda("");
      setDescripcion("");
      setShowForm(false);
      setTimeout(() => cargarDatos(), 1000);
    } catch (error: any) {
      setMessage("✗ Error al crear tienda: " + error.message);
    }
  };

  if (loading || !usuario || !currentColors) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: "#0f172a" }}>
        Cargando...
      </div>
    );
  }

  const mostrarTienda = tiendas.length > 0 && hasLogo && !loadingData && !showDashboard;

  return (
    <div style={{ backgroundColor: currentColors.bgPrimary, color: currentColors.textPrimary }} className="min-h-screen">

      {/* ===== VISTA TIENDA ===== */}
      {mostrarTienda ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header tienda */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: currentColors.textPrimary }}>
                🏪 {tiendas[0].nombre}
              </h1>
              <p style={{ color: currentColors.textSecondary }} className="text-sm">
                {tiendas[0].descripcion || "Tu tienda online"}
              </p>
            </div>
            <button
              onClick={() => setShowDashboard(true)}
              style={{ backgroundColor: currentColors.buttonBg, color: currentColors.buttonText }}
              className="px-4 py-2 rounded-lg hover:opacity-90 transition-all font-medium flex items-center gap-2"
            >
              <span className="material-icons-round text-[18px]">settings</span>
              Dashboard
            </button>
          </div>

          {/* Filtros */}
          <div
            style={{ backgroundColor: currentColors.bgSecondary, borderColor: currentColors.borderColor }}
            className="border rounded-2xl px-4 py-4 mb-5 space-y-3"
          >
            {/* Fila 1: buscador + precio + limpiar */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[160px] max-w-sm">
                <span
                  className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-[17px] pointer-events-none"
                  style={{ color: currentColors.textSecondary }}
                >
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  style={{
                    backgroundColor: currentColors.bgPrimary,
                    borderColor: currentColors.borderColor,
                    color: currentColors.textPrimary,
                  }}
                  className={`${inputCls} w-full pl-9`}
                />
              </div>

              <button
                onClick={() => setShowPrecio((v) => !v)}
                style={{
                  borderColor: showPrecio ? currentColors.accentColor : currentColors.borderColor,
                  color: showPrecio ? currentColors.accentColor : currentColors.textSecondary,
                  backgroundColor: currentColors.bgPrimary,
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-medium transition-all"
              >
                <span className="material-icons-round text-[15px]">attach_money</span>
                Precio
              </button>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-red-200 dark:border-red-500/30 text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 transition-all whitespace-nowrap"
                >
                  <span className="material-icons-round text-[14px]">close</span>
                  Limpiar
                </button>
              )}
            </div>

            {/* Fila 2: rango precio */}
            {showPrecio && (
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ color: currentColors.textSecondary }} className="text-xs font-medium">Rango:</span>
                <input
                  type="number" placeholder="Mín" value={precioMin} min={0}
                  onChange={(e) => { setPrecioMin(e.target.value); setCurrentPage(1); }}
                  style={{ backgroundColor: currentColors.bgPrimary, borderColor: currentColors.borderColor, color: currentColors.textPrimary }}
                  className={`${inputCls} w-24`}
                />
                <span style={{ color: currentColors.borderColor }}>—</span>
                <input
                  type="number" placeholder="Máx" value={precioMax} min={0}
                  onChange={(e) => { setPrecioMax(e.target.value); setCurrentPage(1); }}
                  style={{ backgroundColor: currentColors.bgPrimary, borderColor: currentColors.borderColor, color: currentColors.textPrimary }}
                  className={`${inputCls} w-24`}
                />
              </div>
            )}

            {/* Fila 3: orden + conteo */}
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ color: currentColors.textSecondary }} className="text-xs font-medium">Ordenar:</span>
              {ordenOpciones.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setOrden(opt.value); setCurrentPage(1); }}
                  style={{
                    backgroundColor: orden === opt.value ? currentColors.accentColor : currentColors.bgPrimary,
                    borderColor: orden === opt.value ? currentColors.accentColor : currentColors.borderColor,
                    color: orden === opt.value ? "white" : currentColors.textPrimary,
                  }}
                  className="px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
                >
                  {opt.label}
                </button>
              ))}
              {!productosLoading && (
                <span style={{ color: currentColors.textSecondary }} className="ml-auto text-xs tabular-nums">
                  {productosFiltrados.length} {productosFiltrados.length === 1 ? "resultado" : "resultados"}
                </span>
              )}
            </div>
          </div>

          {/* Grid productos */}
          {productosLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 h-60 animate-pulse" />
              ))}
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                <span className="material-icons-round text-3xl text-slate-300 dark:text-white/20">search_off</span>
              </div>
              <div>
                <p className="font-semibold">Sin resultados</p>
                <p className="text-sm text-slate-400 mt-1 max-w-[240px]">Prueba otros términos o ajusta los filtros</p>
              </div>
              {hasFilters && (
                <button onClick={clearFilters} className="text-sm text-purple-500 underline underline-offset-2">
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {paginatedProducts.map((p: any) => (
                  <ProductoCard
                    key={p.id}
                    producto={p}
                    onClick={handleProductoClick}
                    onAddCart={handleAddToCart}
                    onEye={handleEyeClick}
                    showCart={true}
                    showEye={true}
                    showFav={false}
                  />
                ))}
              </div>

              {/* Botón publicar — desktop */}
              <div className="hidden md:flex mt-8 mb-4 justify-center">
                <button
                  onClick={handlePublicarTienda}
                  style={{ backgroundColor: currentColors.buttonBg, color: currentColors.buttonText, borderColor: currentColors.borderColor }}
                  className="px-6 py-3 rounded-lg font-semibold transition-all hover:opacity-90 border flex items-center gap-2 shadow-lg"
                >
                  <span className="material-icons-round">rocket_launch</span>
                  Publicar Tienda
                </button>
              </div>

              {/* Botón publicar — móvil flotante */}
              <div className="md:hidden fixed bottom-20 right-4 z-50">
                <button
                  onClick={handlePublicarTienda}
                  style={{ backgroundColor: currentColors.buttonBg, color: currentColors.buttonText }}
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-all border"
                >
                  <span className="material-icons-round text-lg">rocket_launch</span>
                </button>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex flex-wrap justify-center items-center gap-2 mt-8 select-none">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded border text-xs font-medium bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:border-purple-400 hover:text-purple-600 transition-all disabled:opacity-40"
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setCurrentPage(n)}
                      className={`px-3 py-1.5 rounded border text-xs font-medium transition-all ${
                        currentPage === n
                          ? "bg-purple-600 border-purple-600 text-white shadow-sm"
                          : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:border-purple-400 hover:text-purple-600"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded border text-xs font-medium bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:border-purple-400 hover:text-purple-600 transition-all disabled:opacity-40"
                  >
                    &gt;
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      ) : (
        // ✅ DASHBOARD — todo dentro de UN solo div raíz
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header dashboard */}
          <div
            style={{ backgroundColor: currentColors.bgSecondary, borderBottomColor: currentColors.borderColor }}
            className="border-b mb-8"
          >
            <div className="px-6 py-6">
              <h1 className="text-3xl font-bold">📊 Mi Dashboard</h1>
              <p style={{ color: currentColors.textSecondary }} className="text-sm mt-1">
                Pre-cliente • {usuario.nombre} {usuario.apellido}
              </p>
            </div>
          </div>

          {/* Botón volver a tienda */}
          {tiendas.length > 0 && hasLogo && !loadingData && (
            <div className="mb-8">
              <button
                onClick={() => setShowDashboard(false)}
                style={{ backgroundColor: currentColors.accentColor, color: currentColors.buttonText }}
                className="px-6 py-3 rounded-lg hover:opacity-90 transition-all font-semibold flex items-center gap-2"
              >
                <span className="material-icons-round">store</span>
                Ver Mi Tienda
              </button>
            </div>
          )}

          {/* Advertencia configuración */}
          {!allConfigured && !loadingData && (
            <div
              style={{ backgroundColor: "#1e1b4b", borderColor: "#fbbf24" }}
              className="border-2 rounded-lg p-8 mb-8"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2" style={{ color: "#fbbf24" }}>
                    ⚙️ Completa tu configuración
                  </h3>
                  <p style={{ color: currentColors.textSecondary }} className="mb-4">
                    Para que tu tienda funcione correctamente, necesitas:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {[
                      { label: "Logo",       ok: hasLogo       },
                      { label: "Categorías", ok: hasCategories },
                      { label: "Productos",  ok: hasProducts   },
                    ].map(({ label, ok }) => (
                      <div
                        key={label}
                        style={{ backgroundColor: ok ? "#10b981" : "#7c2d12", borderColor: ok ? "#059669" : "#dc2626" }}
                        className="border-2 rounded p-4"
                      >
                        <p className="font-semibold">{ok ? "✓" : "✗"} {label}</p>
                        <p style={{ color: currentColors.textSecondary }} className="text-sm">
                          {ok ? "Configurado" : "No configurado"}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/mi-tienda/config"
                    style={{ backgroundColor: currentColors.accentColor, color: currentColors.buttonText }}
                    className="inline-block px-6 py-3 rounded-lg hover:opacity-90 transition-all font-semibold"
                  >
                    📋 Ir a Configuración
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Info Banner */}
          <div
            style={{ backgroundColor: currentColors.bgAccent, borderColor: currentColors.accentColor }}
            className="border rounded-lg p-6 mb-8"
          >
            <h3 style={{ color: currentColors.textPrimary }} className="font-bold text-lg mb-3">
              ✨ Plan de Prueba - Tus Límites
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ color: currentColors.textSecondary }}>
              {[
                { icon: "📦", label: "Productos",  val: "Hasta 10"          },
                { icon: "🏷️", label: "Categorías", val: "Hasta 3"           },
                { icon: "🛒", label: "Checkout",   val: "Solo demostración" },
                { icon: "⏱️", label: "Validez",    val: "30 días"           },
              ].map(({ icon, label, val }) => (
                <div key={label}>
                  <p className="text-sm font-semibold">{icon} {label}</p>
                  <p>{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Botón crear tienda */}
          <div className="mb-8">
            <button
              onClick={() => setShowForm(!showForm)}
              style={{ backgroundColor: currentColors.buttonBg, color: currentColors.buttonText }}
              className="px-8 py-3 rounded-lg hover:opacity-90 transition-all font-bold text-lg"
            >
              {showForm ? "❌ Cancelar" : "+ ➕ Crear Nueva Tienda"}
            </button>
          </div>

          {/* Formulario crear tienda */}
          {showForm && (
            <div
              style={{ backgroundColor: currentColors.bgSecondary, borderColor: currentColors.borderColor }}
              className="rounded-lg p-8 mb-8 border"
            >
              <h2 className="text-2xl font-bold mb-6">Crear Nueva Tienda</h2>
              {message && (
                <div className={`mb-6 p-4 rounded-lg border ${message.startsWith("✓") ? "border-green-500/30 bg-green-500/20 text-green-300" : "border-red-500/30 bg-red-500/20 text-red-300"}`}>
                  {message}
                </div>
              )}
              <form onSubmit={handleCrearTienda} className="space-y-6">
                <div>
                  <label style={{ color: currentColors.textPrimary }} className="block text-sm font-semibold mb-2">
                    Nombre de la tienda
                  </label>
                  <input
                    type="text"
                    value={nombreTienda}
                    onChange={(e) => setNombreTienda(e.target.value)}
                    placeholder="Ej: Mi Tienda Online"
                    required
                    style={{ backgroundColor: currentColors.bgPrimary, borderColor: currentColors.borderColor, color: currentColors.textPrimary }}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label style={{ color: currentColors.textPrimary }} className="block text-sm font-semibold mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Describe tu tienda..."
                    required
                    rows={4}
                    style={{ backgroundColor: currentColors.bgPrimary, borderColor: currentColors.borderColor, color: currentColors.textPrimary }}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  style={{ backgroundColor: currentColors.buttonBg, color: currentColors.buttonText }}
                  className="w-full px-6 py-3 rounded-lg hover:opacity-90 transition-all font-bold"
                >
                  ✓ Crear Tienda
                </button>
              </form>
            </div>
          )}

          {/* Lista de tiendas */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Mis Tiendas</h2>
            {loadingData ? (
              <p style={{ color: currentColors.textSecondary }}>Cargando tiendas...</p>
            ) : tiendas.length === 0 ? (
              <div
                style={{ backgroundColor: currentColors.bgAccent, borderColor: currentColors.borderColor }}
                className="rounded-lg p-8 text-center border"
              >
                <p style={{ color: currentColors.textSecondary }} className="text-lg">
                  No tienes tiendas aún. ¡Crea una para empezar!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tiendas.map((tienda) => (
                  <div
                    key={tienda.id}
                    onClick={() => setShowDashboard(false)}
                    style={{ backgroundColor: currentColors.bgSecondary, borderColor: currentColors.borderColor }}
                    className="p-6 rounded-lg border hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
                  >
                    <h3 className="text-xl font-bold mb-2">🏪 {tienda.nombre}</h3>
                    <p style={{ color: currentColors.textSecondary }} className="text-sm mb-4 line-clamp-2">
                      {tienda.descripcion}
                    </p>
                    <div
                      style={{ backgroundColor: currentColors.bgAccent, borderColor: currentColors.borderColor }}
                      className="p-4 rounded-lg border space-y-2 text-sm"
                    >
                      <p style={{ color: currentColors.textSecondary }}>📦 {tienda.productos || 0} productos</p>
                      <p style={{ color: currentColors.textSecondary }}>
                        📋 Plan: <span style={{ color: currentColors.accentColor }} className="font-semibold">Demo</span>
                      </p>
                      <p>
                        Estado:{" "}
                        <span
                          style={{ backgroundColor: currentColors.accentColor, color: currentColors.buttonText }}
                          className="px-2 py-1 rounded text-xs font-bold"
                        >
                          {tienda.estado}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
        // ✅ Un solo </div> cierra todo el dashboard
      )}

    </div>
  );
}