import { db } from "./firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";

const COLLECTION = "marcas";

// Obtener marcas de un usuario específico
export async function obtenerMarcasUsuario(uid: string) {
  const snapshot = await getDocs(
    query(collection(db, COLLECTION), orderBy("nombre", "asc"))
  );
  const todasMarcas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Filtrar marcas del usuario actual
  return todasMarcas.filter((marca: any) => marca.usuarioId === uid);
}

// Mantener la función original por compatibilidad (para admin)
export async function obtenerMarcas() {
  const snapshot = await getDocs(
    query(collection(db, COLLECTION), orderBy("nombre", "asc"))
  );
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function guardarMarca(nombre, usuarioId: string) {
  const id = nombre.toLowerCase().replace(/\s+/g, "_");
  await setDoc(doc(db, COLLECTION, id), { 
    nombre, 
    usuarioId,
    createdAt: new Date()
  });
}

export async function guardarMarcaUsuario(nombre: string, usuarioId: string) {
  return guardarMarca(nombre, usuarioId);
}

export async function eliminarMarca(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}
