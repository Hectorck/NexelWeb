# 🔐 Reglas de Firebase - Firestore y Storage

## 📋 Resumen de Reglas

### **Firestore (`firestore.rules`)**
```
✅ Usuarios: Solo leen/escriben sus propios datos (admin puede todo)
✅ Pre-clientes: Admin gestiona invitaciones
✅ Clientes: Ven sus propios datos
✅ Tiendas: Propietario y admin pueden acceder
✅ Productos: Propietario de tienda puede escribir
✅ Categorías: Todos leen, admin escribe
✅ Órdenes: Propietario, cliente y admin pueden acceder
✅ Carrito: Cada usuario solo su carrito
```

### **Storage (`storage.rules`)**
```
✅ Logos: Solo propietario y admin (2MB max)
✅ Imágenes productos: Propietario tienda y admin
✅ Imágenes tienda: Propietario y admin
✅ Avatares: Propietario y admin
✅ Documentos: Propietario y admin
```

---

## 🚀 Cómo Desplegar las Reglas

### **Opción 1: Firebase Console (Recomendado para principiantes)**

#### **Para Firestore:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Entra en **Firestore Database**
4. Ve a la pestaña **Rules**
5. Copia todo el contenido de `firestore.rules`
6. Pega en el editor
7. Haz clic en **Publish**

#### **Para Storage:**
1. En Firebase Console, ve a **Storage**
2. Entra en la pestaña **Rules**
3. Copia todo el contenido de `storage.rules`
4. Pega en el editor
5. Haz clic en **Publish**

---

### **Opción 2: Firebase CLI (Recomendado para producción)**

#### **Paso 1: Instala Firebase CLI**
```bash
npm install -g firebase-tools
```

#### **Paso 2: Inicia sesión**
```bash
firebase login
```

#### **Paso 3: Inicializa Firebase en tu proyecto**
```bash
firebase init
```
- Selecciona: Firestore, Storage
- Selecciona tu proyecto
- Los archivos `firestore.rules` y `storage.rules` ya existen en la raíz

#### **Paso 4: Despliega las reglas**
```bash
firebase deploy --only firestore:rules,storage
```

O despliega solo uno:
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

---

## 🔒 Seguridad - Explicación de Reglas

### **Firestore**

#### **Usuarios**
```javascript
match /usuarios/{uid} {
  allow read: if request.auth.uid == uid ||  // Solo su documento
                 isAdmin();                    // O si es admin
  allow write: if request.auth.uid == uid ||  // Solo puede escribir su doc
                  isAdmin();                   // O si es admin
}
```

#### **Pre-clientes** (Solo admin gestiona)
```javascript
match /pre-clientes/{docId} {
  allow read: if isAdmin();    // Solo admin lee
  allow write: if isAdmin();   // Solo admin escribe
}
```

#### **Tiendas** (Propietario o admin)
```javascript
match /tiendas/{tiendaId} {
  allow read: if request.auth.uid == resource.data.ownerId ||  // Propietario
                 isAdmin();                                      // O admin
}
```

#### **Productos** (Cualquiera lee, propietario escribe)
```javascript
match /productos/{productoId} {
  allow read: if request.auth != null;  // Cualquiera autenticado
  allow write: if request.auth.uid == resource.data.ownerId ||
                  isAdmin();
}
```

---

### **Storage**

#### **Logos**
```javascript
match /logos/{userId}/{allPaths=**} {
  allow read: if request.auth != null;           // Cualquiera autenticado
  allow write: if request.auth.uid == userId ||  // Solo el propietario
                  isAdmin();                      // O admin
}
```

#### **Productos**
```javascript
match /productos/{tiendaId}/{allPaths=**} {
  allow read: if request.auth != null;           // Cualquiera autenticado
  allow write: if request.auth.uid == tiendaId; // Solo propietario tienda
}
```

---

## 📊 Tabla de Permisos

| Recurso | Usuario Público | Pre-cliente | Cliente | Admin |
|---------|-----------------|-------------|---------|-------|
| Leer usuario | ❌ | ✅ (suyo) | ✅ (suyo) | ✅ |
| Editar usuario | ❌ | ✅ (suyo) | ✅ (suyo) | ✅ |
| Ver pre-clientes | ❌ | ❌ | ❌ | ✅ |
| Ver clientes | ❌ | ❌ | ✅ (suyo) | ✅ |
| Leer productos | ❌ | ✅ | ✅ | ✅ |
| Crear productos | ❌ | ❌ | ✅ (su tienda) | ✅ |
| Leer órdenes | ❌ | ❌ | ✅ (suyas) | ✅ |
| Leer categorías | ❌ | ✅ | ✅ | ✅ |
| Crear categorías | ❌ | ❌ | ❌ | ✅ |
| Subir logos | ❌ | ❌ | ✅ (suyo) | ✅ |
| Subir productos | ❌ | ❌ | ✅ (su tienda) | ✅ |

---

## ⚠️ Notas Importantes

1. **Las reglas son restrictivas por defecto**: Si no están explícitamente permitidas, se deniegan
2. **Admin tiene acceso total**: El rol "admin" puede leer y escribir en casi todo
3. **UID debe coincidir**: Las referencias a `{uid}` deben ser IDs de usuarios de Firebase Auth
4. **Verificación de roles**: Usa `request.auth.uid` para verificar identidad
5. **Funciones auxiliares**: `isAdmin()` verifica el campo `role` en Firestore

---

## 🧪 Cómo Probar las Reglas

### **En Firebase Console:**
1. Ve a **Firestore Rules**
2. Haz clic en **Rules Playground**
3. Selecciona:
   - **Collection**: usuarios
   - **Document**: {uid del usuario}
   - **Request type**: get, list, create, update, delete
4. Haz clic en **Run**
5. Verá si está permitido ✅ o denegado ❌

---

## 🔄 Actualizar Reglas Después

Si necesitas cambiar las reglas:
1. Edita `firestore.rules` o `storage.rules`
2. En consola: Copia y pega las nuevas reglas
3. O con CLI: `firebase deploy --only firestore:rules,storage`

---

## 📞 Soporte

Si tienes dudas sobre las reglas:
- **Documentación oficial**: https://firebase.google.com/docs/firestore/security/get-started
- **Analizador de reglas**: https://firebase.google.com/docs/firestore/security/rules-structure
