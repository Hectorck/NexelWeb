import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  Query,
  QueryConstraint,
} from "firebase/firestore";
import { db, auth, storage } from "./firebase";
import { getStorage } from "firebase/storage";
import { app } from "./firebase";
import { Usuario, PreCliente, Cliente, Tienda, TiendaLimites } from "./types";
import { emailsCoinciden, normalizarEmail } from "./email";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";

type RolRegistro = "cliente" | "pre-cliente";

const buscarPreClienteInvitado = async (
  email: string
): Promise<(PreCliente & { id: string }) | null> => {
  const emailNormalizado = normalizarEmail(email);
  const snapshot = await getDocs(collection(db, "pre-clientes"));

  for (const preClienteDoc of snapshot.docs) {
    const preCliente = preClienteDoc.data() as PreCliente;
    if (
      preCliente.estado === "aprobado" &&
      (preCliente.emailNormalizado === emailNormalizado ||
        emailsCoinciden(preCliente.email, emailNormalizado))
    ) {
      return {
        id: preClienteDoc.id,
        ...preCliente,
      };
    }
  }

  return null;
};

const resolverRolDesdePreClientes = async (
  email: string
): Promise<{
  role: RolRegistro | null;
  preCliente: (PreCliente & { id: string }) | null;
}> => {
  const preCliente = await buscarPreClienteExistente(email);

  if (!preCliente) {
    return {
      role: null,
      preCliente: null,
    };
  }

  if (preCliente.estado === "aprobado") {
    return {
      role: "pre-cliente",
      preCliente,
    };
  }

  if (preCliente.estado === "convertido") {
    return {
      role: "cliente",
      preCliente,
    };
  }

  return {
    role: null,
    preCliente,
  };
};

const buscarClientePermitido = async (
  email: string
): Promise<(Cliente & { id: string }) | null> => {
  const emailNormalizado = normalizarEmail(email);
  const snapshot = await getDocs(collection(db, "clientes"));

  for (const clienteDoc of snapshot.docs) {
    const cliente = clienteDoc.data() as Cliente;
    if (
      cliente.emailNormalizado === emailNormalizado ||
      emailsCoinciden(cliente.email, emailNormalizado)
    ) {
      return {
        id: clienteDoc.id,
        ...cliente,
      };
    }
  }

  return null;
};

const buscarPreClienteExistente = async (
  email: string
): Promise<(PreCliente & { id: string }) | null> => {
  const emailNormalizado = normalizarEmail(email);
  const snapshot = await getDocs(collection(db, "pre-clientes"));

  for (const preClienteDoc of snapshot.docs) {
    const preCliente = preClienteDoc.data() as PreCliente;
    if (
      preCliente.emailNormalizado === emailNormalizado ||
      emailsCoinciden(preCliente.email, emailNormalizado)
    ) {
      return {
        id: preClienteDoc.id,
        ...preCliente,
      };
    }
  }

  return null;
};

// ==================== AUTENTICACIÓN ====================

