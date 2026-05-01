"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";
import { useTiendaRoutes } from "@/lib/useTiendaRoutes";
import { useAuth } from "@/lib/AuthContext";
import { useEffect } from "react";

// Iconos SVG mejorados
const icons = {
  home: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  inventory: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  blogs: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  person: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

export default function Sidebar() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { currentColors } = useTheme();
  const { user } = useAuth();
  
  // Estado para tiendas del usuario
  const [tiendas, setTiendas] = useState<any[]>([]);
  
  // Obtener la primera tienda para generar rutas dinámicas
  const tienda = tiendas?.[0] || null;
  const routes = useTiendaRoutes(tienda);
  
  // MenuItems dinámicos basados en las rutas
  const menuItems = [
    {
      name: "Inicio",
      href: routes.base,
      icon: "home",
      description: "Panel principal"
    },
    {
      name: "Inventario",
      href: routes.inventario,
      icon: "inventory",
      description: "Gestionar productos"
    },
    {
      name: "Crear blogs",
      href: routes.editBlogs,
      icon: "blogs",
      description: "Crear y gestionar blogs"
    },
    {
      name: "Configuración",
      href: routes.config,
      icon: "settings",
      description: "Ajustes de la tienda"
    },
    {
      name: "Mi Perfil",
      href: routes.perfil,
      icon: "person",
      description: "Información personal"
    },
  ];
  
  // Cargar tiendas del usuario
  useEffect(() => {
    if (user?.uid) {
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

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-80">
        {/* Sidebar con diseño moderno */}
        <div 
          className="flex flex-col flex-grow shadow-xl overflow-hidden"
          style={{
            background: `linear-gradient(to bottom, ${currentColors?.bgPrimary || '#ffffff'}, ${currentColors?.bgSecondary || '#f5f5f5'})`,
            borderRight: currentColors?.bgPrimary === '#ffffff' ? `1px solid ${currentColors?.borderColor || '#e5e7eb'}` : '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          
          {/* Header */}
          <div 
            className="p-6"
            style={{justifyItems:"center", borderBottom: currentColors?.bgPrimary === '#ffffff' ? `1px solid ${currentColors?.borderColor || '#e5e7eb'}` : '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <div className="flex items-center space-x-4">

              <div className="text-center">
                <h1 
                  className="text-xl font-bold"
                  style={{ color: currentColors?.textPrimary || '#1f2937' }}
                >
                  Mi Tienda
                </h1>
                <p 
                  className="text-sm"
                  style={{ color: currentColors?.textSecondary || '#6b7280' }}
                >
                  Panel de gestión
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-5 space-y-3">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/mi-tienda" && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="group flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-200 transform"
                  style={{
                    background: isActive 
                      ? `linear-gradient(to right, ${currentColors?.accentColor || '#06b6d4'}, ${currentColors?.buttonBg || '#3b82f6'})`
                      : 'transparent',
                    color: isActive 
                      ? (currentColors?.buttonText || '#ffffff')
                      : (currentColors?.textPrimary || '#1f2937'),
                    boxShadow: isActive 
                      ? '0 10px 25px rgba(0,0,0,0.1)' 
                      : (hoveredItem === item.name ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'),
                    transform: isActive ? 'scale(1.05)' : (hoveredItem === item.name ? 'scale(1.02)' : 'scale(1)')
                  }}
                >
                  <div 
                    className="flex-shrink-0 transition-transform duration-200"
                    style={{
                      transform: hoveredItem === item.name ? 'scale(1.1)' : 'scale(1)',
                      color: isActive 
                        ? (currentColors?.buttonText || '#ffffff')
                        : (currentColors?.textSecondary || '#6b7280')
                    }}
                  >
                    {icons[item.icon as keyof typeof icons]}
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div 
                      className="font-semibold text-base"
                      style={{ color: isActive 
                        ? (currentColors?.buttonText || '#ffffff')
                        : (currentColors?.textPrimary || '#1f2937')
                      }}
                    >
                      {item.name}
                    </div>
                    {hoveredItem === item.name && (
                      <div 
                        className="text-sm mt-1"
                        style={{ 
                          color: isActive 
                            ? (currentColors?.buttonText || '#ffffff')
                            : (currentColors?.textSecondary || '#6b7280'),
                          opacity: 0.75 
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>

                  {/* Indicador activo */}
                  {isActive && (
                    <div 
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: currentColors?.buttonText || '#ffffff' }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer con información */}
          <div 
            className="p-6"
            style={{ borderTop: currentColors?.bgPrimary === '#ffffff' ? `1px solid ${currentColors?.borderColor || '#e5e7eb'}` : '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <div 
              className="rounded-lg p-4"
              style={{
                background: `linear-gradient(to right, ${currentColors?.bgAccent || '#f0f4ff'}, ${currentColors?.bgSecondary || '#f5f5f5'})`
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{ backgroundColor: currentColors?.accentColor || '#06b6d4' }}
                />
                <span 
                  className="text-sm font-semibold"
                  style={{ color: currentColors?.accentColor || '#06b6d4' }}
                >
                  Tienda Activa
                </span>
              </div>
              <p 
                className="text-sm"
                style={{ color: currentColors?.textSecondary || '#6b7280' }}
              >
                Gestiona tu inventario y configura tu tienda online
              </p>
            </div>
            
            <div 
              className="flex items-center justify-between mt-4 text-sm"
              style={{ color: currentColors?.textSecondary || '#6b7280' }}
            >

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
