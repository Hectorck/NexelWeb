"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icons, getCategoryIcon } from "./Icons";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { obtenerProductos } from "../../lib/productos-db";
import { cerrarSesion, obtenerRedesSociales, obtenerLogo, obtenerUbicacion, obtenerTiendasUsuario, RedesSociales, Ubicacion } from "../../lib/firebaseService";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import { useUser } from "../context/UserContext";
import { useTiendaRoutes } from "@/lib/useTiendaRoutes";

// ─────────────────────────────────────────────
// Acordeón de categorías para el drawer móvil
// ─────────────────────────────────────────────
function MobileCategoriesAccordion({ basePath }: { basePath: string }) {
  const [categorias, setCategorias] = React.useState<any[]>([]);
  const [openCat, setOpenCat] = React.useState<string | null>(null);
  const [openSub, setOpenSub] = React.useState<string | null>(null);

  // Ordenar categorías recursivamente por el campo 'orden'
  const sortByOrder = (items: any[]): any[] => {
    return items
      .sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999))
      .map(item => ({
        ...item,
        subcategorias: item.subcategorias ? sortByOrder(item.subcategorias) : undefined
      }));
  };

  React.useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "categorias"),
      (snap) => {
        const cats = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCategorias(sortByOrder(cats));
      }
    );
    return () => unsub();
  }, []);

  return (
    <div className="flex flex-col gap-1 my-3">
      <p className="text-xs font-semibold uppercase tracking-wider px-2 mb-1"
        style={{ color: "var(--textMuted)" }}>
        Categorías
      </p>
      {categorias.map((cat) => (
        <div key={cat.id}>
          <button
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ color: "var(--text)" }}
            onClick={() =>
              setOpenCat(openCat === cat.id ? null : cat.id)
            }
          >
            <span className="flex items-center gap-2">
              {cat.icono && (
                <span className="text-base"
                  style={{ color: "var(--accent)" }}>
                  {getCategoryIcon(cat.icono)}
                </span>
              )}
              <span className="text-sm font-medium">{cat.nombre}</span>
            </span>
            {cat.subcategorias?.length > 0 && (
              <span
                className="transition-transform duration-200"
                style={{
                  color: "var(--textMuted)",
                  transform: openCat === cat.id ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                {Icons.expand_more}
              </span>
            )}
          </button>

          {cat.subcategorias?.length > 0 && openCat === cat.id && (
            <div className="ml-4 mb-1 rounded-xl overflow-hidden border"
              style={{ borderColor: "var(--border)" }}>
              {cat.subcategorias.map((sub: any) => (
                <div key={sub.id}>
                  {sub.subcategorias?.length > 0 ? (
                    <>
                      <button
                        className="w-full flex items-center justify-between px-3 py-2 text-sm transition-shadow hover:shadow-sm rounded-md"
                        style={{ color: "var(--text)" }}
                        onClick={() =>
                          setOpenSub(openSub === sub.id ? null : sub.id)
                        }
                      >
                        <span>{sub.nombre}</span>
                        <span
                          className="material-icons-round text-sm transition-transform duration-200"
                          style={{
                            color: "var(--textMuted)",
                            transform:
                              openSub === sub.id
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                          }}
                        >
                          arrow_drop_down
                        </span>
                      </button>
                      {openSub === sub.id && (
                        <div className="ml-3 border-l"
                          style={{ borderColor: "var(--border)" }}>
                          {sub.subcategorias.map((subsub: any) => (
                            <a
                              key={subsub.id}
                              href={`${basePath}?cat=${cat.id}&sub=${sub.id}&subsub=${subsub.id}`}
                              className="block px-4 py-2 text-xs transition-colors"
                              style={{ color: "var(--textMuted)" }}
                            >
                              {subsub.nombre}
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <a
                      href={`${basePath}?cat=${cat.id}&sub=${sub.id}`}
                      className="block px-3 py-2 text-sm transition-shadow hover:shadow-sm rounded-md"
                      style={{ color: "var(--text)" }}
                    >
                      {sub.nombre}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {!cat.subcategorias?.length && openCat === cat.id && (
            <a
              href={`${basePath}?cat=${cat.id}`}
              className="block px-3 py-2 text-sm"
              style={{ color: "var(--text)" }}
            >
              {cat.nombre}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Navbar principal
// ─────────────────────────────────────────────
export const Navbar = () => {
  const { user, usuario, isAuthenticated } = useAuth();
  const { currentColors } = useTheme();
  const { user: userFromContext, carrito } = useUser();
  
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [openCatId, setOpenCatId] = useState<string | null>(null); // Para dropdown nivel 1 en tablet/desktop
  const [openSubId, setOpenSubId] = useState<string | null>(null); // Para dropdown nivel 2 en tablet/desktop
  const [windowWidth, setWindowWidth] = useState<number | null>(null);
  
  // Estado para tiendas del usuario
  const [tiendas, setTiendas] = useState<any[]>([]);
  
  // Obtener la primera tienda para generar rutas dinámicas
  const tienda = tiendas?.[0] || null;
  const routes = useTiendaRoutes(tienda);

  // Debug logs
  console.log("🔍 Navbar - Firebase User:", user);
  console.log("🔍 Navbar - Usuario Firestore:", usuario);
  console.log("🔍 Navbar - isAuthenticated:", isAuthenticated);
  console.log("🔍 Navbar - usuario.role:", usuario?.role);

  const [redesSociales, setRedesSociales] = useState<RedesSociales>({});
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [ubicacion, setUbicacion] = useState<Ubicacion>({});

  // Categorías integradas
  const [categorias, setCategorias] = useState<any[]>([]);
  const [tiendaActual, setTiendaActual] = useState<any>(null);

  useEffect(() => { setMounted(true); }, []);

  // Cargar tiendas
  useEffect(() => {
    if (usuario?.uid) {
      obtenerTiendasUsuario(usuario.uid).then((tiendasData) => {
        setTiendas(tiendasData);
        if (tiendasData.length > 0) {
          setTiendaActual(tiendasData[0]);
        }
      });
    }
  }, [usuario?.uid]);

  // Escuchar categorías desde Firestore con aislamiento
  useEffect(() => {
    if (!tiendaActual || !usuario) return;
    
    const sortByOrder = (items: any[]): any[] => {
      return items
        .sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999))
        .map(item => ({
          ...item,
          subcategorias: item.subcategorias ? sortByOrder(item.subcategorias) : undefined
        }));
    };

    const unsub = onSnapshot(
      query(collection(db, "categorias"),
        where("usuarioId", "==", usuario.uid),
        where("tiendaId", "==", tiendaActual.id)
      ),
      (snap) => {
        const cats = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCategorias(sortByOrder(cats));
      }
    );
    return () => unsub();
  }, [tiendaActual, usuario]);

  // Cargar redes sociales del usuario
  useEffect(() => {
    if (user?.uid) {
      obtenerRedesSociales(user.uid).then((redes) => {
        setRedesSociales(redes);
      });
    }
  }, [user?.uid]);

  // Cargar logo del usuario
  useEffect(() => {
    if (user?.uid) {
      obtenerLogo(user.uid).then((logo) => {
        setLogoUrl(logo);
      }).catch(() => {
        setLogoUrl(null);
      });
    }
  }, [user?.uid]);

  // Cargar ubicación del usuario
  useEffect(() => {
    if (user?.uid) {
      obtenerUbicacion(user.uid).then((ubicacionData) => {
        setUbicacion(ubicacionData);
      });
      
      // Cargar tiendas del usuario
      const cargarTiendas = async () => {
        try {
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
          setTiendas(data.tiendas || []);
        } catch (error) {
          console.error("Error cargando tiendas:", error);
          setTiendas([]);
        }
      };
      
      cargarTiendas();
    }
  }, [user?.uid]);

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth);
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  
  if (!mounted) return null;

  const isClient = usuario?.role === "pre-cliente" || usuario?.role === "cliente";
  const isAdmin = usuario?.role === "admin";
  
  // Calcular total de productos (sumando cantidades)
  const totalProductos = carrito?.reduce((total, item) => total + (item.cantidad || 1), 0) || 0;

  const basePath = isClient
    ? routes.productsByCategory
    : isAdmin
    ? "/admin/products-by-category"
    : "/products-by-category";

  const links = usuario
    ? [
        { href: isClient ? routes.base : "/admin", label: "Inicio" },
        { href: isClient ? routes.blogs : "/admin/blogs", label: "Blogs" },
      ]
    : [
        { href: "/", label: "Inicio" },
        { href: "/blogs", label: "Blogs" },
      ];

  
  return (
    <>
      {/* ══════════════════ NAVBAR ══════════════════ */}
      <nav
        className="sticky top-0 z-40 border-b shadow-sm backdrop-blur-md"
        style={{ 
          background: currentColors?.bgPrimary || '#ffffff', 
          borderColor: currentColors?.bgPrimary === '#ffffff' ? currentColors?.borderColor || '#e5e7eb' : 'rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* ── Fila 1: Logo + Search | Centro: info + redes | Derecha: carrito + usuario ── */}
        <div
          className="flex items-center justify-between gap-4 px-4 py-1.5 lg:px-6 lg:py-3"
          style={{ color: currentColors?.textPrimary || '#1f2937' }}
        >
          {/* ── LEFT: hamburger + logo + búsqueda ── */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Hamburger móvil */}
            <button
              className="lg:hidden p-2 rounded-xl transition-colors"
              style={{ color: currentColors?.textPrimary || '#1f2937' }}
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              {Icons.menu}
            </button>

            {/* Logo */}
            <a
              href={usuario ? (isClient ? routes.base : "/admin") : "/"}
              className="flex items-center gap-2 text-lg font-bold tracking-tight whitespace-nowrap"
              style={{ color: currentColors?.textPrimary || '#1f2937' }}
            >
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Logo de la tienda" 
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    // Si la imagen falla, mostrar texto por defecto
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : null}
              <span className={logoUrl ? 'hidden' : ''}>
                MI-TIENDA
              </span>
            </a>

                      </div>

          {/* ── CENTER: Hablemos + Dirección + Redes (solo desktop) ── */}
          <div className="hidden lg:flex items-center gap-5 flex-1 justify-center">
            {redesSociales.whatsapp && (
              <>
                <a
                  href={`https://wa.me/${redesSociales.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70 whitespace-nowrap"
                  style={{ color: currentColors?.textPrimary || '#1f2937' }}
                >
                  {Icons.chat}
                  Hablemos
                </a>

                {/* Separador */}
                <span className="w-px h-4" style={{ background: currentColors?.bgPrimary === '#ffffff' ? currentColors?.borderColor || '#e5e7eb' : 'rgba(255, 255, 255, 0.08)' }} />
              </>
            )}

            {/* Ubicación dinámica */}
            {ubicacion.nombre && ubicacion.mapsLink && (
              <a
                href={ubicacion.mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70 whitespace-nowrap"
                style={{ color: currentColors?.textSecondary || '#6b7280' }}
              >
                {Icons.near_me}
                {ubicacion.nombre}
              </a>
            )}

            {/* Separador */}
            <span className="w-px h-4" style={{ background: currentColors?.borderColor || '#e5e7eb' }} />

            {/* Redes sociales */}
            <div className="flex items-center gap-1">
              {/* Facebook */}
              {redesSociales.facebook && (
                <a
                  href={redesSociales.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                  style={{ color: currentColors?.textPrimary || '#1f2937' }}
                  aria-label="Facebook"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                  </svg>
                </a>
              )}
              {/* Instagram */}
              {redesSociales.instagram && (
                <a
                  href={redesSociales.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                  style={{ color: currentColors?.textPrimary || '#1f2937' }}
                  aria-label="Instagram"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <circle cx="12" cy="12" r="4"/>
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                  </svg>
                </a>
              )}
              {/* TikTok */}
              {redesSociales.tiktok && (
                <a
                  href={redesSociales.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                  style={{ color: currentColors?.textPrimary || '#1f2937' }}
                  aria-label="TikTok"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* ── RIGHT: Carrito + Usuario ── */}
          <div className="hidden lg:flex items-center gap-4 ">
            {/* Carrito */}
            <div className="relative flex flex-col items-center">
              <a
                href={usuario ? (isClient ? routes.cart : "/admin/cart") : "/cart"}
                className="flex items-center justify-center px-1 rounded-xl transition-colors relative"
                style={{ background: currentColors?.bgSecondary || '#f5f5f5' }}
                aria-label="Carrito"
                data-onboarding="carrito"
              >
                {Icons.shopping_bag}
                {/* Badge mejorado */}
                {totalProductos > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 border-2 border-white dark:border-gray-800 shadow-lg z-10 animate-pulse"
                    style={{ 
                      fontSize: totalProductos > 99 ? '10px' : '11px',
                      lineHeight: '1'
                    }}
                  >
                    {totalProductos > 99 ? '99+' : totalProductos}
                  </span>
                )}
              </a>
            </div>

            {/* Usuario: si está logueado → avatar + menú; si no → botón "Ingresa" */}
            {usuario ? (
              <div className="relative">
                <button
                  className="rounded-full transition-opacity hover:opacity-80"
                  onClick={() => setUserMenu(!userMenu)}
                  title="Opciones de usuario"
                  data-onboarding="usuario"
                >
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Foto de perfil"
                      className="w-9 h-9 rounded-full object-cover border-2"
                      style={{ borderColor: currentColors?.bgPrimary === '#ffffff' ? currentColors?.borderColor || '#e5e7eb' : 'rgba(255, 255, 255, 0.08)' }}
                    />
                  ) : (
                    <span className="text-3xl" style={{ color: currentColors?.textPrimary || '#1f2937' }}>
                      {Icons.person}
                    </span>
                  )}
                </button>

                {userMenu && (
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-2xl border shadow-xl overflow-hidden z-50"
                    style={{ 
                      background: currentColors?.bgSecondary || '#f5f5f5', 
                      borderColor: currentColors?.bgPrimary === '#ffffff' ? currentColors?.borderColor || '#e5e7eb' : 'rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <a
                      href={isClient ? routes.perfil : "/admin/perfil"}
                      className="flex items-center gap-2 px-4 py-3 text-sm transition-colors"
                      style={{ color: currentColors?.textPrimary || '#1f2937' }}
                    >
                      {Icons.person}
                      Perfil
                    </a>
                    <a
                      href={isClient ? routes.config : "/admin/config"}
                      className="flex items-center gap-2 px-4 py-3 text-sm transition-colors"
                      style={{ color: currentColors?.textPrimary || '#1f2937' }}
                    >
                      {Icons.settings}
                      Configuración
                    </a>
                    <div className="border-t" style={{ borderColor: currentColors?.bgPrimary === '#ffffff' ? currentColors?.borderColor || '#e5e7eb' : 'rgba(255, 255, 255, 0.08)' }} />
                    <button
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left text-red-500 font-medium transition-colors"
                      onClick={async () => {
                        await cerrarSesion();
                        try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
                        window.location.href = "/";
                      }}
                    >
                      {Icons.logout}
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a
                href="/login"
                className="flex items-center gap-2 p-1 rounded-xl border-2 text-sm font-semibold transition-opacity hover:opacity-80 whitespace-nowrap"
                style={{ 
                  borderColor: currentColors?.bgPrimary === '#ffffff' ? currentColors?.borderColor || '#e5e7eb' : 'rgba(255, 255, 255, 0.08)',
                  color: currentColors?.textPrimary || '#1f2937'
                }}
                data-onboarding="usuario"
              >
                <span className="material-icons-round text-base">person</span>
                Ingresa
              </a>
            )}
          </div>

          {/* ── RIGHT móvil ── */}
          <div className="lg:hidden flex items-center gap-2">
            {/* Carrito móvil */}
            <div className="relative">
              <a
                href={usuario ? (isClient ? routes.cart : "/admin/cart") : "/cart"}
                className="flex items-center justify-center p-2 rounded-xl transition-colors relative"
                style={{ background: currentColors?.bgSecondary || '#f5f5f5' }}
                aria-label="Carrito móvil"
              >
                {Icons.shopping_bag}
                {/* Badge móvil */}
                {totalProductos > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-4 flex items-center justify-center px-0.5 border border-white dark:border-gray-800 shadow-md z-10"
                    style={{ 
                      fontSize: totalProductos > 99 ? '9px' : '10px',
                      lineHeight: '1'
                    }}
                  >
                    {totalProductos > 99 ? '99+' : totalProductos}
                  </span>
                )}
              </a>
            </div>
          </div>
        </div>

        {/* ── Fila 2: Links de nav + Categorías centrados (solo desktop) ── */}
        <div
          className="hidden lg:flex items-center justify-center gap-1 px-6 border-t flex-wrap"
          style={{ borderColor: currentColors?.bgPrimary === '#ffffff' ? currentColors?.borderColor || '#e5e7eb' : 'rgba(255, 255, 255, 0.08)' }}
        >
          {/* Links fijos: Inicio, Blogs */}
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-shadow rounded-xl hover:shadow-sm"
              style={{ color: currentColors?.textPrimary || '#1f2937' }}
            >
              {link.label}
            </a>
          ))}

          {/* Separador visual */}
          {categorias.length > 0 && (
            <span
              className="w-px h-4 mx-1 self-center"
              style={{ background: currentColors?.bgPrimary === '#ffffff' ? currentColors?.borderColor || '#e5e7eb' : 'rgba(255, 255, 255, 0.08)' }}
            />
          )}

          {/* Categorías dinámicas */}
          {categorias.map((cat) => (
            <div 
              key={cat.id} 
              className="relative group shrink-0"
              onMouseEnter={() => windowWidth !== null && windowWidth >= 1024 && setOpenCatId(cat.id)}
              onMouseLeave={() => windowWidth !== null && windowWidth >= 1024 && setOpenCatId(null)}
            >
              {cat.subcategorias?.length > 0 ? (
                <button
                  onClick={() => setOpenCatId(openCatId === cat.id ? null : cat.id)}
                  className="flex items-center gap-1 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-shadow rounded-xl hover:shadow-sm"
                  style={{ color: currentColors?.textPrimary || '#1f2937' }}
                >
                  {cat.icono && (
                    <span style={{ fontSize: 15, color: currentColors?.accentColor || '#06b6d4' }}>
                      {getCategoryIcon(cat.icono)}
                    </span>
                  )}
                  <span>{cat.nombre}</span>
                  <span
                    className="transition-transform duration-200"
                    style={{ 
                      fontSize: 14, 
                      color: currentColors?.textSecondary || '#6b7280',
                      transform: openCatId === cat.id ? "rotate(180deg)" : "rotate(0deg)" 
                    }}
                  >
                    {getCategoryIcon('expand_more')}
                  </span>
                </button>
              ) : (
                <Link
                  href={`${basePath}?cat=${cat.id}`}
                  className="flex items-center gap-1 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-shadow rounded-xl hover:shadow-sm"
                  style={{ color: currentColors?.textPrimary || '#1f2937' }}
                >
                  {cat.icono && (
                    <span style={{ fontSize: 15, color: currentColors?.accentColor || '#06b6d4' }}>
                      {getCategoryIcon(cat.icono)}
                    </span>
                  )}
                  <span>{cat.nombre}</span>
                </Link>
              )}

              {/* Dropdown nivel 1 */}
              {cat.subcategorias?.length > 0 && (
                <div
                  className="absolute left-0 top-full min-w-52 rounded-2xl border shadow-xl py-1.5 z-50"
                  style={{
                    borderColor: currentColors?.bgPrimary === '#ffffff' ? currentColors?.borderColor || '#e5e7eb' : 'rgba(255, 255, 255, 0.08)',
                    background: currentColors?.bgSecondary || '#f5f5f5',
                    opacity: openCatId === cat.id ? "1" : "0",
                    pointerEvents: openCatId === cat.id ? "auto" : "none",
                    transform: openCatId === cat.id ? "translateY(0)" : "translateY(-10px)",
                    transition: "all 150ms",
                  }}
                >
                  {cat.subcategorias.map((sub: any) => (
                    <div 
                      key={sub.id} 
                      className="relative group/sub"
                      onMouseEnter={() => windowWidth !== null && windowWidth >= 1024 && setOpenSubId(sub.id)}
                      onMouseLeave={() => windowWidth !== null && windowWidth >= 1024 && setOpenSubId(null)}
                    >
                      {sub.subcategorias?.length > 0 ? (
                        <>
                          <button
                            className="flex items-center justify-between w-full px-4 py-2 text-left text-sm transition-colors hover:bg-opacity-10"
                            style={{ color: currentColors?.textPrimary || '#1f2937' }}
                          >
                            <span>{sub.nombre}</span>
                            <span
                              className="transition-transform duration-200"
                              style={{ 
                                color: currentColors?.textSecondary || '#6b7280',
                                transform: openSubId === sub.id ? "rotate(90deg)" : "rotate(0deg)" 
                              }}
                            >
                              chevron_right
                            </span>

                            {/* Dropdown nivel 2 */}
                            <div
                              className="absolute left-full top-0 ml-1 min-w-44 rounded-2xl border shadow-xl py-1.5 z-60"
                              style={{
                                borderColor: currentColors?.bgPrimary === '#ffffff' ? currentColors?.borderColor || '#e5e7eb' : 'rgba(255, 255, 255, 0.08)',
                                background: currentColors?.bgSecondary || '#f5f5f5',
                                opacity: openSubId === sub.id ? "1" : "0",
                                pointerEvents: openSubId === sub.id ? "auto" : "none",
                                transform: openSubId === sub.id ? "translateX(0)" : "translateX(-10px)",
                                transition: "all 150ms",
                              }}
                            >
                              {sub.subcategorias.map((subsub: any) => (
                                <Link
                                  key={subsub.id}
                                  href={`${basePath}?cat=${cat.id}&sub=${sub.id}&subsub=${subsub.id}`}
                                  className="block px-4 py-2 text-sm transition-colors hover:bg-opacity-10"
                                  style={{ color: currentColors?.textPrimary || '#1f2937' }}
                                >
                                  {subsub.nombre}
                                </Link>
                              ))}
                            </div>
                          </button>
                        </>
                      ) : (
                        <Link
                          href={`${basePath}?cat=${cat.id}&sub=${sub.id}`}
                          className="block px-4 py-2 text-sm transition-colors hover:bg-opacity-10"
                          style={{ color: currentColors?.textPrimary || '#1f2937' }}
                        >
                          {sub.nombre}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* ──────────────────────── DRAWER MÓVIL ──────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="fixed top-0 left-0 h-full w-80 max-w-full shadow-xl overflow-y-auto"
            style={{
              background: currentColors?.bgPrimary || '#ffffff',
              borderColor: currentColors?.bgPrimary === '#ffffff' ? currentColors?.borderColor || '#e5e7eb' : 'rgba(255, 255, 255, 0.08)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del drawer */}
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: currentColors?.bgPrimary === '#ffffff' ? currentColors?.borderColor || '#e5e7eb' : 'rgba(255, 255, 255, 0.08)' }}
            >
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="Logo de la tienda" 
                    className="h-10 w-auto object-contain"
                  />
                ) : (
                  <span 
                    className="text-lg font-bold"
                    style={{ color: currentColors?.textPrimary || '#1f2937' }}
                  >
                    MI-TIENDA
                  </span>
                )}
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-xl transition-colors"
                style={{ color: currentColors?.textSecondary || '#6b7280' }}
              >
                <span className="material-icons-round text-xl">close</span>
              </button>
            </div>

            <div className="flex-1 px-4 py-4 flex flex-col gap-1">
              {/* Usuario - Iniciar sesión PRIMERO */}
              {!user && (
                <>
                  <a
                    href="/login"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{ 
                      background: currentColors?.buttonBg || '#3b82f6',
                      color: currentColors?.buttonText || '#ffffff'
                    }}
                  >
                    <span className="material-icons-round text-base">person</span>
                    Iniciar sesión
                  </a>
                  <div className="border-t my-2" style={{ borderColor: currentColors?.borderColor || '#e5e7eb' }} />
                </>
              )}

              {/* Links */}
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ color: currentColors?.textPrimary || '#1f2937' }}
                >
                  {link.label}
                </a>
              ))}

              {/* Categorías en acordeón */}
              <MobileCategoriesAccordion basePath={basePath} />

              {/* Divisor */}
              <div className="border-t my-2" style={{ borderColor: currentColors?.borderColor || '#e5e7eb' }} />

              {/* Usuario - Opciones si está autenticado */}
              {user && (
                <>
                  <a
                    href={isClient ? routes.perfil : "/admin/perfil"}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
                    style={{ color: currentColors?.textPrimary || '#1f2937' }}
                  >
                    <span className="material-icons-round text-base">person</span>
                    Perfil
                  </a>
                  <a
                    href={isClient ? routes.config : "/admin/config"}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
                    style={{ color: currentColors?.textPrimary || '#1f2937' }}
                  >
                    <span className="material-icons-round text-base">settings</span>
                    Configuración
                  </a>
                  <button
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left text-red-500 font-medium transition-colors"
                    onClick={async () => {
                      await cerrarSesion();
                      try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
                      window.location.href = "/";
                    }}
                  >
                    <span className="material-icons-round text-base">logout</span>
                    Cerrar sesión
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