export const registrarUsuario = async (
  email: string,
  password: string,
  nombre: string,
  apellido: string,
  role?: RolRegistro
): Promise<Usuario> => {
  const emailNormalizado = normalizarEmail(email);
  const invitacion = await resolverRolDesdePreClientes(emailNormalizado);
  const roleResuelto = invitacion.role || role;

  if (!roleResuelto) {
    throw new Error("Este email no está autorizado para registrarse");
  }

  // Primero verificar si el email está en la lista de permitidos
  const permitido = await verificarEmailPermitido(emailNormalizado, roleResuelto);
  if (!permitido) {
    throw new Error("Este email no está autorizado para registrarse");
  }

  // Crear usuario en Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    emailNormalizado,
    password
  );
  const { uid } = userCredential.user;

  // Crear documento del usuario en Firestore
  const usuario: Usuario = {
    uid,
    email: emailNormalizado,
    emailNormalizado,
    nombre,
    apellido,
    role: roleResuelto,
    estado: "activo",
    fechaRegistro: new Date(),
    fechaActualizacion: new Date(),
  };

  await setDoc(doc(db, "usuarios", uid), usuario);

  if (invitacion.preCliente) {
    await updateDoc(doc(db, "pre-clientes", invitacion.preCliente.id), {
      estado:
        roleResuelto === "cliente"
          ? "convertido"
          : invitacion.preCliente.estado,
      fechaRegistro: new Date(),
      uid,
      email: emailNormalizado,
      emailNormalizado,
    });
  }

  if (roleResuelto === "cliente") {
    const clienteRef = doc(db, "clientes", uid);
    const clienteDoc = await getDoc(clienteRef);

    if (!clienteDoc.exists()) {
      await setDoc(clienteRef, {
        fechaRegistro: new Date(),
        uid,
        email: emailNormalizado,
        emailNormalizado,
        nombre,
        apellido,
        empresa:
          invitacion.preCliente?.empresa?.trim() || `${nombre} ${apellido}`,
        telefono: invitacion.preCliente?.telefono || "",
        plan: "basico",
        tiendas: [],
        estado: "activo",
      } satisfies Cliente);
    }
  }

  return usuario;
};

export const iniciarSesion = async (
  email: string,
  password: string
): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    normalizarEmail(email),
    password
  );
  return userCredential.user;
};

export const cerrarSesion = async () => {
  await signOut(auth);
};

// ==================== VALIDACIÓN ====================

export const verificarEmailPermitido = async (
  email: string,
  role: RolRegistro
): Promise<boolean> => {
  try {
    const emailNormalizado = normalizarEmail(email);
    const invitacion = await resolverRolDesdePreClientes(emailNormalizado);

    if (role === "pre-cliente") {
      console.log(
        "Verificación pre-cliente:",
        emailNormalizado,
        "Encontrado:",
        invitacion.role === "pre-cliente"
      );
      return invitacion.role === "pre-cliente";
    }

    if (role === "cliente") {
      if (invitacion.role === "cliente") {
        console.log(
          "Verificación cliente:",
          emailNormalizado,
          "Encontrado por pre-cliente convertido:",
          true
        );
        return true;
      }

      const cliente = await buscarClientePermitido(emailNormalizado);
      console.log(
        "Verificación cliente:",
        emailNormalizado,
        "Encontrado:",
        !!cliente
      );
      return !!cliente;
    }

    return false;
  } catch (error) {
    console.error("Error verificando email permitido:", error);
    throw error;
  }
};

export const obtenerUsuario = async (uid: string): Promise<Usuario | null> => {
  const userDoc = await getDoc(doc(db, "usuarios", uid));
  return userDoc.exists() ? (userDoc.data() as Usuario) : null;
};

export const obtenerUserRole = async (uid: string): Promise<string | null> => {
  const usuario = await obtenerUsuario(uid);
  return usuario?.role || null;
};

// ==================== PRE-CLIENTES ====================

export const crearPreCliente = async (preCliente: Omit<PreCliente, "fechaInvitacion">) => {
  const emailNormalizado = normalizarEmail(preCliente.email);
  const preClienteConFecha: PreCliente = {
    ...preCliente,
    emailNormalizado,
    fechaInvitacion: new Date(),
  };
  const preClienteExistente = await buscarPreClienteExistente(emailNormalizado);

  if (preClienteExistente) {
    await updateDoc(doc(db, "pre-clientes", preClienteExistente.id), {
      ...preClienteConFecha,
    });
    return preClienteExistente.id;
  }

  const docRef = doc(collection(db, "pre-clientes"));
  await setDoc(docRef, preClienteConFecha);
  return docRef.id;
};

export const resolverRolRegistro = async (
  email: string
): Promise<RolRegistro | null> => {
  const emailNormalizado = normalizarEmail(email);
  const invitacion = await resolverRolDesdePreClientes(emailNormalizado);

  if (invitacion.role) {
    return invitacion.role;
  }

  const cliente = await buscarClientePermitido(emailNormalizado);
  return cliente ? "cliente" : null;
};

