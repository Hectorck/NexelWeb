# 📋 Cómo Probar el Sistema de Registro

## 🎯 El Flujo Actual

1. **Admin invita** a un usuario como pre-cliente
2. **Usuario recibe** email en Firestore con estado "aprobado"
3. **Usuario se registra** en `/registro`
4. **Sistema verifica** que esté en la lista de invitados
5. **Usuario accede** a `/pre-cliente`

---

## ✅ Pasos para Probar

### **Paso 1: Crear un Pre-cliente Manualmente**

Opción A: Desde Firebase Console
```
1. Ve a Firebase Console → Firestore
2. Crea colección: pre-clientes
3. Crea documento con estos campos:
   - email: "test@example.com"
   - nombre: "Juan"
   - apellido: "Pérez"
   - estado: "aprobado"
   - fechaInvitacion: (fecha actual)
```

Opción B: Desde Admin Dashboard (Recomendado)
```
1. Inicia sesión en /admin/dashboard
2. Ve a pestaña "Invitar Usuario"
3. Ingresa email, nombre, apellido
4. Haz clic en "Enviar Invitación"
```

### **Paso 2: Registrarse**

```
1. Ve a http://localhost:3000/registro
2. Ingresa el email que invitaste
3. El sistema verificará que está autorizado
4. Completa el formulario
5. ¡Listo! Accedes a /pre-cliente/dashboard
```

---

## 🧪 Datos de Prueba

Si deseas crear múltiples pre-clientes rápidamente:

```javascript
// En Firestore Console, crea estos documentos en pre-clientes:

{
  "email": "usuario1@example.com",
  "nombre": "Maria",
  "apellido": "Garcia",
  "estado": "aprobado",
  "fechaInvitacion": "2024-04-30T00:00:00Z"
}

{
  "email": "usuario2@example.com",
  "nombre": "Carlos",
  "apellido": "Lopez",
  "estado": "aprobado",
  "fechaInvitacion": "2024-04-30T00:00:00Z"
}
```

---

## 🔑 Roles y Permisos

| Rol | Puede Registrarse | Necesita Invitación |
|-----|-------------------|---------------------|
| **Pre-cliente** | ✅ | ✅ Si (30 días gratis) |
| **Cliente** | ✅ | ✅ Si (planes pagados) |
| **Admin** | ✅ | ❌ No (setup especial) |

---

## 🚨 Errores Comunes

### **Error: "Este email no está autorizado"**
- ✅ Solución: Crea un registro en pre-clientes con `estado: "aprobado"`

### **Error: "Missing or insufficient permissions"**
- ✅ Solución: Usa el endpoint `/api/auth/verify-email` (ya implementado)

### **El formulario no acepta el email**
- ✅ Verifica que el email esté en Firestore exactamente igual
- ✅ Verifica que el estado sea `"aprobado"` (con minúscula)

---

## 📞 Debugging

Para ver qué está pasando:

1. Abre **DevTools** (F12)
2. Ve a **Console**
3. Intenta registrarte y revisa los logs
4. Verás si el email fue encontrado o no

```javascript
// Logs esperados:
// "Verificación pre-cliente: usuario@example.com Encontrado: true"
```

---

## 🔄 Próximos Pasos

Después de registrarte, puedes:
1. ✅ Ir a `/pre-cliente/dashboard`
2. ✅ Configurar tu tema y colores
3. ✅ Subir tu logo
4. ✅ Configurar tus redes sociales
5. ✅ Crear categorías y productos
