"use client";
import React, { useState, useEffect, createContext, useContext } from "react";
import { ThemeProvider } from "@/lib/ThemeContext";
import { AuthProvider } from "@/lib/AuthContext";
import { UserProvider } from "../context/UserContext";
import { TiendaProvider } from "@/lib/TiendaContext";
import { Navbar } from "@/app/components/Navbar";
import Sidebar from "@/app/components/mi-tienda/Sidebar";
import BottomBar from "@/app/components/mi-tienda/BottomBar";

interface Tienda {
  id: string;
  nombre: string;
  descripcion?: string;
  logo?: string;
  config?: any;
}

interface TiendaDataContextType {
  tienda: Tienda | null;
  setTienda: (tienda: Tienda | null) => void;
}

const TiendaDataContext = createContext<TiendaDataContextType | undefined>(undefined);

function TiendaDataProvider({ children }: { children: React.ReactNode }) {
  const [tienda, setTienda] = useState<Tienda | null>(null);

  return (
    <TiendaDataContext.Provider value={{ tienda, setTienda }}>
      {children}
    </TiendaDataContext.Provider>
  );
}

function useTiendaData() {
  const context = useContext(TiendaDataContext);
  if (context === undefined) {
    throw new Error('useTiendaData debe ser usado dentro de TiendaDataProvider');
  }
  return context;
}

function TiendaLayoutContent({ children, urlSlug }: { children: React.ReactNode; urlSlug: string }) {
  const { tienda, setTienda } = useTiendaData();

  useEffect(() => {
    const fetchTienda = async () => {
      try {
        // Usar API en lugar de Firebase Admin directamente
        const response = await fetch(`/api/tiendas/slug?slug=${urlSlug}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.tienda) {
            setTienda(data.tienda);
          }
        }
      } catch (error) {
        console.error('Error obteniendo tienda:', error);
      }
    };

    fetchTienda();
  }, [urlSlug]);

  return (
    <TiendaProvider tiendaSlug={tienda?.nombre || urlSlug}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        
        <div className="flex">
          <Sidebar />
          
          <main className="flex-1 md:ml-0 mb-20 md:mb-0 pb-6 md:pb-0 min-w-0">
            {children}
          </main>
        </div>
        
        <BottomBar />
      </div>
    </TiendaProvider>
  );
}

export default function TiendaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tienda: string }>;
}) {
  const urlSlug = React.use(params).tienda;

  return (
    <AuthProvider>
      <ThemeProvider>
        <UserProvider>
          <TiendaDataProvider>
            <TiendaLayoutContent children={children} urlSlug={urlSlug} />
          </TiendaDataProvider>
        </UserProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
