// Tipos
export interface Producto {
  id: string;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  descuento?: number;
  stock?: number;
  categoria?: string;
  subcategoria?: string;
  subsubcategoria?: string;
  marca?: string;
  bodegaId?: string; // Referencia a la bodega para determinar tiempo de entrega
  destacado?: boolean;
  usuarioId?: string; // ID del usuario que creó el producto
  createdAt?: number | Date;
  fechaCreacion?: any;
  [key: string]: any;
}

// Obtener productos por subcategoría (usando los campos reales de Firestore)
// Si opts.incluirSinStock es true, no filtra por stock (solo para admin/inventario)
export async function obtenerProductosPorSubcategoria(subcategoria, categoria, excludeId = null, opts = {}) {
  // Filtra por subcategoria y categoria
  const q = query(
    collection(db, COLLECTION),
    where("subcategoria", "==", subcategoria),
    where("categoria", "==", categoria)
  );
  const snapshot = await getDocs(q);
  let productos = snapshot.docs.map(doc => {
    const data = doc.data();
    const producto = { id: doc.id, ...data };
    
    // Normalizar createdAt
    if (!producto.createdAt) {
      if (data.fechaCreacion && typeof data.fechaCreacion.toMillis === 'function') {
        producto.createdAt = data.fechaCreacion.toMillis();
      } else if (data.fechaCreacion && typeof data.fechaCreacion === 'number') {
        producto.createdAt = data.fechaCreacion;
      } else {
        producto.createdAt = 0;
      }
    }
    
    return producto;
  });
  
  if (!opts.incluirSinStock) {
    productos = productos.filter(p => typeof p.stock !== "number" || p.stock > 0);
  }
  if (excludeId) productos = productos.filter(p => p.id !== excludeId);
  return productos;
}

// Obtener productos por subsubcategoría (último nivel, usando los campos reales de Firestore)
export async function obtenerProductosPorSubsubcategoria(subsubcategoria, subcategoria, categoria, excludeId = null, opts = {}) {
  // Filtra por subsubcategoria, subcategoria y categoria
  const q = query(
    collection(db, COLLECTION),
    where("subsubcategoria", "==", subsubcategoria),
    where("subcategoria", "==", subcategoria),
    where("categoria", "==", categoria)
  );
  const snapshot = await getDocs(q);
  let productos = snapshot.docs.map(doc => {
    const data = doc.data();
    const producto = { id: doc.id, ...data };
    
    // Normalizar createdAt
    if (!producto.createdAt) {
      if (data.fechaCreacion && typeof data.fechaCreacion.toMillis === 'function') {
        producto.createdAt = data.fechaCreacion.toMillis();
      } else if (data.fechaCreacion && typeof data.fechaCreacion === 'number') {
        producto.createdAt = data.fechaCreacion;
      } else {
        producto.createdAt = 0;
      }
    }
    
    return producto;
  });
  
  if (!opts.incluirSinStock) {
    productos = productos.filter(p => typeof p.stock !== "number" || p.stock > 0);
  }
  if (excludeId) productos = productos.filter(p => p.id !== excludeId);
  return productos;
}
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where
} from "firebase/firestore";

const COLLECTION = "productos";

// Elimina recursivamente los campos undefined de un objeto
function cleanUndefinedDeep(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefinedDeep);
  } else if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanUndefinedDeep(v)])
    );
  }
  return obj;
}

// Crear producto
import { serverTimestamp } from "firebase/firestore";

export async function crearProducto(producto: Producto): Promise<Producto> {
  // Validar que el usuario tenga tienda antes de crear productos
  if (!producto.usuarioId) {
    throw new Error("El usuarioId es requerido para crear productos");
  }

  // Verificar si el usuario tiene tienda
  const { obtenerTiendasUsuario, actualizarTienda } = await import("./firebaseService");
  const tiendasUsuario = await obtenerTiendasUsuario(producto.usuarioId);
  
  if (tiendasUsuario.length === 0) {
    throw new Error("Debes crear una tienda antes de poder agregar productos. Ve a Configuración para crear tu tienda.");
  }

  const tienda = tiendasUsuario[0];

  const cleanProducto = cleanUndefinedDeep(producto);
  // Agregar campo de fecha de creación (timestamp en ms para ordenamiento)
  const productoConFecha = {
    ...cleanProducto,
    createdAt: Date.now(),
    fechaCreacion: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, COLLECTION), productoConFecha);

  // Actualizar el contador de productos en la tienda
  try {
    await actualizarTienda(tienda.id, {
      productos: (tienda.productos || 0) + 1
    });
    console.log(`✅ Contador de productos actualizado: ${tienda.productos || 0} → ${(tienda.productos || 0) + 1}`);
  } catch (error) {
    console.error("❌ Error al actualizar contador de productos en la tienda:", error);
    // No lanzamos error para no interrumpir la creación del producto
  }

  return { ...cleanProducto, id: docRef.id, createdAt: Date.now() };
}

