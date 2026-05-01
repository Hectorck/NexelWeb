"use client";

import React from "react";
import Link from "next/link";
// import Image from "next/image"; // Temporalmente desactivado para Firebase Storage
import { useUser } from "../context/UserContext";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";
import { useTiendaRoutes } from "@/lib/useTiendaRoutes";
import { useTiendaContext } from "@/lib/TiendaContext";

// Hooks personalizados (temporalmente definidos aquí)
const useTracking = () => ({
  trackProductClick: async () => {
    console.log("Product click tracked");
  }
});

const useToast = () => ({
  showToast: (message: string, type: string) => {
    console.log(`Toast: ${message} (${type})`);
  }
});

function ProductoCard({
  producto,
  onClick,
  showCart = false,
  showEye = true,
  onAddCart,
  onEye,
  showFav = false,
}) {
  const { currentColors } = useTheme();
  const {
    isLogged,
    isCliente,
    isAdmin,
    favoritos,
    addFavorito,
    removeFavorito,
    carrito,
    addCarrito,
    removeCarrito,
  } = useUser();
  const router = useRouter();
  const { trackProductClick } = useTracking();
  const { showToast } = useToast();

  const isFav = favoritos?.some((p) => p.id === producto.id);
  const inCart = carrito?.some((p) => p.id === producto.id);
  const sinStock = producto.stock === 0;

  const basePrice = Number(producto?.precio || 0);
  const discount = Number(producto?.descuento || 0);
  const hasDiscount = !isNaN(discount) && discount > 0 && discount < 100;
  const fakeOldPrice = hasDiscount
    ? Math.ceil(basePrice / (1 - discount / 100))
    : basePrice;
  const finalPrice = hasDiscount ? basePrice * (1 - discount / 100) : basePrice;

  const getDetailUrl = () => {
    // Usar rutas dinámicas según el contexto
    const { tienda } = useTiendaContext();
    const routes = useTiendaRoutes(tienda);
    
    // Si estamos en contexto de admin, usar ruta de admin
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
      return `/admin/product-detail?id=${producto.id}`;
    }
    
    // Usar ruta dinámica de la tienda
    return `${routes.productDetail}?id=${producto.id}`;
  };

  const goToDetail = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    trackProductClick().catch(console.error);
    router.push(getDetailUrl());
  };

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isFav ? removeFavorito(producto.id) : addFavorito(producto);
  };

  const handleCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (sinStock) return;
    
    // Usar la función correcta según el estado actual
    if (inCart) {
      removeCarrito(producto.id);
      showToast("Eliminado del carrito", "info");
    } else {
      addCarrito({ ...producto, cantidad: 1 });
      showToast(`${producto.nombre} añadido al carrito`, "success");
    }
    
    // Si hay un callback adicional, ejecutarlo
    if (onAddCart) { 
      onAddCart(producto); 
    }
  };

  const detailUrl = getDetailUrl();

  // Validar que currentColors exista
  if (!currentColors) {
    return (
      <div className="flex items-center justify-center h-48" style={{ backgroundColor: "#0f172a" }}>
        <span className="text-white">Cargando...</span>
      </div>
    );
  }

  return (
    <Link href={detailUrl}>
      <div
        onClick={onClick || goToDetail}
        style={{
          backgroundColor: currentColors.bgSecondary,
          borderColor: currentColors.borderColor,
        }}
        className="
          group cursor-pointer
          rounded-2xl overflow-hidden
          shadow-sm
          hover:shadow-xl
          hover:border-[#7b68ee]
          transition-all duration-300
          border

          sm:h-full

          /* ── MÓVIL: horizontal (imagen izq + info der) ── */
          flex flex-row items-stretch

          /* ── SM+: vertical (imagen arriba + info abajo) ── */
          sm:flex-col
        "
      >
      <div
        style={{
          backgroundColor: currentColors.bgPrimary,
        }}
        className="
          relative flex-shrink-0 overflow-hidden

          /* móvil: cuadrado más pequeño a la izquierda (optimizado) */
          w-[110px] h-[140px]

          /* sm+: ancho completo, altura optimizada para móvil */
          sm:w-full sm:h-48
        "
      >
        <img
          src={producto.imagenes?.[0] || "/no-image.png"}
          alt={producto.nombre}
          className="
            w-full h-full
            object-contain
            p-3 sm:p-5
            group-hover:scale-105
            transition-transform duration-500
          "
          loading="lazy"
        />
        {/* Badge descuento */}
        {hasDiscount && (
          <span 
            style={{
              backgroundColor: currentColors.accentColor,
              color: currentColors.buttonText,
            }}
            className="
              absolute top-2 left-2 z-10
              text-[10px] sm:text-xs font-bold
              px-1.5 sm:px-2 py-0.5 sm:py-1
              rounded-full shadow
            "
          >
            -{discount}%
          </span>
        )}

        {/* Overlay sin stock */}
        {sinStock && (
          <div 
            style={{
              backgroundColor: currentColors.bgPrimary === '#ffffff' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
            }}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <span 
              style={{
                backgroundColor: currentColors.bgPrimary,
                borderColor: currentColors.borderColor,
                color: currentColors.textSecondary,
              }}
              className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border"
            >
              Sin stock
            </span>
          </div>
        )}

        {/* Botón favorito — solo si el usuario está logueado */}
        {isLogged && (
          <button
            onClick={handleFav}
            style={{
              backgroundColor: isFav ? '#ec4899' : (currentColors.bgPrimary === '#ffffff' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.8)'),
              color: isFav ? '#ffffff' : currentColors.textSecondary,
            }}
            className={`
              absolute top-2 right-2 z-20
              w-8 h-8 rounded-full
              flex items-center justify-center
              transition-all duration-200 shadow-sm
              ${isFav
                ? "scale-100"
                : "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
              }
            `}
            title={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
          >
            <span className="material-icons-round text-[16px]">
              {isFav ? "favorite" : "favorite_border"}
            </span>
          </button>
        )}
      </div>

      {/* ══ INFO ════════════════════════════════════════════════ */}
      <div className="
        flex flex-col flex-1 min-w-0
        p-2 sm:p-4
        justify-between
        sm:h-full
      ">
        {/* Nombre */}
        <p 
          style={{
            color: currentColors.textPrimary,
          }}
          className="
            font-semibold leading-tight

            /* móvil: más grande para aprovechar el espacio horizontal */
            text-base
            sm:text-sm

            /* recortar si es muy largo */
            line-clamp-3 sm:line-clamp-3
          ">
          {producto.nombre}
        </p>

        {/* Descripción corta — solo en móvil donde hay más espacio */}
        {producto.descripcion && (
          <p 
            style={{
              color: currentColors.textSecondary,
            }}
            className="
            mt-0.5 text-xs line-clamp-2
            sm:hidden
          ">
            {producto.descripcion}
          </p>
        )}

        {/* Precios */}
        <div className="mt-1 sm:mt-3 flex items-baseline gap-2 flex-wrap">
          {hasDiscount && (
            <span 
              style={{
                color: currentColors.textSecondary,
              }}
              className="text-xs sm:text-sm line-through"
            >
              ${fakeOldPrice.toFixed(2)}
            </span>
          )}
          <span 
            style={{
              color: currentColors.accentColor,
            }}
            className="
            text-xl sm:text-lg font-extrabold
          ">
            ${basePrice.toFixed(2)}
          </span>
        </div>

        {/* Acciones */}
        {(showCart || showEye) && (
          <div className="mt-2 sm:mt-3 flex gap-2">
            {showCart && (
              <button
                onClick={handleCart}
                disabled={sinStock}
                style={{
                  backgroundColor: sinStock 
                    ? (currentColors.bgPrimary === '#ffffff' ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)')
                    : inCart
                      ? (currentColors.bgPrimary === '#ffffff' ? '#ede9fe' : 'rgba(139, 92, 246, 0.2)')
                      : currentColors.accentColor,
                  color: sinStock
                    ? currentColors.textSecondary
                    : inCart
                      ? currentColors.accentColor
                      : currentColors.buttonText,
                }}
                className={`
                  flex-1 flex items-center justify-center gap-1.5
                  py-2 rounded-xl text-sm font-semibold
                  transition-all duration-200
                  ${sinStock
                    ? "cursor-not-allowed"
                    : "shadow-sm hover:shadow-md active:scale-95"
                  }
                `}
              >
                <span className="material-icons-round text-[16px]">
                  {inCart ? "remove_shopping_cart" : "add_shopping_cart"}
                </span>
                <span className="hidden xs:inline sm:hidden lg:inline">
                  {inCart ? "Quitar" : "Añadir"}
                </span>
              </button>
            )}

            {showEye && (
              <button
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation(); 
                  onEye ? onEye(producto) : goToDetail(e); 
                }}
                style={{
                  backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
                  color: currentColors.textSecondary,
                }}
                className="
                  flex items-center justify-center
                  w-9 h-9 rounded-xl flex-shrink-0
                  transition-all duration-200
                  hover:opacity-80
                "
                title="Ver detalle"
              >
                <span className="material-icons-round text-[18px]">visibility</span>
              </button>
            )}
          </div>
        )}
      </div>
      </div>
    </Link>
  );
}

// Memoizar para evitar re-renders innecesarios cuando aparece en listas
export default React.memo(ProductoCard, (prevProps, nextProps) => {
  // El componente se re-renderiza si el ID del producto cambió
  // O si las props de visibilidad cambiaron
  return (
    prevProps.producto.id === nextProps.producto.id &&
    prevProps.showCart === nextProps.showCart &&
    prevProps.showEye === nextProps.showEye &&
    prevProps.showFav === nextProps.showFav
  );
});