export const obtenerPreCientes = async () => {
  const snapshot = await getDocs(collection(db, "pre-clientes"));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as PreCliente & { id: string }));
};

export const actualizarPreCliente = async (
  id: string,
  data: Partial<PreCliente>
) => {
  await updateDoc(doc(db, "pre-clientes", id), data);
};

// ==================== CLIENTES ====================

export const crearCliente = async (cliente: Omit<Cliente, "tiendas">) => {
  await setDoc(doc(db, "clientes", cliente.uid), {
    ...cliente,
    tiendas: [],
  });
};

export const obtenerCliente = async (uid: string): Promise<Cliente | null> => {
  const clienteDoc = await getDoc(doc(db, "clientes", uid));
  return clienteDoc.exists() ? (clienteDoc.data() as Cliente) : null;
};

export const obtenerClientes = async () => {
  const snapshot = await getDocs(collection(db, "clientes"));
  return snapshot.docs.map((doc) => doc.data() as Cliente);
};

// ==================== TIENDAS ====================

// Función para limpiar tiendas duplicadas (solo para admin o emergencia)
export const limpiarTiendasDuplicadas = async (ownerId: string): Promise<number> => {
  const tiendasExistentes = await obtenerTiendasUsuario(ownerId);
  
  if (tiendasExistentes.length <= 1) {
    return 0; // No hay duplicados
  }
  
  // Mantener solo la tienda más reciente
  const tiendasOrdenadas = tiendasExistentes.sort((a, b) => 
    new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
  );
  
  const tiendaAMantener = tiendasOrdenadas[0];
  const tiendasAEliminar = tiendasOrdenadas.slice(1);
  
  console.log(`Eliminando ${tiendasAEliminar.length} tiendas duplicadas para usuario ${ownerId}`);
  
  let eliminadas = 0;
  for (const tienda of tiendasAEliminar) {
    try {
      await eliminarTienda(tienda.id, ownerId);
      eliminadas++;
    } catch (error) {
      console.error(`Error al eliminar tienda duplicada ${tienda.id}:`, error);
    }
  }
  
  return eliminadas;
};

export const crearTienda = async (
  ownerId: string,
  nombre: string,
  descripcion: string,
  plan: "demo" | "basico" | "profesional" | "empresarial",
  limites: TiendaLimites
): Promise<string> => {
  // VALIDACIÓN ULTRA ESTRICTA: Múltiples capas de seguridad
  const tiendasExistentes = await obtenerTiendasUsuario(ownerId);
  console.log("🔍 VALIDACIÓN ULTRA ESTRICTA - Tiendas existentes para usuario", ownerId, ":", tiendasExistentes.length);
  
  // Primera capa: Verificación básica
  if (tiendasExistentes && tiendasExistentes.length > 0) {
    console.log("❌ BLOQUEADO: Usuario ya tiene", tiendasExistentes.length, "tiendas");
    throw new Error("❌ BLOQUEADO: Ya tienes una tienda creada. Solo puedes tener UNA SOLA TIENDA. Elimina tu tienda actual para crear una nueva.");
  }
  
  // Segunda capa: Verificación adicional por si acaso
  const segundaVerificacion = await obtenerTiendasUsuario(ownerId);
  if (segundaVerificacion && segundaVerificacion.length > 0) {
    console.log("❌ BLOQUEADO EN SEGUNDA VERIFICACIÓN");
    throw new Error("❌ BLOQUEADO: Sistema detectó tienda existente. Solo puedes tener UNA SOLA TIENDA.");
  }
  
  console.log("✅ VALIDACIÓN PASADA: Usuario puede crear tienda");

  const tiendaRef = doc(collection(db, "tiendas"));
  const tienda: Tienda = {
    id: tiendaRef.id,
    ownerId,
    nombre,
    descripcion,
    estado: "activa",
    plan,
    limites,
    productos: 0,
    fechaCreacion: new Date(),
    fechaActualizacion: new Date(),
  };

  await setDoc(tiendaRef, tienda);

  // Agregar tienda al usuario
  const usuarioRef = doc(db, "usuarios", ownerId);
  const usuarioDoc = await getDoc(usuarioRef);
  if (usuarioDoc.exists()) {
    const usuario = usuarioDoc.data() as Usuario;
    if (usuario.role === "cliente") {
      const clienteRef = doc(db, "clientes", ownerId);
      const clienteDoc = await getDoc(clienteRef);
      if (clienteDoc.exists()) {
        const cliente = clienteDoc.data() as Cliente;
        await updateDoc(clienteRef, {
          tiendas: [...(cliente.tiendas || []), tiendaRef.id],
        });
      }
    }
  }

  return tiendaRef.id;
};

