"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTiendaRoutes } from "@/lib/useTiendaRoutes";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import { useEffect } from "react";

// Iconos SVG consistentes con el Sidebar
const icons = {
  home: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  inventory: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  blogs: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  ),
  settings: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  person: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

export default function BottomBar() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { user } = useAuth();
  const { currentColors } = useTheme();
  
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
      label: "Panel"
    },
    {
      name: "Inventario",
      href: routes.inventario,
      icon: "inventory",
      label: "Productos"
    },
    {
      name: "Blogs",
      href: routes.editBlogs,
      icon: "blogs",
      label: "Contenido"
    },
    {
      name: "Config.",
      href: routes.config,
      icon: "settings",
      label: "Ajustes"
    },
    {
      name: "Perfil",
      href: routes.perfil,
      icon: "person",
      label: "Cuenta"
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
    <div 
      className="lg:hidden fixed bottom-0 left-0 right-0 border-t z-50 shadow-2xl"
      style={{
        background: `linear-gradient(to top, ${currentColors?.bgPrimary || '#ffffff'}, ${currentColors?.bgSecondary || '#f8fafc'})`,
        borderColor: currentColors?.borderColor || '#e2e8f0'
      }}
    >
      {/* Indicador de estado */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 opacity-80" 
        style={{
          background: `linear-gradient(to right, ${currentColors?.accentColor || '#10b981'}, ${currentColors?.whatsappColor || '#059669'})`
        }}
      />
      
      <div className="grid grid-cols-5 h-20 pb-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== routes.base && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`
                relative flex flex-col items-center justify-center space-y-1 transition-all duration-200
              `}
              style={{
                color: isActive 
                  ? (currentColors?.accentColor || '#10b981')
                  : (currentColors?.textSecondary || '#6b7280')
              }}
            >
              {/* Indicador activo */}
              {isActive && (
                <div 
                  className="absolute -top-1 w-8 h-1 rounded-full" 
                  style={{
                    background: `linear-gradient(to right, ${currentColors?.accentColor || '#10b981'}, ${currentColors?.whatsappColor || '#059669'})`
                  }}
                />
              )}
              
              {/* Icono con animación */}
              <div className={`
                relative transition-all duration-200 transform
                ${isActive ? 'scale-110' : 'scale-100'}
                ${hoveredItem === item.name && !isActive ? 'scale-105' : ''}
              `}>
                <div style={{
                  color: isActive ? (currentColors?.accentColor || '#10b981') : 'inherit'
                }}>
                  {icons[item.icon as keyof typeof icons]}
                </div>
                
                {/* Badge de notificación (opcional) */}
                {item.name === "Inventario" && (
                  <div 
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse" 
                    style={{
                      backgroundColor: currentColors?.accentColor || '#ef4444'
                    }}
                  />
                )}
              </div>
              
              {/* Texto */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium">{item.name}</span>
                {hoveredItem === item.name && (
                  <span className="text-xs opacity-75">{item.label}</span>
                )}
              </div>
              
              {/* Efecto de onda al hacer hover */}
              {hoveredItem === item.name && !isActive && (
                <div 
                  className="absolute inset-0 rounded-lg scale-95 opacity-50" 
                  style={{
                    backgroundColor: currentColors?.bgAccent || '#f0f9ff'
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
      
      {/* Barra de estado inferior */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-0.5" 
        style={{
          background: `linear-gradient(to right, ${currentColors?.accentColor || '#10b981'}80, ${currentColors?.whatsappColor || '#059669'}50, ${currentColors?.accentColor || '#10b981'}50)`
        }}
      />
    </div>
  );
}
