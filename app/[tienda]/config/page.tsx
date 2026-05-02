"use client";

import React, { useState, useEffect } from "react";
import { useTheme, DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME } from "@/lib/ThemeContext";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { obtenerRedesSociales, actualizarRedesSociales, RedesSociales, obtenerUbicacion, actualizarUbicacion, Ubicacion, obtenerTiendasUsuario, crearTienda, actualizarTienda, eliminarTienda, obtenerLimitesPreCliente, limpiarTiendasDuplicadas } from "@/lib/firebaseService";
import { useTiendaRoutes } from "@/lib/useTiendaRoutes";

export default function ConfigPage() {
  const { themeConfig, updateTheme, currentColors } = useTheme();
  const { usuario } = useAuth();
  const routes = useTiendaRoutes();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"tienda" | "logo" | "tema" | "contraseña" | "redes" | "ubicacion">("tienda");
  
  // Tienda state
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [tiendaLoading, setTiendaLoading] = useState(false);
  const [tiendaSaving, setTiendaSaving] = useState(false);
  const [showCreateTienda, setShowCreateTienda] = useState(false);
  const [tiendaForm, setTiendaForm] = useState({
    nombre: "",
    descripcion: ""
  });
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Redes sociales state
  const [redesSociales, setRedesSociales] = useState<RedesSociales>({});
  const [redesLoading, setRedesLoading] = useState(false);
  const [redesSaving, setRedesSaving] = useState(false);
  const [redesForm, setRedesForm] = useState<RedesSociales>({
    facebook: "",
    instagram: "",
    twitter: "",
    whatsapp: "",
    email: "",
    phone: ""
  });

  // Ubicación state
  const [ubicacion, setUbicacion] = useState<Ubicacion>({});
  const [ubicacionLoading, setUbicacionLoading] = useState(false);
  const [ubicacionSaving, setUbicacionSaving] = useState(false);

  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoSaving, setLogoSaving] = useState(false);

  useEffect(() => {
    if (usuario) {
      cargarRedesSociales();
      cargarUbicacion();
      cargarTiendas();
    }
  }, [usuario]);

  const cargarRedesSociales = async () => {
    if (!usuario) return;
    setRedesLoading(true);
    try {
      const redes = await obtenerRedesSociales(usuario.uid);
      setRedesSociales(redes || {});
      setRedesForm(redes || {});
    } catch (error) {
      console.error("Error cargando redes sociales:", error);
    } finally {
      setRedesLoading(false);
    }
  };

  const cargarUbicacion = async () => {
    if (!usuario) return;
    setUbicacionLoading(true);
    try {
      const ubicacionData = await obtenerUbicacion(usuario.uid);
      setUbicacion(ubicacionData || {});
    } catch (error) {
      console.error("Error cargando ubicación:", error);
    } finally {
      setUbicacionLoading(false);
    }
  };

  const cargarTiendas = async () => {
    if (!usuario) return;
    setTiendaLoading(true);
    try {
      const tiendasUsuario = await obtenerTiendasUsuario(usuario.uid);
      setTiendas(tiendasUsuario || []);
    } catch (error) {
      console.error("Error cargando tiendas:", error);
    } finally {
      setTiendaLoading(false);
    }
  };

  const handleGuardarRedesSociales = async () => {
    if (!usuario) return;
    setRedesSaving(true);
    try {
      await actualizarRedesSociales(usuario.uid, redesForm);
      setMessage("✓ Redes sociales actualizadas");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("✗ Error al guardar redes sociales");
    } finally {
      setRedesSaving(false);
    }
  };

  const handleGuardarUbicacion = async () => {
    if (!usuario) return;
    setUbicacionSaving(true);
    try {
      await actualizarUbicacion(usuario.uid, ubicacion);
      setMessage("✓ Ubicación actualizada");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("✗ Error al guardar ubicación");
    } finally {
      setUbicacionSaving(false);
    }
  };

  const handleCrearTienda = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!tiendaForm.nombre.trim()) {
      setMessage("✗ El nombre de la tienda es requerido");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    // Validar que no tenga tiendas ya creadas
    if (tiendas.length > 0) {
      setMessage("✗ Ya tienes una tienda creada");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setTiendaSaving(true);
    try {
      const limites = obtenerLimitesPreCliente();
      await crearTienda(
        usuario!.uid,
        tiendaForm.nombre.trim(),
        tiendaForm.descripcion.trim(),
        "demo",
        limites
      );
      
      setMessage("✓ Tienda creada correctamente");
      setTiendaForm({ nombre: "", descripcion: "" });
      setShowCreateTienda(false);
      await cargarTiendas();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("✗ Error al crear tienda");
    } finally {
      setTiendaSaving(false);
    }
  };

  const handleActualizarTienda = async (tiendaId: string, data: Partial<any>) => {
    if (!usuario) return;
    setTiendaSaving(true);
    try {
      await actualizarTienda(tiendaId, data);
      setMessage("✓ Tienda actualizada");
      await cargarTiendas();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("✗ Error al actualizar tienda");
    } finally {
      setTiendaSaving(false);
    }
  };

  const handleEliminarTienda = async (tiendaId: string) => {
    if (!usuario) return;
    if (!window.confirm("¿Estás seguro de que quieres eliminar tu tienda? Esto también eliminará todos tus productos.")) {
      return;
    }

    setTiendaSaving(true);
    try {
      await eliminarTienda(tiendaId, usuario.uid);
      setMessage("✓ Tienda eliminada");
      await cargarTiendas();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("✗ Error al eliminar tienda");
    } finally {
      setTiendaSaving(false);
    }
  };

  const handleColorChange = (theme: "light" | "dark", key: keyof typeof DEFAULT_LIGHT_THEME, value: string) => {
    if (!themeConfig) return;
    
    const updated = {
      ...themeConfig,
      [theme]: {
        ...themeConfig[theme],
        [key]: value
      }
    };
    
    updateTheme(updated);
  };

  const handleQuickThemeSwitch = (themeType: 'light' | 'dark') => {
    if (!themeConfig) return;
    
    // Solo cambiar el tema activo, preservar los colores personalizados
    const updated = {
      ...themeConfig,
      currentTheme: themeType // Solo cambiar el tema activo, no sobrescribir colores
    };
    
    updateTheme(updated);
    setMessage(`✓ Cambiado a tema ${themeType === 'light' ? 'claro' : 'oscuro'}`);
    setTimeout(() => setMessage(""), 2000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("✗ Todos los campos son requeridos");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setMessage("✗ Las contraseñas no coinciden");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage("✗ La contraseña debe tener al menos 6 caracteres");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setPasswordLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        setMessage("✗ Usuario no encontrado");
        return;
      }

      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      setMessage("✓ Contraseña actualizada correctamente");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        setMessage("✗ La contraseña actual es incorrecta");
      } else if (error.code === 'auth/too-many-requests') {
        setMessage("✗ Demasiados intentos. Intenta más tarde");
      } else {
        setMessage("✗ Error al cambiar contraseña");
      }
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setMessage("✗ Solo se permiten archivos de imagen");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage("✗ El archivo no puede superar los 5MB");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLogoFile(file);
  };

  const handleGuardarLogo = async () => {
    if (!logoFile || !usuario) return;

    setLogoSaving(true);
    try {
      console.log('Logo Upload - Starting upload for user:', usuario.uid);
      console.log('Logo Upload - File:', logoFile.name, 'Size:', logoFile.size);
      
      const storageRef = ref(storage, `logos/${usuario.uid}/${Date.now()}_${logoFile.name}`);
      console.log('Logo Upload - Storage ref created:', storageRef.fullPath);
      
      await uploadBytes(storageRef, logoFile);
      console.log('Logo Upload - File uploaded successfully');
      
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Logo Upload - Download URL obtained:', downloadURL);
      
      // Guardar URL en Firestore
      const { actualizarLogo } = await import("@/lib/firebaseService");
      await actualizarLogo(usuario.uid, downloadURL);
      
      setMessage("✓ Logo actualizado correctamente");
      setLogoFile(null);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error('Logo Upload - Error:', error);
      console.error('Logo Upload - Error details:', {
        message: error?.message,
        code: error?.code,
        serverResponse: error?.customData?.serverResponse,
        name: error?.name
      });
      setMessage("✗ Error al subir logo: " + (error?.message || 'Error desconocido'));
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLogoSaving(false);
    }
  };

  if (!usuario || !currentColors) {
    return (
      <div className="flex items-center justify-center h-screen p-4" style={{ backgroundColor: currentColors?.bgPrimary || '#f3f4f6' }}>
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-md">
            {/* Botones de selección de tema */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-full sm:w-auto justify-center">
              <button
                onClick={() => handleQuickThemeSwitch('light')}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  themeConfig?.currentTheme === 'light'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                title="Cambiar a tema claro"
              >
                <span className="hidden sm:inline">☀️ Claro</span>
                <span className="sm:hidden">☀️</span>
              </button>
              <button
                onClick={() => handleQuickThemeSwitch('dark')}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  themeConfig?.currentTheme === 'dark'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                title="Cambiar a tema oscuro"
              >
                <span className="hidden sm:inline">🌙 Oscuro</span>
                <span className="sm:hidden">🌙</span>
              </button>
            </div>
            <Link
              href={routes.base}
              className="px-4 py-2 rounded-lg font-medium transition-all w-full sm:w-auto text-center"
              style={{
                backgroundColor: currentColors.buttonBg,
                color: currentColors.buttonText
              }}
            >
              ← Volver
            </Link>
          </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: currentColors.bgPrimary, color: currentColors.textPrimary }} className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold">Configuración</h1>
            <p style={{ color: currentColors.textSecondary }} className="text-sm mt-1">
              Gestiona tu tienda y preferencias
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
            {/* Botones de selección de tema */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-full sm:w-auto justify-center">
              <button
                onClick={() => handleQuickThemeSwitch('light')}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  themeConfig?.currentTheme === 'light'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                title="Cambiar a tema claro"
              >
                <span className="hidden sm:inline">☀️ Claro</span>
                <span className="sm:hidden">☀️</span>
              </button>
              <button
                onClick={() => handleQuickThemeSwitch('dark')}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  themeConfig?.currentTheme === 'dark'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                title="Cambiar a tema oscuro"
              >
                <span className="hidden sm:inline">🌙 Oscuro</span>
                <span className="sm:hidden">🌙</span>
              </button>
            </div>
            <Link
              href={routes.base}
              className="px-4 py-2 rounded-lg font-medium transition-all w-full sm:w-auto text-center justify-center"
              style={{
                backgroundColor: currentColors.buttonBg,
                color: currentColors.buttonText
              }}
            >
              ← Volver
            </Link>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg text-center font-medium ${
            message.startsWith('✓') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b mb-6 overflow-x-auto" style={{ borderColor: currentColors.borderColor }}>
          <div className="flex space-x-2 sm:space-x-8 min-w-max px-1">
            {[
              { id: 'tienda', label: '🏪 Tienda', shortLabel: '🏪' },
              { id: 'logo', label: '📸 Logo', shortLabel: '📸' },
              { id: 'tema', label: '🎨 Tema', shortLabel: '🎨' },
              { id: 'contraseña', label: '🔒 Contraseña', shortLabel: '🔒' },
              { id: 'redes', label: '🌐 Redes', shortLabel: '🌐' },
              { id: 'ubicacion', label: '📍 Ubicación', shortLabel: '📍' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 sm:pb-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-current'
                    : 'border-transparent opacity-50'
                }`}
                style={{
                  color: activeTab === tab.id ? currentColors.textPrimary : currentColors.textSecondary
                }}
              >
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'tienda' && (
          <div
            style={{
              backgroundColor: currentColors.bgSecondary,
              borderColor: currentColors.borderColor
            }}
            className="p-6 rounded-2xl border"
          >
            <h2 className="text-xl font-bold mb-6">🏪 Gestión de Tienda</h2>
            
            {tiendaLoading ? (
              <p style={{ color: currentColors.textSecondary }} className="text-center py-8">
                Cargando tiendas...
              </p>
            ) : tiendas.length === 0 ? (
              <div>
                <p style={{ color: currentColors.textSecondary }} className="mb-6">
                  No tienes una tienda creada. Crea tu primera tienda para empezar a vender productos.
                </p>
                
                {!showCreateTienda ? (
                  <button
                    onClick={() => setShowCreateTienda(true)}
                    style={{
                      backgroundColor: currentColors.buttonBg,
                      color: currentColors.buttonText
                    }}
                    className="px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-all"
                  >
                    + Crear Tienda
                  </button>
                ) : (
                  <form onSubmit={handleCrearTienda} className="space-y-4">
                    <div>
                      <label style={{ color: currentColors.textPrimary }} className="block text-sm font-semibold mb-2">
                        Nombre de la Tienda *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Mi Tienda Increíble"
                        value={tiendaForm.nombre}
                        onChange={(e) => setTiendaForm({ ...tiendaForm, nombre: e.target.value })}
                        style={{
                          backgroundColor: currentColors.bgPrimary,
                          borderColor: currentColors.borderColor,
                          color: currentColors.textPrimary
                        }}
                        className="w-full px-4 py-3 border rounded-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <label style={{ color: currentColors.textPrimary }} className="block text-sm font-semibold mb-2">
                        Descripción
                      </label>
                      <textarea
                        placeholder="Describe brevemente tu tienda..."
                        value={tiendaForm.descripcion}
                        onChange={(e) => setTiendaForm({ ...tiendaForm, descripcion: e.target.value })}
                        rows={3}
                        style={{
                          backgroundColor: currentColors.bgPrimary,
                          borderColor: currentColors.borderColor,
                          color: currentColors.textPrimary
                        }}
                        className="w-full px-4 py-3 border rounded-lg resize-none"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={tiendaSaving}
                        style={{
                          backgroundColor: currentColors.buttonBg,
                          color: currentColors.buttonText
                        }}
                        className="px-6 py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition-all"
                      >
                        {tiendaSaving ? 'Creando...' : 'Crear Tienda'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateTienda(false);
                          setTiendaForm({ nombre: '', descripcion: '' });
                        }}
                        style={{
                          backgroundColor: currentColors.bgPrimary,
                          borderColor: currentColors.borderColor,
                          color: currentColors.textPrimary
                        }}
                        className="px-6 py-3 rounded-lg font-bold transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {tiendas.map((tienda) => (
                  <div
                    key={tienda.id}
                    style={{
                      backgroundColor: currentColors.bgPrimary,
                      borderColor: currentColors.borderColor
                    }}
                    className="p-6 rounded-xl border"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{tienda.nombre}</h3>
                        <p style={{ color: currentColors.textSecondary }} className="text-sm">
                          {tienda.descripcion || 'Sin descripción'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEliminarTienda(tienda.id)}
                        disabled={tiendaSaving}
                        className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 font-bold hover:bg-red-500/30 disabled:opacity-50 transition-all text-sm"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label style={{ color: currentColors.textPrimary }} className="block text-sm font-semibold mb-2">
                          Nombre de la Tienda
                        </label>
                        <input
                          type="text"
                          value={tienda.nombre}
                          onChange={(e) => handleActualizarTienda(tienda.id, { nombre: e.target.value })}
                          style={{
                            backgroundColor: currentColors.bgSecondary,
                            borderColor: currentColors.borderColor,
                            color: currentColors.textPrimary
                          }}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                      
                      <div>
                        <label style={{ color: currentColors.textPrimary }} className="block text-sm font-semibold mb-2">
                          Descripción
                        </label>
                        <textarea
                          value={tienda.descripcion || ''}
                          onChange={(e) => handleActualizarTienda(tienda.id, { descripcion: e.target.value })}
                          rows={2}
                          style={{
                            backgroundColor: currentColors.bgSecondary,
                            borderColor: currentColors.borderColor,
                            color: currentColors.textPrimary
                          }}
                          className="w-full px-4 py-2 border rounded-lg resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'logo' && (
          <div
            style={{
              backgroundColor: currentColors.bgSecondary,
              borderColor: currentColors.borderColor
            }}
            className="p-6 rounded-2xl border"
          >
            <h2 className="text-xl font-bold mb-6">📸 Logo de la Tienda</h2>
            
            <div className="space-y-6">
              <div>
                <label style={{ color: currentColors.textPrimary }} className="block text-sm font-semibold mb-2">
                  Subir Nuevo Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{
                    backgroundColor: currentColors.bgPrimary,
                    borderColor: currentColors.borderColor,
                    color: currentColors.textPrimary
                  }}
                  className="w-full px-4 py-3 border rounded-lg"
                />
                <p style={{ color: currentColors.textSecondary }} className="text-sm mt-2">
                  Formatos: JPG, PNG, GIF. Máximo 5MB
                </p>
              </div>
              
              {logoFile && (
                <div className="space-y-4">
                  <div className="text-sm">
                    Archivo seleccionado: <strong>{logoFile.name}</strong>
                  </div>
                  <button
                    onClick={handleGuardarLogo}
                    disabled={logoSaving}
                    style={{
                      backgroundColor: currentColors.buttonBg,
                      color: currentColors.buttonText
                    }}
                    className="px-6 py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {logoSaving ? 'Subiendo...' : 'Subir Logo'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tema' && (
          <div
            style={{
              backgroundColor: currentColors.bgSecondary,
              borderColor: currentColors.borderColor
            }}
            className="p-6 rounded-2xl border"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">🎨 Personalizar Tema</h2>
              <div className="flex items-center gap-2">
                <span style={{ color: currentColors.textSecondary }} className="text-sm">
                  {saving ? 'Guardando...' : '✓ Cambios guardados'}
                </span>
                <div className="w-2 h-2 rounded-full" style={{ 
                  backgroundColor: saving ? '#fbbf24' : '#10b981',
                  boxShadow: saving ? '0 0 0 4px rgba(251, 191, 36, 0.2)' : '0 0 0 4px rgba(16, 185, 129, 0.2)'
                }}></div>
              </div>
            </div>
            
            {/* Botones rápidos de tema */}
            <div className="mb-6 p-3 sm:p-4 rounded-lg" style={{ backgroundColor: currentColors.bgPrimary }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: currentColors.textPrimary }}>
                🎯 Temas Predefinidos
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    const blueTheme = {
                      light: {
                        bgPrimary: '#ffffff',
                        bgSecondary: '#f5f5f5',
                        bgAccent: '#f0f4ff',
                        textPrimary: '#1f293b',
                        textSecondary: '#6b7280',
                        buttonBg: '#3b82f6',
                        buttonText: '#ffffff',
                        borderColor: '#e5e7eb',
                        accentColor: '#06b6d4',
                        whatsappColor: '#25d366'
                      },
                      dark: {
                        bgPrimary: '#0f172a',
                        bgSecondary: '#1e293b',
                        bgAccent: '#1e3a8a',
                        textPrimary: '#f1f5f9',
                        textSecondary: '#cbd5e1',
                        buttonBg: '#0ea5e9',
                        buttonText: '#ffffff',
                        borderColor: '#334155',
                        accentColor: '#06b6d4',
                        whatsappColor: '#128c7e'
                      }
                    };
                    updateTheme(blueTheme);
                    setMessage('✓ Tema Azul aplicado');
                    setTimeout(() => setMessage(''), 2000);
                  }}
                  className="p-2 sm:p-3 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all"
                >
                  <div className="text-lg sm:text-2xl mb-1">💙</div>
                  <div className="text-xs font-medium">Azul</div>
                </button>
                
                <button
                  onClick={() => {
                    const greenTheme = {
                      light: {
                        bgPrimary: '#ffffff',
                        bgSecondary: '#f0fdf4',
                        bgAccent: '#dcfce7',
                        textPrimary: '#064e3b',
                        textSecondary: '#047857',
                        buttonBg: '#10b981',
                        buttonText: '#ffffff',
                        borderColor: '#d1fae5',
                        accentColor: '#14b8a6',
                        whatsappColor: '#059669'
                      },
                      dark: {
                        bgPrimary: '#022c22',
                        bgSecondary: '#064e3b',
                        bgAccent: '#065f46',
                        textPrimary: '#ecfdf5',
                        textSecondary: '#a7f3d0',
                        buttonBg: '#059669',
                        buttonText: '#ffffff',
                        borderColor: '#065f46',
                        accentColor: '#14b8a6',
                        whatsappColor: '#10b981'
                      }
                    };
                    updateTheme(greenTheme);
                    setMessage('✓ Tema Verde aplicado');
                    setTimeout(() => setMessage(''), 2000);
                  }}
                  className="p-2 sm:p-3 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-all"
                >
                  <div className="text-lg sm:text-2xl mb-1">💚</div>
                  <div className="text-xs font-medium">Verde</div>
                </button>
                
                <button
                  onClick={() => {
                    const purpleTheme = {
                      light: {
                        bgPrimary: '#ffffff',
                        bgSecondary: '#faf5ff',
                        bgAccent: '#f3e8ff',
                        textPrimary: '#4c1d95',
                        textSecondary: '#7c3aed',
                        buttonBg: '#8b5cf6',
                        buttonText: '#ffffff',
                        borderColor: '#e9d5ff',
                        accentColor: '#a855f7',
                        whatsappColor: '#9333ea'
                      },
                      dark: {
                        bgPrimary: '#1e1b4b',
                        bgSecondary: '#312e81',
                        bgAccent: '#4c1d95',
                        textPrimary: '#f5f3ff',
                        textSecondary: '#ddd6fe',
                        buttonBg: '#8b5cf6',
                        buttonText: '#ffffff',
                        borderColor: '#4c1d95',
                        accentColor: '#a855f7',
                        whatsappColor: '#9333ea'
                      }
                    };
                    updateTheme(purpleTheme);
                    setMessage('✓ Tema Púrpura aplicado');
                    setTimeout(() => setMessage(''), 2000);
                  }}
                  className="p-2 sm:p-3 rounded-lg border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 transition-all"
                >
                  <div className="text-lg sm:text-2xl mb-1">💜</div>
                  <div className="text-xs font-medium">Púrpura</div>
                </button>
                
                <button
                  onClick={() => {
                    const orangeTheme = {
                      light: {
                        bgPrimary: '#ffffff',
                        bgSecondary: '#fff7ed',
                        bgAccent: '#fed7aa',
                        textPrimary: '#7c2d12',
                        textSecondary: '#c2410c',
                        buttonBg: '#f97316',
                        buttonText: '#ffffff',
                        borderColor: '#fed7aa',
                        accentColor: '#fb923c',
                        whatsappColor: '#ea580c'
                      },
                      dark: {
                        bgPrimary: '#431407',
                        bgSecondary: '#7c2d12',
                        bgAccent: '#9a3412',
                        textPrimary: '#fff7ed',
                        textSecondary: '#fdba74',
                        buttonBg: '#f97316',
                        buttonText: '#ffffff',
                        borderColor: '#9a3412',
                        accentColor: '#fb923c',
                        whatsappColor: '#ea580c'
                      }
                    };
                    updateTheme(orangeTheme);
                    setMessage('✓ Tema Naranja aplicado');
                    setTimeout(() => setMessage(''), 2000);
                  }}
                  className="p-2 sm:p-3 rounded-lg border-2 border-orange-200 bg-orange-50 hover:bg-orange-100 transition-all"
                >
                  <div className="text-lg sm:text-2xl mb-1">🧡</div>
                  <div className="text-xs font-medium">Naranja</div>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Tema Claro */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">🌞 Tema Claro</h3>
                  <button
                    onClick={() => {
                      const defaultLight = DEFAULT_LIGHT_THEME;
                      updateTheme({
                        ...themeConfig,
                        light: defaultLight
                      });
                      setMessage('✓ Tema claro restaurado');
                      setTimeout(() => setMessage(''), 2000);
                    }}
                    className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-all"
                  >
                    🔄 Restaurar
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Colores principales */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                        Color Principal
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeConfig?.light?.accentColor || '#06b6d4'}
                          onChange={(e) => handleColorChange('light', 'accentColor', e.target.value)}
                          className="w-12 h-10 sm:w-full rounded cursor-pointer flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={themeConfig?.light?.accentColor || '#06b6d4'}
                          onChange={(e) => handleColorChange('light', 'accentColor', e.target.value)}
                          style={{
                            backgroundColor: currentColors.bgPrimary,
                            borderColor: currentColors.borderColor,
                            color: currentColors.textPrimary
                          }}
                          className="flex-1 px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                        Color de Acento
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeConfig?.light?.buttonBg || '#3b82f6'}
                          onChange={(e) => handleColorChange('light', 'buttonBg', e.target.value)}
                          className="w-12 h-10 sm:w-full rounded cursor-pointer flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={themeConfig?.light?.buttonBg || '#3b82f6'}
                          onChange={(e) => handleColorChange('light', 'buttonBg', e.target.value)}
                          style={{
                            backgroundColor: currentColors.bgPrimary,
                            borderColor: currentColors.borderColor,
                            color: currentColors.textPrimary
                          }}
                          className="flex-1 px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fondo de Acento */}
                  <div>
                    <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                      Fondo de Acento
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeConfig?.light?.bgAccent || '#f0f4ff'}
                        onChange={(e) => handleColorChange('light', 'bgAccent', e.target.value)}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={themeConfig?.light?.bgAccent || '#f0f4ff'}
                        onChange={(e) => handleColorChange('light', 'bgAccent', e.target.value)}
                        style={{
                          backgroundColor: currentColors.bgPrimary,
                          borderColor: currentColors.borderColor,
                          color: currentColors.textPrimary
                        }}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>

                  {/* Colores de fondo */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                        Fondo Principal
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeConfig?.light?.bgPrimary || '#ffffff'}
                          onChange={(e) => handleColorChange('light', 'bgPrimary', e.target.value)}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig?.light?.bgPrimary || '#ffffff'}
                          onChange={(e) => handleColorChange('light', 'bgPrimary', e.target.value)}
                          style={{
                            backgroundColor: currentColors.bgPrimary,
                            borderColor: currentColors.borderColor,
                            color: currentColors.textPrimary
                          }}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                        Fondo Secundario
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeConfig?.light?.bgSecondary || '#f3f4f6'}
                          onChange={(e) => handleColorChange('light', 'bgSecondary', e.target.value)}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig?.light?.bgSecondary || '#f3f4f6'}
                          onChange={(e) => handleColorChange('light', 'bgSecondary', e.target.value)}
                          style={{
                            backgroundColor: currentColors.bgPrimary,
                            borderColor: currentColors.borderColor,
                            color: currentColors.textPrimary
                          }}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Colores de texto */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                        Texto Principal
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeConfig?.light?.textPrimary || '#111827'}
                          onChange={(e) => handleColorChange('light', 'textPrimary', e.target.value)}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig?.light?.textPrimary || '#111827'}
                          onChange={(e) => handleColorChange('light', 'textPrimary', e.target.value)}
                          style={{
                            backgroundColor: currentColors.bgPrimary,
                            borderColor: currentColors.borderColor,
                            color: currentColors.textPrimary
                          }}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                        Texto Secundario
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeConfig?.light?.textSecondary || '#6b7280'}
                          onChange={(e) => handleColorChange('light', 'textSecondary', e.target.value)}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig?.light?.textSecondary || '#6b7280'}
                          onChange={(e) => handleColorChange('light', 'textSecondary', e.target.value)}
                          style={{
                            backgroundColor: currentColors.bgPrimary,
                            borderColor: currentColors.borderColor,
                            color: currentColors.textPrimary
                          }}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Colores de botones y bordes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                        Fondo Botones
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeConfig?.light?.buttonBg || '#3b82f6'}
                          onChange={(e) => handleColorChange('light', 'buttonBg', e.target.value)}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig?.light?.buttonBg || '#3b82f6'}
                          onChange={(e) => handleColorChange('light', 'buttonBg', e.target.value)}
                          style={{
                            backgroundColor: currentColors.bgPrimary,
                            borderColor: currentColors.borderColor,
                            color: currentColors.textPrimary
                          }}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                        Texto Botones
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeConfig?.light?.buttonText || '#ffffff'}
                          onChange={(e) => handleColorChange('light', 'buttonText', e.target.value)}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig?.light?.buttonText || '#ffffff'}
                          onChange={(e) => handleColorChange('light', 'buttonText', e.target.value)}
                          style={{
                            backgroundColor: currentColors.bgPrimary,
                            borderColor: currentColors.borderColor,
                            color: currentColors.textPrimary
                          }}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                      Color de Bordes
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeConfig?.light?.borderColor || '#e5e7eb'}
                        onChange={(e) => handleColorChange('light', 'borderColor', e.target.value)}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={themeConfig?.light?.borderColor || '#e5e7eb'}
                        onChange={(e) => handleColorChange('light', 'borderColor', e.target.value)}
                        style={{
                          backgroundColor: currentColors.bgPrimary,
                          borderColor: currentColors.borderColor,
                          color: currentColors.textPrimary
                        }}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tema Oscuro */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">🌙 Tema Oscuro</h3>
                  <button
                    onClick={() => {
                      const defaultDark = DEFAULT_DARK_THEME;
                      updateTheme({
                        ...themeConfig,
                        dark: defaultDark
                      });
                      setMessage('✓ Tema oscuro restaurado');
                      setTimeout(() => setMessage(''), 2000);
                    }}
                    className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-all"
                  >
                    🔄 Restaurar
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Colores principales */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                        Color Principal
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeConfig?.dark?.accentColor || '#06b6d4'}
                          onChange={(e) => handleColorChange('dark', 'accentColor', e.target.value)}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig?.dark?.accentColor || '#06b6d4'}
                          onChange={(e) => handleColorChange('dark', 'accentColor', e.target.value)}
                          style={{
                            backgroundColor: currentColors.bgPrimary,
                            borderColor: currentColors.borderColor,
                            color: currentColors.textPrimary
                          }}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                        Color de Acento
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeConfig?.dark?.buttonBg || '#0ea5e9'}
                          onChange={(e) => handleColorChange('dark', 'buttonBg', e.target.value)}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig?.dark?.buttonBg || '#0ea5e9'}
                          onChange={(e) => handleColorChange('dark', 'buttonBg', e.target.value)}
                          style={{
                            backgroundColor: currentColors.bgPrimary,
                            borderColor: currentColors.borderColor,
                            color: currentColors.textPrimary
                          }}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fondo de Acento */}
                  <div>
                    <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                      Fondo de Acento
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeConfig?.dark?.bgAccent || '#1e3a8a'}
                        onChange={(e) => handleColorChange('dark', 'bgAccent', e.target.value)}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={themeConfig?.dark?.bgAccent || '#1e3a8a'}
                        onChange={(e) => handleColorChange('dark', 'bgAccent', e.target.value)}
                        style={{
                          backgroundColor: currentColors.bgPrimary,
                          borderColor: currentColors.borderColor,
                          color: currentColors.textPrimary
                        }}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>

                  {/* Colores de fondo */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                        Fondo Principal
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeConfig?.dark?.bgPrimary || '#111827'}
                          onChange={(e) => handleColorChange('dark', 'bgPrimary', e.target.value)}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig?.dark?.bgPrimary || '#111827'}
                          onChange={(e) => handleColorChange('dark', 'bgPrimary', e.target.value)}
                          style={{
                            backgroundColor: currentColors.bgPrimary,
                            borderColor: currentColors.borderColor,
                            color: currentColors.textPrimary
                          }}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                        Fondo Secundario
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeConfig?.dark?.bgSecondary || '#1f2937'}
                          onChange={(e) => handleColorChange('dark', 'bgSecondary', e.target.value)}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig?.dark?.bgSecondary || '#1f2937'}
                          onChange={(e) => handleColorChange('dark', 'bgSecondary', e.target.value)}
                          style={{
                            backgroundColor: currentColors.bgPrimary,
                            borderColor: currentColors.borderColor,
                            color: currentColors.textPrimary
                          }}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Colores de texto */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                        Texto Principal
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeConfig?.dark?.textPrimary || '#f9fafb'}
                          onChange={(e) => handleColorChange('dark', 'textPrimary', e.target.value)}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig?.dark?.textPrimary || '#f9fafb'}
                          onChange={(e) => handleColorChange('dark', 'textPrimary', e.target.value)}
                          style={{
                            backgroundColor: currentColors.bgPrimary,
                            borderColor: currentColors.borderColor,
                            color: currentColors.textPrimary
                          }}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                        Texto Secundario
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeConfig?.dark?.textSecondary || '#9ca3af'}
                          onChange={(e) => handleColorChange('dark', 'textSecondary', e.target.value)}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig?.dark?.textSecondary || '#9ca3af'}
                          onChange={(e) => handleColorChange('dark', 'textSecondary', e.target.value)}
                          style={{
                            backgroundColor: currentColors.bgPrimary,
                            borderColor: currentColors.borderColor,
                            color: currentColors.textPrimary
                          }}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Colores de botones y bordes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                        Fondo Botones
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeConfig?.dark?.buttonBg || '#3b82f6'}
                          onChange={(e) => handleColorChange('dark', 'buttonBg', e.target.value)}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig?.dark?.buttonBg || '#3b82f6'}
                          onChange={(e) => handleColorChange('dark', 'buttonBg', e.target.value)}
                          style={{
                            backgroundColor: currentColors.bgPrimary,
                            borderColor: currentColors.borderColor,
                            color: currentColors.textPrimary
                          }}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                        Texto Botones
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={themeConfig?.dark?.buttonText || '#ffffff'}
                          onChange={(e) => handleColorChange('dark', 'buttonText', e.target.value)}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig?.dark?.buttonText || '#ffffff'}
                          onChange={(e) => handleColorChange('dark', 'buttonText', e.target.value)}
                          style={{
                            backgroundColor: currentColors.bgPrimary,
                            borderColor: currentColors.borderColor,
                            color: currentColors.textPrimary
                          }}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                      Color de Bordes
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeConfig?.dark?.borderColor || '#374151'}
                        onChange={(e) => handleColorChange('dark', 'borderColor', e.target.value)}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={themeConfig?.dark?.borderColor || '#374151'}
                        onChange={(e) => handleColorChange('dark', 'borderColor', e.target.value)}
                        style={{
                          backgroundColor: currentColors.bgPrimary,
                          borderColor: currentColors.borderColor,
                          color: currentColors.textPrimary
                        }}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vista Previa */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">👁️ Vista Previa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Tema Claro</h4>
                  <div
                    style={{
                      backgroundColor: themeConfig?.light?.bgPrimary,
                      borderColor: themeConfig?.light?.borderColor,
                      color: themeConfig?.light?.textPrimary
                    }}
                    className="p-4 rounded-lg border"
                  >
                    <h5 style={{ color: themeConfig?.light?.textPrimary }} className="font-semibold mb-2">
                      Ejemplo de Texto Principal
                    </h5>
                    <p style={{ color: themeConfig?.light?.textSecondary }} className="text-sm mb-4">
                      Este es un ejemplo de texto secundario para demostrar cómo se ve tu tema personalizado.
                    </p>
                    <div className="flex gap-2">
                      <button
                        style={{
                          backgroundColor: themeConfig?.light?.buttonBg,
                          color: themeConfig?.light?.buttonText
                        }}
                        className="px-4 py-2 rounded font-medium"
                      >
                        Botón Principal
                      </button>
                      <button
                        style={{
                          backgroundColor: themeConfig?.light?.bgSecondary,
                          color: themeConfig?.light?.textPrimary,
                          borderColor: themeConfig?.light?.borderColor
                        }}
                        className="px-4 py-2 rounded font-medium border"
                      >
                        Botón Secundario
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-3">Tema Oscuro</h4>
                  <div
                    style={{
                      backgroundColor: themeConfig?.dark?.bgPrimary,
                      borderColor: themeConfig?.dark?.borderColor,
                      color: themeConfig?.dark?.textPrimary
                    }}
                    className="p-4 rounded-lg border"
                  >
                    <h5 style={{ color: themeConfig?.dark?.textPrimary }} className="font-semibold mb-2">
                      Ejemplo de Texto Principal
                    </h5>
                    <p style={{ color: themeConfig?.dark?.textSecondary }} className="text-sm mb-4">
                      Este es un ejemplo de texto secundario para demostrar cómo se ve tu tema personalizado en modo oscuro.
                    </p>
                    <div className="flex gap-2">
                      <button
                        style={{
                          backgroundColor: themeConfig?.dark?.buttonBg,
                          color: themeConfig?.dark?.buttonText
                        }}
                        className="px-4 py-2 rounded font-medium"
                      >
                        Botón Principal
                      </button>
                      <button
                        style={{
                          backgroundColor: themeConfig?.dark?.bgSecondary,
                          color: themeConfig?.dark?.textPrimary,
                          borderColor: themeConfig?.dark?.borderColor
                        }}
                        className="px-4 py-2 rounded font-medium border"
                      >
                        Botón Secundario
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => {
                  // Resetear a temas por defecto
                  const defaultLight = DEFAULT_LIGHT_THEME;
                  const defaultDark = DEFAULT_DARK_THEME;
                  updateTheme({
                    light: defaultLight,
                    dark: defaultDark
                  });
                  setMessage("✓ Temas restaurados a los valores por defecto");
                  setTimeout(() => setMessage(""), 3000);
                }}
                style={{
                  backgroundColor: currentColors.bgSecondary,
                  borderColor: currentColors.borderColor,
                  color: currentColors.textPrimary
                }}
                className="px-4 sm:px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-all w-full sm:w-auto text-center"
              >
                🔄 Restaurar Todo
              </button>
              
              <button
                onClick={() => {
                  // Exportar configuración actual
                  const configData = JSON.stringify(themeConfig, null, 2);
                  const blob = new Blob([configData], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'theme-config.json';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  setMessage("✓ Configuración de tema exportada");
                  setTimeout(() => setMessage(""), 3000);
                }}
                style={{
                  backgroundColor: currentColors.buttonBg,
                  color: currentColors.buttonText
                }}
                className="px-4 sm:px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-all w-full sm:w-auto text-center"
              >
                📥 Exportar Configuración
              </button>
            </div>
          </div>
        )}

        {activeTab === 'contraseña' && (
          <div
            style={{
              backgroundColor: currentColors.bgSecondary,
              borderColor: currentColors.borderColor
            }}
            className="p-6 rounded-2xl border"
          >
            <h2 className="text-xl font-bold mb-6">🔒 Cambiar Contraseña</h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div>
                <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{
                    backgroundColor: currentColors.bgPrimary,
                    borderColor: currentColors.borderColor,
                    color: currentColors.textPrimary
                  }}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    backgroundColor: currentColors.bgPrimary,
                    borderColor: currentColors.borderColor,
                    color: currentColors.textPrimary
                  }}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                  minLength={6}
                />
              </div>
              
              <div>
                <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    backgroundColor: currentColors.bgPrimary,
                    borderColor: currentColors.borderColor,
                    color: currentColors.textPrimary
                  }}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                  minLength={6}
                />
              </div>
              
              <button
                type="submit"
                disabled={passwordLoading}
                style={{
                  backgroundColor: currentColors.buttonBg,
                  color: currentColors.buttonText
                }}
                className="px-6 py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {passwordLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'redes' && (
          <div
            style={{
              backgroundColor: currentColors.bgSecondary,
              borderColor: currentColors.borderColor
            }}
            className="p-6 rounded-2xl border"
          >
            <h2 className="text-xl font-bold mb-6">🌐 Redes Sociales</h2>
            
            {redesLoading ? (
              <p style={{ color: currentColors.textSecondary }} className="text-center py-8">
                Cargando redes sociales...
              </p>
            ) : (
              <form onSubmit={handleGuardarRedesSociales} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                      Facebook
                    </label>
                    <input
                      type="url"
                      value={redesForm.facebook}
                      onChange={(e) => setRedesForm({ ...redesForm, facebook: e.target.value })}
                      placeholder="https://facebook.com/tu-pagina"
                      style={{
                        backgroundColor: currentColors.bgPrimary,
                        borderColor: currentColors.borderColor,
                        color: currentColors.textPrimary
                      }}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                      Instagram
                    </label>
                    <input
                      type="url"
                      value={redesForm.instagram}
                      onChange={(e) => setRedesForm({ ...redesForm, instagram: e.target.value })}
                      placeholder="https://instagram.com/tu-perfil"
                      style={{
                        backgroundColor: currentColors.bgPrimary,
                        borderColor: currentColors.borderColor,
                        color: currentColors.textPrimary
                      }}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                      Twitter
                    </label>
                    <input
                      type="url"
                      value={redesForm.twitter}
                      onChange={(e) => setRedesForm({ ...redesForm, twitter: e.target.value })}
                      placeholder="https://twitter.com/tu-perfil"
                      style={{
                        backgroundColor: currentColors.bgPrimary,
                        borderColor: currentColors.borderColor,
                        color: currentColors.textPrimary
                      }}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={redesForm.whatsapp}
                      onChange={(e) => setRedesForm({ ...redesForm, whatsapp: e.target.value })}
                      placeholder="+593 987 654 321"
                      style={{
                        backgroundColor: currentColors.bgPrimary,
                        borderColor: currentColors.borderColor,
                        color: currentColors.textPrimary
                      }}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={redesForm.email}
                      onChange={(e) => setRedesForm({ ...redesForm, email: e.target.value })}
                      placeholder="contacto@tienda.com"
                      style={{
                        backgroundColor: currentColors.bgPrimary,
                        borderColor: currentColors.borderColor,
                        color: currentColors.textPrimary
                      }}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={redesForm.phone}
                      onChange={(e) => setRedesForm({ ...redesForm, phone: e.target.value })}
                      placeholder="+593 2 234 5678"
                      style={{
                        backgroundColor: currentColors.bgPrimary,
                        borderColor: currentColors.borderColor,
                        color: currentColors.textPrimary
                      }}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={redesSaving}
                  style={{
                    backgroundColor: currentColors.buttonBg,
                    color: currentColors.buttonText
                  }}
                  className="px-6 py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {redesSaving ? 'Guardando...' : 'Guardar Redes Sociales'}
                </button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'ubicacion' && (
          <div
            style={{
              backgroundColor: currentColors.bgSecondary,
              borderColor: currentColors.borderColor
            }}
            className="p-6 rounded-2xl border"
          >
            <h2 className="text-xl font-bold mb-6">📍 Ubicación de la Tienda</h2>
            
            {ubicacionLoading ? (
              <p style={{ color: currentColors.textSecondary }} className="text-center py-8">
                Cargando ubicación...
              </p>
            ) : (
              <form onSubmit={handleGuardarUbicacion} className="space-y-4">
                <div>
                  <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                    Nombre de la Ubicación
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Mi Tienda - Centro Comercial"
                    value={ubicacion.nombre || ''}
                    onChange={(e) => setUbicacion({ ...ubicacion, nombre: e.target.value })}
                    style={{
                      backgroundColor: currentColors.bgPrimary,
                      borderColor: currentColors.borderColor,
                      color: currentColors.textPrimary
                    }}
                    className="w-full px-4 py-3 border rounded-lg"
                  />
                  <p style={{ color: currentColors.textSecondary }} className="text-xs mt-1">
                    Nombre descriptivo para que los clientes te encuentren fácilmente
                  </p>
                </div>

                <div>
                  <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Av. Principal 123, Ciudad"
                    value={ubicacion.direccion || ''}
                    onChange={(e) => setUbicacion({ ...ubicacion, direccion: e.target.value })}
                    style={{
                      backgroundColor: currentColors.bgPrimary,
                      borderColor: currentColors.borderColor,
                      color: currentColors.textPrimary
                    }}
                    className="w-full px-4 py-3 border rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Quito"
                      value={ubicacion.ciudad || ''}
                      onChange={(e) => setUbicacion({ ...ubicacion, ciudad: e.target.value })}
                      style={{
                        backgroundColor: currentColors.bgPrimary,
                        borderColor: currentColors.borderColor,
                        color: currentColors.textPrimary
                      }}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                      Provincia
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Pichincha"
                      value={ubicacion.provincia || ''}
                      onChange={(e) => setUbicacion({ ...ubicacion, provincia: e.target.value })}
                      style={{
                        backgroundColor: currentColors.bgPrimary,
                        borderColor: currentColors.borderColor,
                        color: currentColors.textPrimary
                      }}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej: +593 2 234 5678"
                    value={ubicacion.telefono || ''}
                    onChange={(e) => setUbicacion({ ...ubicacion, telefono: e.target.value })}
                    style={{
                      backgroundColor: currentColors.bgPrimary,
                      borderColor: currentColors.borderColor,
                      color: currentColors.textPrimary
                    }}
                    className="w-full px-4 py-3 border rounded-lg"
                  />
                </div>

                <div>
                  <label style={{ color: currentColors.textPrimary }} className="block text-sm font-medium mb-2">
                    Horario de Atención
                  </label>
                  <textarea
                    placeholder="Ej: Lunes a Viernes: 9:00 - 18:00&#10;Sábados: 10:00 - 14:00&#10;Domingos: Cerrado"
                    value={ubicacion.horario || ''}
                    onChange={(e) => setUbicacion({ ...ubicacion, horario: e.target.value })}
                    rows={3}
                    style={{
                      backgroundColor: currentColors.bgPrimary,
                      borderColor: currentColors.borderColor,
                      color: currentColors.textPrimary
                    }}
                    className="w-full px-4 py-3 border rounded-lg resize-none"
                  />
                  <p style={{ color: currentColors.textSecondary }} className="text-xs mt-1">
                    Usa &#10; para separar líneas
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={ubicacionSaving}
                  style={{
                    backgroundColor: currentColors.buttonBg,
                    color: currentColors.buttonText
                  }}
                  className="px-6 py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {ubicacionSaving ? 'Guardando...' : 'Guardar Ubicación'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