export const obtenerTienda = async (tiendaId: string): Promise<Tienda | null> => {
  const tiendaDoc = await getDoc(doc(db, "tiendas", tiendaId));
  return tiendaDoc.exists() ? (tiendaDoc.data() as Tienda) : null;
};

export const obtenerTiendasUsuario = async (ownerId: string): Promise<Tienda[]> => {
  const tiendaRef = query(
    collection(db, "tiendas"),
    where("ownerId", "==", ownerId)
  );
  const snapshot = await getDocs(tiendaRef);
  return snapshot.docs.map((doc) => doc.data() as Tienda);
};

export const actualizarTienda = async (
  tiendaId: string,
  data: Partial<Tienda>
) => {
  await updateDoc(doc(db, "tiendas", tiendaId), {
    ...data,
    fechaActualizacion: new Date(),
  });
};

export const eliminarTienda = async (tiendaId: string, ownerId: string): Promise<void> => {
  // Eliminar la tienda
  await deleteDoc(doc(db, "tiendas", tiendaId));

  // Remover tienda del usuario
  const usuarioRef = doc(db, "usuarios", ownerId);
  const usuarioDoc = await getDoc(usuarioRef);
  if (usuarioDoc.exists()) {
    const usuario = usuarioDoc.data() as Usuario;
    if (usuario.role === "cliente") {
      const clienteRef = doc(db, "clientes", ownerId);
      const clienteDoc = await getDoc(clienteRef);
      if (clienteDoc.exists()) {
        const cliente = clienteDoc.data() as Cliente;
        await updateDoc(clienteRef, {
          tiendas: (cliente.tiendas || []).filter((id: string) => id !== tiendaId),
        });
      }
    }
  }
};

// ==================== LÍMITES PRE-CLIENTES ====================

export const obtenerLimitesPreCliente = (): TiendaLimites => {
  return {
    maxProductos: 10,
    maxImagenes: 20,
    maxCategorias: 3,
    maxOrdenes: 50,
    tieneCheckout: false,
    tieneEmail: false,
    tieneAnalytics: false,
  };
};

export const obtenerLimitesCliente = (plan: string): TiendaLimites => {
  const limites: Record<string, TiendaLimites> = {
    basico: {
      maxProductos: 50,
      maxImagenes: 100,
      maxCategorias: 10,
      maxOrdenes: 500,
      tieneCheckout: true,
      tieneEmail: true,
      tieneAnalytics: false,
    },
    profesional: {
      maxProductos: 500,
      maxImagenes: 1000,
      maxCategorias: 50,
      maxOrdenes: 5000,
      tieneCheckout: true,
      tieneEmail: true,
      tieneAnalytics: true,
    },
    empresarial: {
      maxProductos: -1, // Sin límite
      maxImagenes: -1,
      maxCategorias: -1,
      maxOrdenes: -1,
      tieneCheckout: true,
      tieneEmail: true,
      tieneAnalytics: true,
    },
  };

  return limites[plan] || limites.basico;
};

// ==================== CAMBIAR ROLES ====================

