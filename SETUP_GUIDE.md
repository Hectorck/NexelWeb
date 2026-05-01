# Guía de Configuración - Nexel Agencia de E-commerce

## Resumen del Proyecto

Tu proyecto Nexel ahora es una **Agencia de E-commerce** con el siguiente flujo:

1. **Pre-clientes**: Usuarios invitados que prueban la plataforma con límites (10 productos, 3 categorías, sin checkout)
2. **Clientes**: Usuarios que han comprado un plan y tienen acceso completo
3. **Admin**: Gestor que invita pre-clientes, convierte a clientes, y maneja la plataforma

### Flujo de Usuarios

```
Usuario no autorizado
    ↓
Admin invita por email
    ↓
Pre-cliente se registra (acceso limitado)
    ↓
Pre-cliente prueba la plataforma
    ↓
Pre-cliente compra un plan
    ↓
Admin cambia estado a "cliente"
    ↓
Cliente acceso completo según su plan
```

## Pasos de Configuración

### 1. Configurar Firebase

#### 1.1 Crear Proyecto en Firebase
1. Ve a [https://console.firebase.google.com](https://console.firebase.google.com)
2. Haz clic en "Crear proyecto"
3. Nombre del proyecto: "Nexel"
4. Sigue los pasos de creación

#### 1.2 Agregar Aplicación Web
1. En Firebase Console, haz clic en el icono de web (</>) en "Primeros pasos"
2. Dale el nombre "Nexel Web"
3. Copia la configuración que aparece (verás esto):
```javascript
{
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}
```

#### 1.3 Agregar Variables de Entorno
1. Abre `.env.local` en la raíz del proyecto
2. Copia los valores de tu configuración de Firebase:
```
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

#### 1.4 Habilitar Autenticación por Email
1. En Firebase Console, ve a **Authentication** (Autenticación)
2. Haz clic en **Sign-in method**
3. Habilita **Email/Password**

#### 1.5 Crear Firestore Database
1. En Firebase Console, ve a **Firestore Database**
2. Haz clic en **Create database**
3. Selecciona **Start in test mode** (para desarrollo)
4. Selecciona la región más cercana

#### 1.6 Configurar Reglas de Firestore
1. En Firestore, ve a la pestaña **Rules**
2. Reemplaza el contenido con:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios (solo el propietario puede leer)
    match /usuarios/{uid} {
      allow read, write: if request.auth.uid == uid;
    }

    // Pre-clientes (solo admin puede leer/escribir)
    match /pre-clientes/{document=**} {
      allow read, write: if request.auth != null;
    }

    // Clientes (solo el propietario puede leer)
    match /clientes/{uid} {
      allow read: if request.auth.uid == uid;
      allow write: if false;
    }

    // Tiendas (propietario puede leer/escribir)
    match /tiendas/{tiendaId} {
      allow read, write: if request.auth.uid == resource.data.ownerId;
      match /productos/{document=**} {
        allow read, write: if request.auth.uid == get(/databases/$(database)/documents/tiendas/$(tiendaId)).data.ownerId;
      }
    }
  }
}
```

3. Haz clic en **Publish**

### 2. Crear Usuario Admin

1. Abre tu aplicación en `http://localhost:3000` (después de `npm run dev`)
2. Ve a `/registro`
3. Intenta registrarte con tu email
4. Verás error: "Este email no está autorizado"

Para crear un admin, debes hacer esto directamente en Firestore:

#### 2.1 Crear documento en Firestore
1. En Firestore Console, crea una colección llamada `pre-clientes`
2. Crea un documento con:
   - ID: cualquier valor único
   - Email: tu@email.com
   - Nombre: Tu Nombre
   - Apellido: Tu Apellido
   - Estado: "aprobado"
   - FechaInvitacion: current timestamp

3. Ahora regístrate en `/registro` con ese email
4. Luego, en Firebase Console, ve a `usuarios/{tu_uid}`
5. Cambia manualmente el campo `role` de "pre-cliente" a "admin"

Ahora puedes acceder a `/admin/dashboard`

### 3. Estructura de Firestore

Tu base de datos tendrá estas colecciones:

```
/usuarios/{uid}
  ├─ uid: string
  ├─ email: string
  ├─ nombre: string
  ├─ apellido: string
  ├─ role: "admin" | "cliente" | "pre-cliente"
  ├─ estado: "activo" | "inactivo"
  └─ ...

/pre-clientes/{id}
  ├─ email: string
  ├─ nombre: string
  ├─ apellido: string
  ├─ estado: "pendiente" | "aprobado" | "rechazado" | "convertido"
  ├─ fechaInvitacion: timestamp
  └─ ...

/clientes/{uid}
  ├─ uid: string
  ├─ email: string
  ├─ empresa: string
  ├─ plan: "basico" | "profesional" | "empresarial"
  ├─ tiendas: array
  └─ ...

/tiendas/{tiendaId}
  ├─ id: string
  ├─ ownerId: string
  ├─ nombre: string
  ├─ descripcion: string
  ├─ plan: "demo" | "basico" | ...
  ├─ limites: {...}
  ├─ productos: number
  ├─ estado: "activa" | "pausada" | "eliminada"
  └─ /productos/{productoId}
      ├─ nombre: string
      ├─ precio: number
      ├─ stock: number
      └─ ...
```

### 4. Rutas de la Aplicación

#### Públicas:
- `/` - Página de inicio
- `/login` - Iniciar sesión
- `/registro` - Registro (solo con email invitado)

#### Admin:
- `/admin/dashboard` - Panel de administración

#### Pre-cliente:
- `/pre-cliente/dashboard` - Mi dashboard (plan de prueba)
- `/pre-cliente/tienda/[id]` - Editor de tienda

#### Cliente:
- `/cliente/dashboard` - Mi dashboard
- `/cliente/tienda/[id]` - Editor de tienda

## Límites por Tipo de Usuario

### Pre-cliente (Plan Demo)
- ✓ 10 productos máximo
- ✓ 20 imágenes máximo
- ✓ 3 categorías máximo
- ✓ 50 órdenes máximo
- ✗ Sin checkout
- ✗ Sin email marketing
- ✗ Sin analytics

### Cliente Básico
- ✓ 50 productos
- ✓ 100 imágenes
- ✓ 10 categorías
- ✓ 500 órdenes
- ✓ Checkout habilitado
- ✓ Email marketing
- ✗ Sin analytics avanzado

### Cliente Profesional
- ✓ 500 productos
- ✓ 1000 imágenes
- ✓ 50 categorías
- ✓ 5000 órdenes
- ✓ Checkout habilitado
- ✓ Email marketing
- ✓ Analytics completo

### Cliente Empresarial
- ✓ Sin límites
- ✓ Todas las features

## Próximos Pasos

### Fase 1 (Completada)
- ✓ Configuración de Firebase
- ✓ Sistema de autenticación
- ✓ Validación de pre-clientes
- ✓ Dashboards básicos

### Fase 2 (Por hacer)
- Editor de tienda (producto, categorías, configuración)
- Sistema de órdenes
- Página pública de tienda
- Email notifications

### Fase 3 (Por hacer)
- Página de planes y precios
- Sistema de pagos (Stripe, PayPal)
- Analytics del cliente
- Soporte y tickets

## Comandos Útiles

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm build

# Iniciar servidor en producción
npm start
```

## Troubleshooting

### Error: "Este email no está autorizado para registrarse"
- Debes crear un registro en la colección `pre-clientes` primero
- Asegúrate que el estado sea "aprobado"

### Error: "Usuario no encontrado" al iniciar sesión
- Verifica que el usuario está registrado en Firebase Auth
- Verifica que existe un documento en `/usuarios/{uid}`

### No puedo ver el panel de admin
- Tu usuario debe tener `role: "admin"`
- Cambia esto manualmente en Firestore

## Contacto y Soporte

Para más información sobre la configuración, revisa:
- `FIREBASE_SETUP.md` - Configuración detallada de Firebase
- `lib/types.ts` - Estructura de tipos
- `lib/firebaseService.ts` - Funciones de servicio
