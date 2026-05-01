# ✅ Checklist de Configuración

Usa esta lista para asegurar que todo esté configurado correctamente.

## Fase 1: Configurar Firebase

- [ ] Crear cuenta en Firebase Console
- [ ] Crear nuevo proyecto
- [ ] Agregar aplicación web
- [ ] Copiar credenciales
- [ ] Pegar credenciales en `.env.local`
- [ ] Habilitar Email/Password Auth
- [ ] Crear Firestore Database
- [ ] Configurar reglas Firestore
- [ ] Verifica que las variables de entorno están en .env.local

```
✓ NEXT_PUBLIC_FIREBASE_API_KEY=
✓ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
✓ NEXT_PUBLIC_FIREBASE_PROJECT_ID=
✓ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
✓ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
✓ NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Fase 2: Crear Usuario Admin

- [ ] Abre Firestore Console
- [ ] Crea colección `pre-clientes`
- [ ] Crea documento con tu email
- [ ] Ejecuta `npm run dev`
- [ ] Ve a http://localhost:3000/registro
- [ ] Regístrate con tu email
- [ ] Vuelve a Firestore
- [ ] En `usuarios/{tu_uid}`, cambia `role` a "admin"
- [ ] Actualiza el navegador
- [ ] Accede a http://localhost:3000/admin/dashboard

## Fase 3: Probar Sistema

- [ ] Crea un pre-cliente desde admin panel
- [ ] Verifica que aparece en la lista
- [ ] Regístrate como pre-cliente
- [ ] Accede al dashboard de pre-cliente
- [ ] Crea una tienda de prueba
- [ ] Verifica los límites (10 productos máximo)
- [ ] Cierra sesión

## Fase 4: Verificar Seguridad

- [ ] `.env.local` está en `.gitignore`
- [ ] No hay datos sensibles en `package.json`
- [ ] Las contraseñas se hashean en Firebase
- [ ] Las reglas Firestore están correctas
- [ ] Solo admin puede ver pre-clientes
- [ ] Solo el propietario puede ver su tienda

## Fase 5: Testing Local

```bash
# En terminal
cd c:\Users\hector\Documents\desarrolloWeb\web\official-nexel

# Instalar dependencias
npm install

# Iniciar servidor
npm run dev

# Abrir navegador
http://localhost:3000
```

Test cases:

1. **Registro sin autorización**
   - [ ] Intenta registrarte con un email no invitado → Debe fallar

2. **Registro autorizado**
   - [ ] Crea un pre-cliente en admin panel
   - [ ] Regístrate con ese email → Debe funcionar

3. **Login**
   - [ ] Inicia sesión con tus credenciales → Debe funcionar
   - [ ] Intenta con contraseña incorrecta → Debe fallar

4. **Dashboards**
   - [ ] Admin dashboard → Solo admin puede acceder
   - [ ] Pre-cliente dashboard → Solo pre-cliente puede acceder
   - [ ] Cliente dashboard → Solo cliente puede acceder

5. **Crear tienda**
   - [ ] Pre-cliente crea tienda → Debe mostrar límites
   - [ ] Intenta crear 11 productos → Debe fallar (límite 10)

## Fase 6: Deployment (Futuro)

- [ ] Configurar variables de entorno en producción
- [ ] Cambiar reglas Firestore a modo producción
- [ ] Configurar dominio personalizado
- [ ] Setup de email notifications
- [ ] Setup de pagos (Stripe/PayPal)
- [ ] Analytics y monitoring

## 🐛 Troubleshooting

### Error: "Este email no está autorizado"
**Solución:** Crea el email en la colección `pre-clientes` con estado "aprobado"

### Error: "Usuario no encontrado"
**Solución:** Verifica que existe un documento en `usuarios/{uid}`

### No veo el admin panel
**Solución:** Tu `role` debe ser "admin" en Firestore

### Variables de entorno no funcionan
**Solución:** 
- Verifica que `.env.local` existe
- Reinicia `npm run dev`
- Las variables deben empezar con `NEXT_PUBLIC_`

### Firebase no se conecta
**Solución:**
- Verifica que copiaste correctamente las credenciales
- Comprueba que Firestore está activo
- Verifica que el proyecto está activo en Firebase Console

## 📚 Recursos

- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Next.js Docs](https://nextjs.org/docs)
- [React Context API](https://react.dev/reference/react/useContext)

## 🎯 Siguientes Features

Después de que todo esté funcionando:

1. **Editor de Tienda**
   - Crear/editar productos
   - Subir imágenes
   - Gestionar categorías
   - Vista previa en vivo

2. **Página Pública**
   - Mostrar tienda públicamente
   - Agregar al carrito
   - Demo de checkout

3. **Sistema de Órdenes**
   - Registro de órdenes
   - Notificaciones
   - Estado de envío

4. **Pagos**
   - Integración Stripe
   - Integración PayPal
   - Confirmación de compra

---

**¡Buena suerte! 🚀**

Si encuentras problemas, consulta los archivos de documentación o revisa los logs de la consola.