export const cambiarRolUsuario = async (
  uid: string,
  nuevoRol: "admin" | "cliente" | "pre-cliente"
): Promise<void> => {
  await updateDoc(doc(db, "usuarios", uid), {
    role: nuevoRol,
    fechaActualizacion: new Date(),
  });
};

// ==================== PRODUCTOS Y CATEGORÍAS ====================

export const obtenerProductosUsuario = async (userId: string) => {
  try {
    // Buscar productos directamente por usuarioId
    const productosRef = query(
      collection(db, "productos"),
      where("usuarioId", "==", userId)
    );
    const snapshot = await getDocs(productosRef);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error obtener productos usuario:", error);
    return [];
  }
};

// Obtener productos de un usuario por categoría (usando el campo real de Firestore)
export const obtenerProductosUsuarioPorCategoria = async (userId: string, categoria: string, excludeId = null, opts = {}) => {
  try {
    const q = query(
      collection(db, "productos"), 
      where("usuarioId", "==", userId),
      where("categoria", "==", categoria)
    );
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
  } catch (error) {
    console.error("Error obtener productos usuario por categoría:", error);
    return [];
  }
};

// Obtener productos de un usuario por subcategoría
export const obtenerProductosUsuarioPorSubcategoria = async (userId: string, subcategoria: string, categoria: string = null, excludeId = null, opts = {}) => {
  try {
    let q;
    if (categoria) {
      // Si se proporciona categoría, filtrar por ambos campos
      q = query(
        collection(db, "productos"), 
        where("usuarioId", "==", userId),
        where("subcategoria", "==", subcategoria),
        where("categoria", "==", categoria)
      );
    } else {
      // Si no, solo filtrar por subcategoría
      q = query(
        collection(db, "productos"), 
        where("usuarioId", "==", userId),
        where("subcategoria", "==", subcategoria)
      );
    }
    
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
  } catch (error) {
    console.error("Error obtener productos usuario por subcategoría:", error);
    return [];
  }
};

// Obtener productos de un usuario por subsubcategoría
export const obtenerProductosUsuarioPorSubsubcategoria = async (userId: string, subsubcategoria: string, subcategoria: string = null, categoria: string = null, excludeId = null, opts = {}) => {
  try {
    let q;
    if (categoria && subcategoria) {
      // Si se proporcionan todos los niveles, filtrar por todos
      q = query(
        collection(db, "productos"), 
        where("usuarioId", "==", userId),
        where("subsubcategoria", "==", subsubcategoria),
        where("subcategoria", "==", subcategoria),
        where("categoria", "==", categoria)
      );
    } else if (subcategoria) {
      // Si solo se proporciona subcategoría
      q = query(
        collection(db, "productos"), 
        where("usuarioId", "==", userId),
        where("subsubcategoria", "==", subsubcategoria),
        where("subcategoria", "==", subcategoria)
      );
    } else {
      // Si solo se proporciona subsubcategoría
      q = query(
        collection(db, "productos"), 
        where("usuarioId", "==", userId),
        where("subsubcategoria", "==", subsubcategoria)
      );
    }
    
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
  } catch (error) {
    console.error("Error obtener productos usuario por subsubcategoría:", error);
    return [];
  }
};

export const obtenerCategoriasUsuario = async () => {
  try {
    const snapshot = await getDocs(collection(db, "categorias"));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error obtener categorías:", error);
    return [];
  }
};

export const obtenerLogo = async (userId: string): Promise<string | null> => {
  try {
    console.log('obtenerLogo - Buscando logo para usuario:', userId);
    
    // Obtener el logoUrl desde Firestore (donde se guarda con actualizarLogo)
    const userDoc = await getDoc(doc(db, "usuarios", userId));
    console.log('obtenerLogo - Documento existe:', userDoc.exists());
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('obtenerLogo - Datos usuario:', userData);
      const logoUrl = userData.logoUrl || null;
      console.log('obtenerLogo - LogoUrl encontrado:', logoUrl);
      return logoUrl;
    } else {
      console.log('obtenerLogo - Documento de usuario no encontrado');
      return null;
    }
  } catch (error) {
    console.error('obtenerLogo - Error:', error);
    return null;
  }
};

