# Configuración de Firebase

## Pasos para configurar Firebase en tu proyecto

### 1. Crear un proyecto en Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Haz clic en "Crear proyecto"
3. Sigue los pasos para crear un nuevo proyecto
4. Una vez creado, ve a "Configuración del proyecto"

### 2. Agregar una aplicación web
1. En Configuración del proyecto, haz clic en el icono de web (</>) para agregar una aplicación web
2. Dale un nombre a tu aplicación (ej: "Nexel Web")
3. Copia la configuración que aparece

### 3. Configurar las variables de entorno
1. Abre el archivo `.env.local` en la raíz del proyecto
2. Copia los valores de `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId` de la configuración de Firebase
3. Pega los valores correspondientes en `.env.local`

### 4. Habilitar autenticación por email/contraseña
1. En Firebase Console, ve a Authentication (Autenticación)
2. Haz clic en "Sign-in method" (Método de inicio de sesión)
3. Habilita "Email/Password" (Correo electrónico/Contraseña)

### 5. Crear la base de datos Firestore
1. Ve a Firestore Database en Firebase Console
2. Haz clic en "Crear base de datos"
3. Selecciona "Comenzar en modo de prueba" (para desarrollo)
4. Selecciona la región más cercana

### 6. Configurar las reglas de Firestore
En Firestore, ve a la pestaña "Reglas" y reemplaza el contenido con:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios (solo el propietario puede leer/escribir)
    match /usuarios/{uid} {
      allow read, write: if request.auth.uid == uid;
    }

    // Pre-clientes (solo admin puede leer/escribir)
    match /pre-clientes/{document=**} {
      allow read, write: if request.auth.uid in get(/databases/$(database)/documents/usuarios/admin).data.admins;
    }

    // Clientes (solo admin puede leer/escribir)
    match /clientes/{uid} {
      allow read: if request.auth.uid == uid;
      allow write: if request.auth.uid in get(/databases/$(database)/documents/usuarios/admin).data.admins;
    }

    // Tiendas (propietario o admin)
    match /tiendas/{tiendaId} {
      allow read, write: if request.auth.uid == resource.data.ownerId;
    }

    // Productos (propietario de la tienda)
    match /tiendas/{tiendaId}/productos/{document=**} {
      allow read, write: if request.auth.uid == get(/databases/$(database)/documents/tiendas/$(tiendaId)).data.ownerId;
    }
  }
}
```

## Estructura de Firestore

La base de datos tendrá las siguientes colecciones:

### /usuarios/{uid}
Información general del usuario (admin, cliente, pre-cliente)

### /pre-clientes/{id}
Lista de pre-clientes autorizados para probar la plataforma

### /clientes/{uid}
Información de clientes activos

### /tiendas/{tiendaId}
Información de cada tienda (nombre, límites, plan, etc.)

### /tiendas/{tiendaId}/productos/{productoId}
Productos de cada tienda

## Próximos pasos
1. Completa la configuración de Firebase
2. Ejecuta `npm run dev` para iniciar el servidor
3. Navega a `/registro` para crear tu primera cuenta
