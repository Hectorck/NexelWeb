"use client";

console.log('DEBUG - ARCHIVO products-by-category/page.tsx CARGADO');

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import ProductoCard from "../../components/ProductoCard";
import { useEffect, useState, useMemo, useCallback } from "react";
import type { Producto } from "@/lib/productos-db";
import { 
  obtenerProductosUsuario, 
  obtenerTiendasUsuario,
  obtenerProductosUsuarioPorCategoria,
  obtenerProductosUsuarioPorSubcategoria,
  obtenerProductosUsuarioPorSubsubcategoria
} from "@/lib/firebaseService";
import { obtenerCategoriasUsuario } from "@/lib/categorias-db";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import { useUser } from "../../context/UserContext";
import { useTiendaContext } from "@/lib/TiendaContext";

export default function ProductsByCategoryPage() {
  console.log('DEBUG - ProductsByCategoryPage iniciado');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { usuario, loading: authLoading } = useAuth();
  const { currentColors } = useTheme();
  const { addCarrito, removeCarrito, carrito } = useUser();
  const { tienda } = useTiendaContext();

  const categoria = (searchParams?.get("cat") || searchParams?.get("category") || "").trim();
  const subcategoria = (searchParams?.get("subcat") || searchParams?.get("subcategory") || searchParams?.get("sub") || "").trim();
  const subsubcategoria = (searchParams?.get("subsubcat") || searchParams?.get("subsubcategory") || searchParams?.get("subsub") || "").trim();

  const [tiendas, setTiendas] = useState<any[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [search, setSearch] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [orden, setOrden] = useState("price-high");
  const [showPrecio, setShowPrecio] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Validación de autenticación
  useEffect(() => {
    console.log('DEBUG - Validación auth:', { authLoading, usuario: !!usuario, role: usuario?.role });
    if (!authLoading && (!usuario || usuario.role !== "pre-cliente")) {
      console.log('DEBUG - Redirigiendo a / - usuario no válido');
      router.push("/");
    }
  }, [authLoading, usuario, router]);

  // Cargar datos de la tienda y productos
  useEffect(() => {
    console.log('DEBUG - useEffect ejecutado', { usuario: !!usuario, categoria, subcategoria, subsubcategoria });
    if (!usuario) return;
    cargarDatos();
  }, [usuario, categoria, subcategoria, subsubcategoria]);

  const cargarDatos = async () => {
    console.log('DEBUG - cargarDatos iniciado para productos por categoría');
    setLoadingData(true);
    try {
      const [tiendasData] = await Promise.all([
        obtenerTiendasUsuario(usuario.uid)
      ]);
      setTiendas(tiendasData);
      
      // Cargar productos según la categoría solicitada
      let productosData = [];
      const tiendaId = tiendasData.length > 0 ? tiendasData[0].id : null;
      
      console.log('DEBUG - Cargando productos por categoría:', {
        categoria,
        subcategoria,
        subsubcategoria,
        tiendaId,
        totalTiendas: tiendasData.length,
        tiendaData: tiendasData[0],
        tiendaCampos: tiendasData[0] ? Object.keys(tiendasData[0]) : []
      });
      
      if (subsubcategoria && subcategoria && categoria) {
        productosData = await obtenerProductosUsuarioPorSubsubcategoria(usuario.uid, subsubcategoria, subcategoria, categoria, tiendaId || undefined);
      } else if (subcategoria && categoria) {
        productosData = await obtenerProductosUsuarioPorSubcategoria(usuario.uid, subcategoria, categoria, tiendaId || undefined);
      } else if (categoria) {
        productosData = await obtenerProductosUsuarioPorCategoria(usuario.uid, categoria, tiendaId || undefined);
      } else {
        productosData = await obtenerProductosUsuario(usuario.uid);
      }
      
      console.log('DEBUG - Productos obtenidos:', productosData.length);
      
      setProductos(productosData || []);
    } catch (error) {
      console.error("Error cargando datos:", error);
      setProductos([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Funciones para ProductoCard
  const handleProductoClick = (producto: any) => {
    console.log("Click en producto:", producto);
  };

  const handleAddToCart = (producto: any) => {
    // El ProductoCard ya maneja la lógica del carrito
    // Este callback es solo para logging o acciones adicionales
    console.log("Callback handleAddToCart ejecutado:", producto.nombre);
  };

  const handleEyeClick = (producto: any) => {
    console.log("Vista rápida:", producto);
    // Aquí puedes implementar la lógica para vista rápida
    // Por ahora solo logueamos
  };

  // ── Filtrado y orden ─────────────────────────────
  const productosFiltrados = useMemo(() => {
    return productos
      .filter((p: any) => {
        // Validación estricta de jerarquía
        if (subsubcategoria && subcategoria && categoria) {
          if (
            p.categoria !== categoria ||
            p.subcategoria !== subcategoria ||
            p.subsubcategoria !== subsubcategoria
          ) {
            return false;
          }
        } else if (subcategoria && categoria) {
          if (
            p.categoria !== categoria ||
            p.subcategoria !== subcategoria
          ) {
            return false;
          }
        } else if (categoria) {
          // Mostrar todos los productos de la categoría, sin importar subcategoría o subsubcategoría
          if (p.categoria !== categoria) {
            return false;
          }
        }

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
        const matchMin = min === null || finalPrice >= min;
        const matchMax = max === null || finalPrice <= max;

        return matchTexto && matchMin && matchMax;
      })
      .sort((a: any, b: any) => {
        const fp = (p: any) => {
          const base = Number(p.precio || 0);
          const d = Number(p.descuento || 0);
          return d > 0 && d < 100 ? base * (1 - d / 100) : base;
        };
        if (orden === "price-low") return fp(a) - fp(b);
        if (orden === "price-high") return fp(b) - fp(a);
        if (a.createdAt && b.createdAt) return b.createdAt - a.createdAt;
        return 0;
      });
  }, [productos, categoria, subcategoria, subsubcategoria, search, precioMin, precioMax, orden]);

  // --- Paginación responsive: 10 productos en móvil, cols*3 en desktop ---
  const getProductsPerPage = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 10; // móvil
      if (window.innerWidth >= 1024) return 4 * 3; // lg: 4 cols x 3 filas
      if (window.innerWidth >= 768) return 3 * 3; // md: 3 cols x 3 filas
      if (window.innerWidth >= 640) return 2 * 3; // sm: 2 cols x 3 filas
    }
    return 10;
  };

  const [productsPerPage, setProductsPerPage] = useState(getProductsPerPage());
  useEffect(() => {
    function handleResize() {
      setProductsPerPage(getProductsPerPage());
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = Math.ceil(productosFiltrados.length / productsPerPage);
  const paginatedProducts = productosFiltrados.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);

  const hasFilters = !!(search || precioMin || precioMax || orden !== "newest");

  const clearFilters = useCallback(() => {
    setSearch("");
    setPrecioMin("");
    setPrecioMax("");
    setOrden("newest");
    setCurrentPage(1);
  }, []);

  const ordenOpciones = [
    { value: "newest",     label: "Más nuevos"    },
    { value: "price-low",  label: "Menor precio"  },
    { value: "price-high", label: "Mayor precio"  },
  ];

  const chip = (active: boolean) => {
    if (!currentColors) return "";
    return `flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer select-none whitespace-nowrap ${
      active
        ? "shadow-sm"
        : "hover:opacity-80"
    }`;
  };

  const inputCls = "px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all";

  // Estado para el mapeo de nombres
  const [catMap, setCatMap] = useState<any>({});
  const [subcatMap, setSubcatMap] = useState<any>({});
  const [subsubcatMap, setSubsubcatMap] = useState<any>({});

  useEffect(() => {
    async function fetchCategorias() {
      if (!tiendas.length || !usuario) return;
      
      const cats = await obtenerCategoriasUsuario(usuario.uid, tiendas[0].id);
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
    }
    fetchCategorias();
  }, [tiendas, usuario]);

  function getCategoryName(id: string) {
    return catMap[id] || id;
  }
  function getSubcategoryName(id: string) {
    return subcatMap[id] || id;
  }
  function getSubsubcategoryName(id: string) {
    return subsubcatMap[id] || id;
  }

  // Si está cargando autenticación o no hay usuario, mostrar loading
  if (authLoading || !usuario || !currentColors || loadingData) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: "#0f172a" }}>
        Cargando...
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: currentColors.bgPrimary, color: currentColors.textPrimary }} className="min-h-screen flex flex-col mt-2 transition-colors">
      {/* Header con botón de volver */}
      {tiendas.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push("/mi-tienda")}
            style={{
              backgroundColor: currentColors.buttonBg,
              color: currentColors.buttonText,
            }}
            className="px-4 py-2 rounded-lg hover:opacity-90 transition-all font-medium flex items-center gap-2"
          >
            <span className="material-icons-round text-[18px]">arrow_back</span>
            Volver a {tiendas[0].nombre}
          </button>
        </div>
      )}
      
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-5 py-10 flex-1">

        {/* ── Cabecera ─────────────────────────────────────────── */}
        {(categoria || subcategoria || subsubcategoria) && (
          <div className="mb-4">
            <nav 
              style={{
                color: currentColors.textSecondary,
              }}
              className="flex items-center gap-1 text-xs mb-1 select-none"
            >
              <span 
                className="hover:underline cursor-pointer" 
                onClick={() => router.push("/mi-tienda/products-by-category")}
              >Categorías</span>
              {categoria && (
                <>
                  <span className="mx-1">›</span>
                  <span 
                    className="hover:underline cursor-pointer" 
                    onClick={() => router.push(`/mi-tienda/products-by-category?cat=${encodeURIComponent(categoria)}`)}
                  >{getCategoryName(categoria)}</span>
                </>
              )}
              {subcategoria && (
                <>
                  <span className="mx-1">›</span>
                  <span 
                    className="hover:underline cursor-pointer" 
                    onClick={() => router.push(`/mi-tienda/products-by-category?cat=${encodeURIComponent(categoria)}&subcat=${encodeURIComponent(subcategoria)}`)}
                  >{getSubcategoryName(subcategoria)}</span>
                </>
              )}
              {subsubcategoria && (
                <>
                  <span className="mx-1">›</span>
                  <span 
                    style={{
                      color: currentColors.textPrimary,
                      opacity: 0.8,
                    }}
                    className="font-semibold"
                  >{getSubsubcategoryName(subsubcategoria)}</span>
                </>
              )}
            </nav>
            <h1 
              style={{
                color: currentColors.textPrimary,
              }}
              className="text-xl sm:text-2xl font-bold leading-tight"
            >
              {subsubcategoria
                ? getSubsubcategoryName(subsubcategoria)
                : subcategoria
                  ? getSubcategoryName(subcategoria)
                  : getCategoryName(categoria)}
            </h1>
          </div>
        )}

        {/* ── Filtros horizontales ─────────────────────────────── */}
        <div 
          style={{
            backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
            borderColor: currentColors.borderColor,
          }}
          className="border rounded-2xl px-4 py-6 sm:py-4 mb-5 space-y-3"
        >

          {/* Fila 1: buscador + precio + limpiar */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[160px] max-w-sm">
              <span 
                style={{
                  color: currentColors.textSecondary,
                }}
                className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-[17px] pointer-events-none"
              >
                search
              </span>
              <input
                type="text"
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  backgroundColor: currentColors.bgPrimary,
                  borderColor: currentColors.borderColor,
                  color: currentColors.textPrimary,
                }}
                className={`${inputCls} w-full pl-9 pr-8`}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    color: currentColors.textSecondary,
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 hover:opacity-80"
                >
                  <span className="material-icons-round text-[15px]">close</span>
                </button>
              )}
            </div>

            {/* Toggle precio */}
            <button
              onClick={() => setShowPrecio((v) => !v)}
              style={{
                backgroundColor: (showPrecio || !!(precioMin || precioMax)) ? currentColors.accentColor : currentColors.bgPrimary,
                borderColor: (showPrecio || !!(precioMin || precioMax)) ? currentColors.accentColor : currentColors.borderColor,
                color: (showPrecio || !!(precioMin || precioMax)) ? currentColors.buttonText : currentColors.textSecondary,
              }}
              className={chip(showPrecio || !!(precioMin || precioMax))}
            >
              <span className="material-icons-round text-[15px]">attach_money</span>
              Precio
              {(precioMin || precioMax) && !showPrecio && (
                <span 
                  style={{
                    backgroundColor: currentColors.accentColor,
                  }}
                  className="w-1.5 h-1.5 rounded-full" 
                />
              )}
            </button>

            {/* Limpiar */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                style={{
                  backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#fef2f2' : 'rgba(239, 68, 68, 0.1)',
                  borderColor: currentColors.bgPrimary === '#ffffff' ? '#fecaca' : 'rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap hover:opacity-80"
              >
                <span className="material-icons-round text-[14px]">close</span>
                Limpiar
              </button>
            )}
          </div>

            {/* Precio expandible */}
            {showPrecio && (
              <div className="flex items-center gap-2 flex-wrap">
                <span 
                  style={{
                    color: currentColors.textSecondary,
                  }}
                  className="text-xs font-medium"
                >Rango:</span>
                <input
                  type="number"
                  placeholder="Mín"
                  value={precioMin}
                  onChange={(e) => setPrecioMin(e.target.value)}
                  min={0}
                  style={{
                    backgroundColor: currentColors.bgPrimary,
                    borderColor: currentColors.borderColor,
                    color: currentColors.textPrimary,
                  }}
                  className={`${inputCls} w-24`}
                />
                <span 
                  style={{
                    color: currentColors.borderColor,
                  }}
                >—</span>
                <input
                  type="number"
                  placeholder="Máx"
                  value={precioMax}
                  onChange={(e) => setPrecioMax(e.target.value)}
                  min={0}
                  style={{
                    backgroundColor: currentColors.bgPrimary,
                    borderColor: currentColors.borderColor,
                    color: currentColors.textPrimary,
                  }}
                  className={`${inputCls} w-24`}
                />
              </div>
            )}

          {/* Fila 2: orden + conteo */}
          <div className="flex items-center gap-2 flex-wrap">
            <span 
              style={{
                color: currentColors.textSecondary,
              }}
              className="text-xs font-medium"
            >Ordenar:</span>
            {ordenOpciones.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setOrden(opt.value)}
                style={{
                  backgroundColor: orden === opt.value ? currentColors.accentColor : currentColors.bgPrimary,
                  borderColor: orden === opt.value ? currentColors.accentColor : currentColors.borderColor,
                  color: orden === opt.value ? currentColors.buttonText : currentColors.textSecondary,
                }}
                className="px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
              >
                {opt.label}
              </button>
            ))}
            {!loadingData && (
              <span 
                style={{
                  color: currentColors.textSecondary,
                }}
                className="ml-auto text-xs tabular-nums"
              >
                {productosFiltrados.length}{" "}
                {productosFiltrados.length === 1 ? "resultado" : "resultados"}
              </span>
            )}
          </div>
        </div>

        {/* ── Grid de productos ─────────────────────────────────── */}
        {loadingData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                  borderColor: currentColors.bgPrimary === '#ffffff' ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
                }}
                className="rounded-2xl border h-60 animate-pulse"
              />
            ))}
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div 
              style={{
                backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
              }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
            >
              <span 
                style={{
                  color: currentColors.textSecondary,
                  opacity: 0.2,
                }}
                className="material-icons-round text-3xl"
              >
                {productos.length === 0 ? "inventory_2" : "search_off"}
              </span>
            </div>
            <div>
              <p 
                style={{
                  color: currentColors.textPrimary,
                }}
                className="font-semibold"
              >
                {productos.length === 0 ? "No hay productos en tu tienda" : "Sin resultados"}
              </p>
              <p 
                style={{
                  color: currentColors.textSecondary,
                }}
                className="text-sm mt-1 max-w-[240px]"
              >
                {productos.length === 0 
                  ? "Agrega productos a tu tienda para que aparezcan aquí"
                  : "Prueba otros términos o ajusta los filtros de precio"
                }
              </p>
            </div>
            {productos.length === 0 ? (
              <button
                onClick={() => router.push("/mi-tienda")}
                style={{
                  backgroundColor: currentColors.accentColor,
                  color: currentColors.buttonText,
                }}
                className="px-4 py-2 rounded-lg hover:opacity-90 transition-all font-medium"
              >
                Ir al Dashboard
              </button>
            ) : hasFilters && (
              <button
                onClick={clearFilters}
                style={{
                  color: currentColors.accentColor,
                }}
                className="text-sm underline underline-offset-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in duration-700`}>
              {paginatedProducts.map((p: any) => (
                <ProductoCard
                  key={p.id}
                  producto={p}
                  onClick={handleProductoClick}
                  onAddCart={handleAddToCart}
                  onEye={handleEyeClick}
                  showCart={true}
                  showEye={true}
                  showFav={true}
                />
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center items-center gap-2 mt-8 select-none w-full">
                <button
                  style={{
                    backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: currentColors.borderColor,
                    color: currentColors.textSecondary,
                  }}
                  className="px-3 py-1.5 rounded border text-xs font-medium transition-all disabled:opacity-40 hover:opacity-80"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setCurrentPage(n)}
                    style={{
                      backgroundColor: currentPage === n ? currentColors.accentColor : (currentColors.bgPrimary === '#ffffff' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)'),
                      borderColor: currentPage === n ? currentColors.accentColor : currentColors.borderColor,
                      color: currentPage === n ? currentColors.buttonText : currentColors.textSecondary,
                    }}
                    className={`px-3 py-1.5 rounded border text-xs font-medium transition-all ${
                      currentPage === n ? 'shadow-sm' : 'hover:opacity-80'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  style={{
                    backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: currentColors.borderColor,
                    color: currentColors.textSecondary,
                  }}
                  className="px-3 py-1.5 rounded border text-xs font-medium transition-all disabled:opacity-40 hover:opacity-80"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  &gt;
                </button>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}