// ==================== REDES SOCIALES ====================

export interface RedesSociales {
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
}

export interface Ubicacion {
  nombre?: string;
  mapsLink?: string;
}

export const obtenerRedesSociales = async (userId: string): Promise<RedesSociales> => {
  try {
    const userDoc = await getDoc(doc(db, "usuarios", userId));
    return userDoc.data()?.redesSociales || {};
  } catch (error) {
    console.error("Error obtener redes sociales:", error);
    return {};
  }
};

export const actualizarRedesSociales = async (userId: string, redes: RedesSociales): Promise<void> => {
  try {
    await updateDoc(doc(db, "usuarios", userId), {
      redesSociales: redes,
    });
  } catch (error) {
    console.error("Error actualizar redes sociales:", error);
  }
};

export const obtenerUbicacion = async (userId: string): Promise<Ubicacion> => {
  try {
    const userDoc = await getDoc(doc(db, "usuarios", userId));
    return userDoc.data()?.ubicacion || {};
  } catch (error) {
    console.error("Error obtener ubicación:", error);
    return {};
  }
};

export const actualizarUbicacion = async (userId: string, ubicacion: Ubicacion): Promise<void> => {
  try {
    await updateDoc(doc(db, "usuarios", userId), {
      ubicacion: ubicacion,
    });
  } catch (error) {
    console.error("Error actualizar ubicación:", error);
  }
};

export const actualizarLogo = async (userId: string, logoUrl: string): Promise<void> => {
  try {
    console.log('actualizarLogo - Iniciando actualización:', { userId, logoUrl });
    
    // Verificar que el documento existe antes de actualizar
    const userDoc = await getDoc(doc(db, "usuarios", userId));
    console.log('actualizarLogo - Documento usuario existe:', userDoc.exists());
    
    if (userDoc.exists()) {
      console.log('actualizarLogo - Datos actuales:', userDoc.data());
      
      await updateDoc(doc(db, "usuarios", userId), {
        logoUrl: logoUrl,
      });
      
      console.log('actualizarLogo - Actualización exitosa');
      
      // Verificar que se guardó correctamente
      const updatedDoc = await getDoc(doc(db, "usuarios", userId));
      console.log('actualizarLogo - Datos después de actualizar:', updatedDoc.data());
      
    } else {
      console.error('actualizarLogo - Documento de usuario no encontrado');
    }
  } catch (error) {
    console.error("actualizarLogo - Error detallado:", error);
    throw error;
  }
};

// ==================== SETUP INICIAL ====================

export const verificarSiHayAdmin = async (): Promise<boolean> => {
  try {
    const adminQuery = query(
      collection(db, "usuarios"),
      where("role", "==", "admin")
    );
    const snapshot = await getDocs(adminQuery);
    return !snapshot.empty;
  } catch (error) {
    console.error("Error verificar admin:", error);
    return false;
  }
};

export const crearPrimerAdmin = async (
  email: string,
  password: string,
  nombre: string,
  apellido: string
): Promise<Usuario> => {
  // Verificar que solo hectorcobea03@gmail.com puede ser admin
  if (email !== "hectorcobea03@gmail.com") {
    throw new Error("Solo hectorcobea03@gmail.com puede ser el primer admin");
  }

  // Verificar que no haya otro admin
  const hayAdmin = await verificarSiHayAdmin();
  if (hayAdmin) {
    throw new Error("Ya existe un administrador en el sistema");
  }

  // Crear usuario en Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const { uid } = userCredential.user;

  // Crear documento del usuario en Firestore con rol admin
  const usuario: Usuario = {
    uid,
    email,
    nombre,
    apellido,
    role: "admin",
    estado: "activo",
    fechaRegistro: new Date(),
    fechaActualizacion: new Date(),
  };

  await setDoc(doc(db, "usuarios", uid), usuario);

  return usuario;
};
