"use client";

import { obtenerProductoPorId, obtenerProductosPorCategoria, obtenerProductosPorSubcategoria, obtenerProductosPorSubsubcategoria } from "@/lib/productos-db";
import ProductoCard from "../../components/ProductoCard";
import React, { useState, useEffect } from "react";
import type { Producto } from "@/lib/productos-db";
import { useUser } from "../../context/UserContext";
import { useSearchParams } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";

export default function ProductDetailPage({ params }: { params?: { id?: string } }) {
  const { currentColors } = useTheme();
  const [relacionados, setRelacionados] = useState<Producto[]>([]);
  const [producto, setProducto] = useState<Producto | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"caracteristicas" | null>("caracteristicas");

  const {
    isLogged, user, isCliente, isAdmin,
    favoritos, addFavorito, removeFavorito,
    carrito, addCarrito, removeCarrito,
  } = useUser();

  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchProducto() {
      setLoading(true);
      const id = params?.id || searchParams.get("id");
      if (!id) { setProducto(null); setRelacionados([]); setLoading(false); return; }
      const prod = await obtenerProductoPorId(id);
      setProducto(prod);
      setLoading(false);
      
      if (prod) {
        let rel: Producto[] = [];
        console.log("[RELACIONADOS] subsubcategoria:", prod.subsubcategoria, "subcategoria:", prod.subcategoria, "categoria:", prod.categoria);
        if (prod.subsubcategoria) {
          rel = await obtenerProductosPorSubsubcategoria(prod.subsubcategoria, prod.id, 5);
          console.log("[RELACIONADOS] encontrados por subsubcategoria:", rel);
        }
        if ((!rel || rel.length === 0) && prod.subcategoria) {
          rel = await obtenerProductosPorSubcategoria(prod.subcategoria, prod.id, 5);
          console.log("[RELACIONADOS] encontrados por subcategoria:", rel);
        }
        if ((!rel || rel.length === 0) && prod.categoria) {
          rel = await obtenerProductosPorCategoria(prod.categoria, prod.id, 5);
          console.log("[RELACIONADOS] encontrados por categoria:", rel);
        }
        setRelacionados(rel);
      } else {
        setRelacionados([]);
      }
    }
    fetchProducto();
    // eslint-disable-next-line
  }, [params?.id, searchParams]);

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ backgroundColor: currentColors?.bgPrimary || "#0f172a" }} className="min-h-screen flex flex-col items-center justify-center mt-2">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
        <span style={{ color: currentColors?.textSecondary || "#94a3b8" }} className="text-sm">Cargando producto...</span>
      </div>
    );
  }

  if (!producto) {
    return (
      <div style={{ backgroundColor: currentColors?.bgPrimary || "#0f172a" }} className="min-h-screen flex flex-col items-center justify-center mt-2 gap-3">
        <span className="material-icons-round text-5xl text-slate-200 dark:text-white/10">inventory_2</span>
        <p style={{ color: currentColors?.textSecondary || "#94a3b8" }} className="font-medium">Producto no encontrado</p>
      </div>
    );
  }

  // ── Derivados ────────────────────────────────────────────────────────────
  const maxCantidad = producto.stock || 0;
  const isFav = favoritos?.some((p) => p.id === producto.id);
  const inCart = carrito?.some((p) => p.id === producto.id);

  const basePrice = Number(producto.precio || 0);
  const discount = Number(producto.descuento || 0);
  const hasDiscount = !isNaN(discount) && discount > 0 && discount < 100;
  const finalPrice = basePrice;
  const fakeOldPrice = hasDiscount ? Math.round(basePrice / (1 - discount / 100)) : null;

  const handleAddCart = () => {
    if (inCart) {
      removeCarrito(producto.id);
      console.log("Eliminado del carrito");
    } else {
      addCarrito({ ...producto, cantidad: 1 });
      console.log(`${producto.nombre} añadido al carrito`);
    }
  };

  // Callbacks para ProductoCard
  const handleProductoClick = (prod: Producto) => {
    console.log("Click en producto:", prod);
  };

  const handleAddToCart = (prod: Producto) => {
    // El ProductoCard ya maneja la lógica del carrito
    // Este callback es solo para logging o acciones adicionales
    console.log("Callback handleAddToCart ejecutado:", prod.nombre);
  };

  const handleEyeClick = (prod: Producto) => {
    console.log("Vista rápida:", prod);
  };
  const handleFav = () => {
    isFav ? removeFavorito(producto.id) : addFavorito(producto);
  };

  const hasCaracteristicas = producto.caracteristicas && producto.caracteristicas.length > 0;

  const handleTabToggle = (tab: "caracteristicas") => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  // Validar que currentColors exista
  if (!currentColors) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: "#0f172a" }}>
        Cargando...
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: currentColors.bgPrimary, color: currentColors.textPrimary }} className="min-h-screen flex flex-col mt-2 transition-colors">

      <div className="max-w-5xl mx-auto w-full px-3 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-14">

          {/* ══ GALERÍA ══════════════════════════════════════ */}
          <div className="w-full md:w-[44%] flex flex-col gap-3">

            {/* Imagen principal */}
            <div 
              style={{
                backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                borderColor: currentColors.bgPrimary === '#ffffff' ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
              }}
              className="relative aspect-square rounded-2xl overflow-hidden border"
            >
              {hasDiscount && (
                <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  -{discount}%
                </span>
              )}
              <img
                src={producto.imagenes?.[0] || "/no-image.png"}
                alt={producto.nombre}
                className="w-full h-full object-contain p-5"
              />
              {producto.imagenes && producto.imagenes.length > 1 && imgIdx > 0 && (
                <button
                  onClick={() => setImgIdx(imgIdx - 1)}
                  style={{
                    backgroundColor: currentColors.bgPrimary,
                    borderColor: currentColors.borderColor,
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border shadow flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <span 
                    style={{
                      color: currentColors.textSecondary,
                    }}
                    className="text-lg"
                  >chevron_left</span>
                </button>
              )}
              {producto.imagenes && producto.imagenes.length > 1 && imgIdx < producto.imagenes.length - 1 && (
                <button
                  onClick={() => setImgIdx(imgIdx + 1)}
                  style={{
                    backgroundColor: currentColors.bgPrimary,
                    borderColor: currentColors.borderColor,
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border shadow flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <span 
                    style={{
                      color: currentColors.textSecondary,
                    }}
                    className="text-lg"
                  >chevron_right</span>
                </button>
              )}
            </div>

            {/* Miniaturas */}
            {producto.imagenes && producto.imagenes.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-0.5">
                {producto.imagenes.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setImgIdx(idx)}
                    style={{
                      backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#f8fafc' : 'rgba(255, 255, 255, 0.05)',
                      borderColor: imgIdx === idx 
                        ? (currentColors.bgPrimary === '#ffffff' ? '#94a3b8' : 'rgba(255, 255, 255, 0.3)')
                        : 'transparent',
                      opacity: imgIdx === idx ? 1 : 0.5,
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      imgIdx === idx ? 'scale-105' : 'hover:opacity-80'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain p-1.5" />
                  </button>
                ))}
              </div>
            )}

            {/* ── TABS: Características (sin reseñas) — solo desktop ───── */}
            {hasCaracteristicas && (
              <div className="hidden md:flex mt-1 flex-col gap-0 py-16">
                {/* Botones tab - Solo características */}
                <div className="flex rounded-xl overflow-hidden border" 
                  style={{
                    borderColor: currentColors.borderColor,
                  }}
                >
                  <button
                    onClick={() => handleTabToggle("caracteristicas")}
                    style={{
                      backgroundColor: activeTab === "caracteristicas" ? currentColors.accentColor : currentColors.bgPrimary,
                      color: activeTab === "caracteristicas" ? currentColors.buttonText : currentColors.textSecondary,
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all"
                  >
                    <span className="material-icons-round text-[16px]">list_alt</span>
                    Características
                  </button>
                </div>

                {/* Panel de contenido del tab activo */}
                {activeTab === "caracteristicas" && (
                  <div 
                    className="border border-t-0 rounded-b-xl px-4 py-4"
                    style={{
                      borderColor: currentColors.borderColor,
                      backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <ul className="space-y-2">
                      {producto.caracteristicas!.map((c, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm" 
                          style={{
                            color: currentColors.textPrimary,
                            opacity: 0.8,
                          }}
                        >
                          <span 
                            style={{
                              backgroundColor: currentColors.textSecondary,
                            }}
                            className="w-1 h-1 rounded-full mt-2 flex-shrink-0" 
                          />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {/* ── FIN TABS ─────────────────────────────────────────── */}

          </div>

          {/* ══ INFO ════════════════════════════════════════════════ */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">

            {/* Nombre + SKU */}
            <div>
              <h1
                className="text-2xl sm:text-3xl font-bold leading-tight break-words max-w-full whitespace-pre-line"
                style={{ 
                  wordBreak: "break-word", 
                  maxWidth: "100%",
                  color: currentColors.textPrimary,
                }}
                title={producto.nombre}
              >
                {producto.nombre}
              </h1>
              <p 
                style={{
                  color: currentColors.textSecondary,
                }}
                className="text-xs mt-1.5"
              >
                SKU: {producto.sku || producto.id}
              </p>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              {hasDiscount && (
                <span 
                  style={{
                    color: currentColors.textSecondary,
                  }}
                  className="text-sm line-through"
                >
                  ${fakeOldPrice?.toFixed(2)}
                </span>
              )}
              <span 
                style={{
                  color: currentColors.textPrimary,
                }}
                className="text-3xl font-extrabold"
              >
                ${finalPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span 
                  style={{
                    backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#fef2f2' : 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                  }}
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                >
                  {discount}% OFF
                </span>
              )}
            </div>

            <div 
              style={{
                backgroundColor: currentColors.borderColor,
              }}
              className="h-px"
            />

            {/* Stock */}
            <div className="flex items-center gap-2">
              <span 
                style={{
                  color: currentColors.textSecondary,
                }}
                className="text-xs font-medium"
              >Disponibilidad:</span>
              <span 
                style={{
                  backgroundColor: (producto.stock || 0) > 0 
                    ? (currentColors.bgPrimary === '#ffffff' ? '#f0fdf4' : 'rgba(34, 197, 94, 0.1)')
                    : (currentColors.bgPrimary === '#ffffff' ? '#fef2f2' : 'rgba(239, 68, 68, 0.1)'),
                  color: (producto.stock || 0) > 0 
                    ? (currentColors.bgPrimary === '#ffffff' ? '#15803d' : '#4ade80')
                    : (currentColors.bgPrimary === '#ffffff' ? '#dc2626' : '#f87171'),
                }}
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
              >
                {(producto.stock || 0) > 0 ? `${producto.stock} en stock` : "Sin stock"}
              </span>
            </div>

            {/* Cantidad */}
            {(producto.stock || 0) > 0 && (
              <div className="flex items-center gap-3">
                <span 
                  style={{
                    color: currentColors.textSecondary,
                  }}
                  className="text-xs font-medium"
                >Cantidad:</span>
              <div className="flex items-center rounded-xl p-1 gap-1"
                style={{
                  backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
                }}
              >
                <button
                  onClick={() => setCantidad((v) => Math.max(1, v - 1))}
                  style={{
                    color: currentColors.textSecondary,
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg transition-colors hover:opacity-80"
                >−</button>
                <span 
                  style={{
                    color: currentColors.textPrimary,
                  }}
                  className="w-9 text-center text-sm font-semibold"
                >
                  {cantidad}
                </span>
                <button
                  onClick={() => setCantidad((v) => Math.min(maxCantidad, v + 1))}
                  style={{
                    color: currentColors.textSecondary,
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg transition-colors hover:opacity-80"
                >+</button>
              </div>
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-2">
              <button
                onClick={handleAddCart}
                disabled={(producto.stock || 0) === 0}
                style={{
                  backgroundColor: (producto.stock || 0) === 0
                    ? (currentColors.bgPrimary === '#ffffff' ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)')
                    : inCart
                      ? (currentColors.bgPrimary === '#ffffff' ? '#ede9fe' : 'rgba(139, 92, 246, 0.2)')
                      : currentColors.accentColor,
                  color: (producto.stock || 0) === 0
                    ? currentColors.textSecondary
                    : inCart
                      ? currentColors.accentColor
                      : currentColors.buttonText,
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  (producto.stock || 0) === 0
                    ? "cursor-not-allowed"
                    : "shadow-sm hover:shadow-md active:scale-95"
                }`}
              >
                <span className="material-icons-round text-[16px]">
                  {inCart ? "remove_shopping_cart" : "add_shopping_cart"}
                </span>
                <span className="hidden xs:inline sm:hidden lg:inline">
                  {inCart ? "En el carrito" : "Añadir al carrito"}
                </span>
              </button>

              {isLogged && (
                <button
                  onClick={handleFav}
                  style={{
                    backgroundColor: isFav ? '#ec4899' : currentColors.bgPrimary,
                    color: isFav ? '#ffffff' : currentColors.textSecondary,
                    borderColor: currentColors.borderColor,
                  }}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm border ${
                    isFav ? "scale-100" : "hover:opacity-80"
                  }`}
                  title={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
                >
                  <span className="material-icons-round text-[20px]">
                    {isFav ? "favorite" : "favorite_border"}
                  </span>
                </button>
              )}
            </div>

            {/* Descripción */}
            {producto.descripcion && (
              <div 
                style={{
                  color: currentColors.textPrimary,
                  opacity: 0.8,
                }}
                className="prose prose-sm max-w-none"
              >
                <p>{producto.descripcion}</p>
              </div>
            )}

            {/* Características (móvil) */}
            {hasCaracteristicas && (
              <div className="md:hidden">
                <button
                  onClick={() => handleTabToggle("caracteristicas")}
                  style={{
                    backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#f1f5f9' : 'rgba(255, 255, 255, 0.03)',
                    color: currentColors.textSecondary,
                    borderColor: currentColors.borderColor,
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border"
                >
                  <span className="material-icons-round text-[16px]">list_alt</span>
                  Características
                  {activeTab === "caracteristicas" && (
                    <span 
                      style={{
                        backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)',
                        color: currentColors.textPrimary,
                        opacity: 0.7,
                      }}
                      className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                    >
                      {producto.caracteristicas!.length}
                    </span>
                  )}
                </button>

                {activeTab === "caracteristicas" && (
                  <div 
                    className="border border-t-0 rounded-b-xl px-4 py-4 mt-2"
                    style={{
                      borderColor: currentColors.borderColor,
                      backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <ul className="space-y-2">
                      {producto.caracteristicas!.map((c, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm" 
                          style={{
                            color: currentColors.textPrimary,
                            opacity: 0.8,
                          }}
                        >
                          <span 
                            style={{
                              backgroundColor: currentColors.textSecondary,
                            }}
                            className="w-1 h-1 rounded-full mt-2 flex-shrink-0" 
                          />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

        {/* ══ PRODUCTOS RELACIONADOS ════════════════════════════════════ */}
        {relacionados.length > 0 && (
          <div className="mt-12">
            <h2 
              style={{
                color: currentColors.textPrimary,
              }}
              className="text-xl font-bold mb-6"
            >
              Productos relacionados
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relacionados.map((prod) => (
                <ProductoCard
                  key={prod.id}
                  producto={prod}
                  showCart={true}
                  showEye={true}
                  showFav={isLogged}
                  onClick={handleProductoClick}
                  onAddCart={handleAddToCart}
                  onEye={handleEyeClick}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
