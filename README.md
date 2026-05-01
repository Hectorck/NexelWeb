# 🚀 Nexel - Agencia de E-commerce SaaS

Plataforma moderna para crear y gestionar tiendas virtuales sin código. Sistema de usuarios con niveles de acceso: Pre-clientes (prueba gratis), Clientes (planes pagados) y Admin.

## 🎯 Visión

**Nexel** transforma tu idea de negocio en realidad. En lugar de solo vender tiendas personalizadas, ahora ofreces:

1. **Prueba Gratuita (Plan Demo)** - Pre-clientes prueban con límites
2. **Conversión a Cliente** - Mayor confianza = Mayor probabilidad de compra
3. **Planes Flexibles** - Escalabilidad según necesidad

## 🏗️ Arquitectura

```
Frontend (Next.js 16) ← → Firebase (Backend)
├─ Dashboards        
├─ Editor Tienda     
└─ Página Pública    
```

## 🚀 Inicio Rápido

```bash
# Clonar proyecto
git clone <repo>
cd official-nexel

# Instalar dependencias
npm install

# Configurar Firebase (ver SETUP_GUIDE.md)
cp .env.example .env.local
# Edita .env.local con tus credenciales

# Iniciar servidor
npm run dev

# Abre http://localhost:3000
```

## 📊 Estructura

```
app/
├── page.tsx                 # Página inicio
├── login/page.tsx          # Login
├── registro/page.tsx       # Registro
├── admin/dashboard/        # Panel admin
├── pre-cliente/dashboard/  # Dashboard pre-cliente
└── cliente/dashboard/      # Dashboard cliente

lib/
├── firebase.ts             # Config Firebase
├── firebaseService.ts      # Servicios
├── types.ts               # Tipos
└── AuthContext.tsx        # Context
```

## 🔐 Sistema de Usuarios

- **Admin**: Gestiona plataforma, invita usuarios
- **Pre-cliente**: Prueba gratis (10 productos, 3 categorías)
- **Cliente**: Acceso según plan contratado

## 📖 Documentación

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Guía completa
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase
- [CHECKLIST.md](./CHECKLIST.md) - Checklist
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Resumen

## 🛠️ Stack

- Next.js 16
- React 19  
- TypeScript
- Firebase / Firestore
- Tailwind CSS

## 🚦 Próximos Pasos

1. Configura Firebase (ver SETUP_GUIDE.md)
2. Crea usuario admin
3. Prueba el sistema
4. Implementa editor de tienda

## 📞 Soporte

Consulta los archivos de documentación para:
- Instrucciones de configuración
- Troubleshooting
- Ejemplos de uso
- Mejores prácticas

---

**¡Comienza ahora!** Lee [SETUP_GUIDE.md](./SETUP_GUIDE.md)
