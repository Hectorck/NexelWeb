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

// Obtener categorías de un usuario específico
export async function obtenerCategoriasUsuario(uid: string) {
  const snapshot = await getDocs(
    query(collection(db, COLLECTION), orderBy("orden", "asc"))
  );
  const todasCategorias = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Filtrar categorías del usuario actual
  const categoriasUsuario = todasCategorias.filter((cat: any) => cat.usuarioId === uid);
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

export async function guardarCategoria(categoria, usuarioId: string) {
  const categoriaConUsuario = {
    ...cleanUndefinedDeep(categoria),
    usuarioId,
    createdAt: new Date()
  };
  await setDoc(doc(db, COLLECTION, categoria.id), categoriaConUsuario);
}

export async function actualizarCategoria(id, data) {
  await updateDoc(doc(db, COLLECTION, id), cleanUndefinedDeep(data));
}

// Nueva función para guardar categoría de usuario
export async function guardarCategoriaUsuario(categoria, usuarioId: string) {
  return guardarCategoria(categoria, usuarioId);
}

export async function eliminarCategoria(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}
