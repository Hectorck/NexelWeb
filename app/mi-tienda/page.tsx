"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { obtenerTiendasUsuario } from '@/lib/firebaseService';

export default function MiTiendaFallback() {
  const router = useRouter();
  const { usuario, loading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const redirectToTienda = async () => {
      if (loading || redirecting) return;
      
      setRedirecting(true);
      
      try {
        if (!usuario) {
          router.push('/login');
          return;
        }

        if (usuario.role !== 'pre-cliente') {
          router.push('/');
          return;
        }

        // Obtener tiendas del usuario de forma optimizada
        const tiendas = await obtenerTiendasUsuario(usuario.uid);
        
        if (tiendas && tiendas.length > 0) {
          // Redirigir inmediatamente a la primera tienda
          const tienda = tiendas[0];
          const tiendaSlug = tienda.nombre
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
          
          // Redirección inmediata sin delays
          window.location.href = `/${tiendaSlug}`;
        } else {
          // Si no tiene tiendas, ir a config
          router.push('/mi-tienda/config');
        }
      } catch (error) {
        console.error('Error redirigiendo:', error);
        router.push('/mi-tienda/config');
      }
    };

    // Ejecutar inmediatamente sin delays
    redirectToTienda();
  }, [usuario, loading]);

  if (loading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {redirecting ? 'Redirigiendo a tu tienda...' : 'Cargando...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Configurando tu tienda...
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Serás redirigido automáticamente.
        </p>
      </div>
    </div>
  );
}
