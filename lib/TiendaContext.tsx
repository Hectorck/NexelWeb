"use client";

import React, { createContext, useContext, ReactNode } from 'react';

interface Tienda {
  id: string;
  nombre: string;
  descripcion?: string;
  logo?: string;
  config?: any;
}

interface TiendaContextType {
  tienda: Tienda | null;
  tiendaSlug: string;
  tiendaBasePath: string;
}

const TiendaContext = createContext<TiendaContextType | undefined>(undefined);

export function TiendaProvider({ 
  children, 
  tiendaSlug 
}: { 
  children: ReactNode;
  tiendaSlug: string;
}) {
  const tiendaBasePath = `/${tiendaSlug}`;
  
  return (
    <TiendaContext.Provider value={{ tienda: null, tiendaSlug, tiendaBasePath }}>
      {children}
    </TiendaContext.Provider>
  );
}

export function useTiendaContext() {
  const context = useContext(TiendaContext);
  
  // Si no hay contexto, devolver valores por defecto en lugar de error
  if (context === undefined) {
    return {
      tienda: null,
      tiendaSlug: 'mi-tienda', // fallback
      tiendaBasePath: '/mi-tienda' // fallback
    };
  }
  
  return context;
}
