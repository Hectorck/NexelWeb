import { db } from "./firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from "firebase/firestore";

const COLLECTION = "categorias";

function sortCategoriasByOrder(categorias: any[]): any[] {
  return categorias
    .sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999))
    .map(cat => ({
      ...cat,
      subcategorias: cat.subcategorias ? sortCategoriasByOrder(cat.subcategorias) : undefined
    }));
}

// Obtener categorías de un usuario y tienda específicos
export async function obtenerCategoriasUsuario(uid: string, tiendaId?: string) {
  const snapshot = await getDocs(
    query(collection(db, COLLECTION), orderBy("orden", "asc"))
  );
  const todasCategorias = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Filtrar categorías del usuario y tienda actual
  const categoriasUsuario = todasCategorias.filter((cat: any) => {
    // Primero filtrar por usuarioId
    if (cat.usuarioId !== uid) return false;
    
    // Si no se especifica tiendaId, solo incluir categorías sin tiendaId (datos antiguos)
    if (!tiendaId) return !cat.tiendaId;
    
    // Si se especifica tiendaId, SOLO incluir categorías con ese tiendaId exacto
    return cat.tiendaId === tiendaId;
  });
  return sortCategoriasByOrder(categoriasUsuario);
}

// Mantener la función original por compatibilidad (para admin)
export async function obtenerCategorias() {
  const snapshot = await getDocs(
    query(collection(db, COLLECTION), orderBy("orden", "asc"))
  );
  const categorias = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return sortCategoriasByOrder(categorias);
}



function cleanUndefinedDeep(obj) {
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

export async function guardarCategoria(categoria, usuarioId: string, tiendaId?: string) {
  const categoriaConUsuario = {
    ...cleanUndefinedDeep(categoria),
    usuarioId,
    tiendaId,
    createdAt: new Date()
  };
  // Crear ID único por usuario y tienda para evitar conflictos globales
  const documentoId = tiendaId ? `${tiendaId}_${usuarioId}_${categoria.id}` : `${usuarioId}_${categoria.id}`;
  await setDoc(doc(db, COLLECTION, documentoId), categoriaConUsuario);
}

export async function actualizarCategoria(id, data) {
  await updateDoc(doc(db, COLLECTION, id), cleanUndefinedDeep(data));
}

// Nueva función para guardar categoría de usuario
export async function guardarCategoriaUsuario(categoria, usuarioId: string, tiendaId?: string) {
  return guardarCategoria(categoria, usuarioId, tiendaId);
}

export async function eliminarCategoria(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}

// Nueva función para eliminar categoría de usuario específico
export async function eliminarCategoriaUsuario(id: string, usuarioId: string, tiendaId?: string) {
  const documentoId = tiendaId ? `${tiendaId}_${usuarioId}_${id}` : `${usuarioId}_${id}`;
  await deleteDoc(doc(db, COLLECTION, documentoId));
}

// Nueva función para actualizar categoría de usuario específico
export async function actualizarCategoriaUsuario(id: string, data: any, usuarioId: string, tiendaId?: string) {
  const documentoId = tiendaId ? `${tiendaId}_${usuarioId}_${id}` : `${usuarioId}_${id}`;
  await updateDoc(doc(db, COLLECTION, documentoId), cleanUndefinedDeep(data));
}
