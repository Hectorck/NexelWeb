// Tipos de usuario
export type UserRole = "admin" | "cliente" | "pre-cliente";
export type StoreStatus = "activa" | "pausada" | "eliminada";

export interface Usuario {
  uid: string;
  email: string;
  emailNormalizado?: string;
  nombre: string;
  apellido: string;
  role: UserRole;
  estado: "activo" | "inactivo";
  fechaRegistro: Date;
  fechaActualizacion: Date;
  telefono?: string;
  empresa?: string;
  avatar?: string;
}

export interface PreCliente {
  uid: string;
  email: string;
  emailNormalizado?: string;
  nombre: string;
  apellido: string;
  empresa?: string;
  telefono?: string;
  estado: "pendiente" | "aprobado" | "rechazado" | "convertido";
  fechaInvitacion: Date;
  fechaRegistro?: Date;
  notas?: string;
  tiendaId?: string; // Se asigna después de registrarse
}

export interface Cliente {
  uid: string;
  email: string;
  emailNormalizado?: string;
  nombre: string;
  apellido: string;
  empresa: string;
  telefono: string;
  plan: "basico" | "profesional" | "empresarial";
  tiendas: string[]; // Array de tiendaIds
  estado: "activo" | "inactivo" | "suspendido";
  fechaRegistro: Date;
  fechaPago?: Date;
  avatar?: string;
  sitioWeb?: string;
}

export interface Tienda {
  id: string;
  ownerId: string; // uid del usuario
  nombre: string;
  descripcion: string;
  logo?: string;
  dominio?: string; // ej: mitienda.nexel.com
  estado: StoreStatus;
  plan: "demo" | "basico" | "profesional" | "empresarial";
  limites: TiendaLimites;
  productos: number; // cantidad actual
  fechaCreacion: Date;
  fechaActualizacion: Date;
  tema?: {
    colorPrimario: string;
    colorSecundario: string;
  };
  redesSociales?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    whatsapp?: string;
    email?: string;
    website?: string;
  };
}

export interface TiendaLimites {
  maxProductos: number;
  maxImagenes: number;
  maxCategorias: number;
  maxOrdenes: number;
  tieneCheckout: boolean;
  tieneEmail: boolean;
  tieneAnalytics: boolean;
}

export interface Producto {
  id: string;
  tiendaId: string;
  nombre: string;
  descripcion: string;
  precio: number;
  costo?: number;
  stock: number;
  imagenes: string[];
  categoria: string;
  marca?: string;
  sku?: string;
  estado: "activo" | "inactivo";
  fechaCreacion: Date;
}

export interface Categoria {
  id: string;
  tiendaId: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  orden: number;
}

export interface Orden {
  id: string;
  tiendaId: string;
  clienteEmail: string;
  items: OrdenItem[];
  total: number;
  estado: "pendiente" | "confirmada" | "enviada" | "entregada" | "cancelada";
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface OrdenItem {
  productoId: string;
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}