// Obtener todos los productos
// Si opts.incluirSinStock es true, no filtra por stock (solo para admin/inventario)
export async function obtenerProductos(opts = {}) {
  const snapshot = await getDocs(collection(db, COLLECTION));
  let productos = snapshot.docs.map(doc => {
    const data = doc.data();
    const producto = { id: doc.id, ...data };
    
    // Normalizar createdAt: si no existe, intentar usar fechaCreacion o asignar 0
    if (!producto.createdAt) {
      if (data.fechaCreacion && typeof data.fechaCreacion.toMillis === 'function') {
        // Si fechaCreacion es un Timestamp de Firebase, convertir a ms
        producto.createdAt = data.fechaCreacion.toMillis();
      } else if (data.fechaCreacion && typeof data.fechaCreacion === 'number') {
        producto.createdAt = data.fechaCreacion;
      } else {
        // Si no hay fecha, asignar 0 (aparecerá al final)
        producto.createdAt = 0;
      }
    }
    
    return producto;
  });
  
  if (!opts.incluirSinStock) {
    productos = productos.filter(p => typeof p.stock !== "number" || p.stock > 0);
  }
  return productos;
}

// Obtener productos por categoría (usando el campo real de Firestore)
// Si opts.incluirSinStock es true, no filtra por stock (solo para admin/inventario)
export async function obtenerProductosPorCategoria(categoria, excludeId = null, opts = {}) {
  const q = query(collection(db, COLLECTION), where("categoria", "==", categoria));
  const snapshot = await getDocs(q);
  let productos = snapshot.docs.map(doc => {
    const data = doc.data();
    const producto = { id: doc.id, ...data };
    
    // Normalizar createdAt: si no existe, intentar usar fechaCreacion o asignar 0
    if (!producto.createdAt) {
      if (data.fechaCreacion && typeof data.fechaCreacion.toMillis === 'function') {
        // Si fechaCreacion es un Timestamp de Firebase, convertir a ms
        producto.createdAt = data.fechaCreacion.toMillis();
      } else if (data.fechaCreacion && typeof data.fechaCreacion === 'number') {
        producto.createdAt = data.fechaCreacion;
      } else {
        // Si no hay fecha, asignar 0 (aparecerá al final)
        producto.createdAt = 0;
      }
    }
    
    return producto;
  });
  
  if (!opts.incluirSinStock) {
    productos = productos.filter(p => typeof p.stock !== "number" || p.stock > 0);
  }
  if (excludeId) productos = productos.filter(p => p.id !== excludeId);
  return productos;
}

// Obtener producto por ID
export async function obtenerProductoPorId(id: string): Promise<Producto | null> {
  const docSnap = await getDoc(doc(db, COLLECTION, id));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

// Sincronizar contador de productos de una tienda (útil para corrección de datos)
export async function sincronizarContadorProductos(usuarioId: string): Promise<void> {
  try {
    const { obtenerTiendasUsuario, actualizarTienda, obtenerProductosUsuario } = await import("./firebaseService");
    
    // Obtener la tienda del usuario
    const tiendasUsuario = await obtenerTiendasUsuario(usuarioId);
    if (tiendasUsuario.length === 0) {
      console.log("❌ Usuario no tiene tiendas para sincronizar");
      return;
    }

    const tienda = tiendasUsuario[0];
    
    // Contar productos reales del usuario
    const productos = await obtenerProductosUsuario(usuarioId);
    const conteoReal = productos.length;
    
    // Actualizar el contador en la tienda
    await actualizarTienda(tienda.id, {
      productos: conteoReal
    });
    
    console.log(`✅ Contador sincronizado: ${tienda.productos || 0} → ${conteoReal} productos reales`);
  } catch (error) {
    console.error("❌ Error al sincronizar contador de productos:", error);
    throw error;
  }
}

// Actualizar producto
export async function actualizarProducto(id: string, data: Partial<Producto>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), cleanUndefinedDeep(data));
}

// Eliminar producto
export async function eliminarProducto(id: string): Promise<void> {
  // Obtener el producto antes de eliminar para saber a qué usuario pertenece
  const productoDoc = await getDoc(doc(db, COLLECTION, id));
  if (!productoDoc.exists()) {
    throw new Error("Producto no encontrado");
  }

  const producto = productoDoc.data() as any;
  const usuarioId = producto.usuarioId;

  // Eliminar el producto
  await deleteDoc(doc(db, COLLECTION, id));

  // Actualizar el contador de productos en la tienda
  if (usuarioId) {
    try {
      const { obtenerTiendasUsuario, actualizarTienda } = await import("./firebaseService");
      const tiendasUsuario = await obtenerTiendasUsuario(usuarioId);
      
      if (tiendasUsuario.length > 0) {
        const tienda = tiendasUsuario[0];
        const nuevoContador = Math.max(0, (tienda.productos || 0) - 1);
        
        await actualizarTienda(tienda.id, {
          productos: nuevoContador
        });
        console.log(`✅ Contador de productos actualizado: ${tienda.productos || 0} → ${nuevoContador}`);
      }
    } catch (error) {
      console.error("❌ Error al actualizar contador de productos en la tienda:", error);
      // No lanzamos error para no interrumpir la eliminación del producto
    }
  }
}
