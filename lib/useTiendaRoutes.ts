import { useMemo } from 'react';
import { usePathname } from 'next/navigation';

export function useTiendaRoutes(tienda?: { nombre: string } | null) {
  const pathname = usePathname();
  
  return useMemo(() => {
    // Usar el nombre real de la tienda si está disponible
    if (tienda?.nombre) {
      const tiendaSlug = tienda.nombre
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      const base = `/${tiendaSlug}`;

      return {
        base,
        config: `${base}/config`,
        inventario: `${base}/inventario`,
        perfil: `${base}/perfil`,
        blogs: `${base}/blogs`,
        editBlogs: `${base}/edit-blogs`,
        cart: `${base}/cart`,
        productDetail: `${base}/product-detail`,
        productsByCategory: `${base}/products-by-category`,
        searchResults: `${base}/search-results`
      };
    }

    // Fallback: usar el slug de la URL actual
    const pathSegments = pathname.split('/').filter(Boolean);
    const tiendaSlug = pathSegments[0] || 'mi-tienda';
    const base = `/${tiendaSlug}`;

    return {
      base,
      config: `${base}/config`,
      inventario: `${base}/inventario`,
      perfil: `${base}/perfil`,
      blogs: `${base}/blogs`,
      editBlogs: `${base}/edit-blogs`,
      cart: `${base}/cart`,
      productDetail: `${base}/product-detail`,
      productsByCategory: `${base}/products-by-category`,
      searchResults: `${base}/search-results`
    };
  }, [pathname, tienda?.nombre]);
}

// Función helper para generar slug
export function generarTiendaSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
