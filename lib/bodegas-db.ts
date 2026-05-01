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

const COLLECTION = "bodegas";

export interface Bodega {
  id: string;
  nombre: string;
  tiempoEntrega: number; // en horas laborales (12 o 72)
  createdAt?: Date;
}

// Obtener bodegas de un usuario específico
export async function obtenerBodegasUsuario(uid: string): Promise<Bodega[]> {
  const snapshot = await getDocs(
    query(collection(db, COLLECTION), orderBy("nombre", "asc"))
  );
  const todasBodegas = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Bodega));
  
  // Filtrar bodegas del usuario actual
  return todasBodegas.filter((bodega: any) => bodega.usuarioId === uid);
}

// Mantener la función original por compatibilidad (para admin)
export async function obtenerBodegas(): Promise<Bodega[]> {
  const snapshot = await getDocs(
    query(collection(db, COLLECTION), orderBy("nombre", "asc"))
  );
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Bodega));
}

export async function crearBodega(nombre: string, tiempoEntrega: number = 72, usuarioId?: string): Promise<void> {
  const id = nombre.toLowerCase().replace(/\s+/g, "_");
  const bodegaData: any = {
    nombre,
    tiempoEntrega,
    createdAt: new Date()
  };
  
  if (usuarioId) {
    bodegaData.usuarioId = usuarioId;
  }
  
  await setDoc(doc(db, COLLECTION, id), bodegaData);
}

export async function crearBodegaUsuario(nombre: string, tiempoEntrega: number = 72, usuarioId: string): Promise<void> {
  return crearBodega(nombre, tiempoEntrega, usuarioId);
}

export async function actualizarBodega(id: string, nombre: string, tiempoEntrega: number): Promise<void> {
  await setDoc(doc(db, COLLECTION, id), {
    nombre,
    tiempoEntrega
  }, { merge: true });
}

export async function eliminarBodega(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

// Función para crear la bodega default para un usuario específico
export async function crearBodegaDefaultUsuario(usuarioId: string): Promise<void> {
  try {
    console.log("🏭 Creando bodega default para usuario:", usuarioId);
    
    const bodegas = await obtenerBodegasUsuario(usuarioId);
    const existeDefault = bodegas.some(b => b.id === "default");
    
    console.log("🏭 Bodegas existentes:", bodegas.length, "Default existe:", existeDefault);
    
    if (!existeDefault) {
      console.log("🏭 Creando nueva bodega default...");
      await crearBodegaUsuario("Default", 12, usuarioId);
      console.log("🏭 Bodega default creada exitosamente");
    } else {
      console.log("🏭 Bodega default ya existe");
    }
  } catch (error) {
    console.error("❌ Error al crear bodega default para usuario:", error);
    // No lanzar el error para que no bloquee la carga de la página
  }
}

// Mantener la función original por compatibilidad (para admin)
export async function crearBodegaDefault(): Promise<void> {
  try {
    const bodegas = await obtenerBodegas();
    const existeDefault = bodegas.some(b => b.id === "technothings");
    
    if (!existeDefault) {
      await crearBodega("Technothings", 12);
    }
  } catch (error) {
    console.error("Error al crear bodega default:", error);
  }
}

// Listener para cambios en tiempo real
export function escucharBodegas(callback: (bodegas: Bodega[]) => void) {
  const unsub = onSnapshot(
    query(collection(db, COLLECTION), orderBy("nombre", "asc")),
    (snapshot) => {
      const bodegas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Bodega));
      callback(bodegas);
    }
  );
  return unsub;
}
