"use client";

import React, { useState, useEffect } from "react";
import {
  obtenerBodegas,
  crearBodega,
  actualizarBodega,
  eliminarBodega,
  escucharBodegas,
  type Bodega
} from "@/lib/bodegas-db";
import { useTheme } from "@/lib/ThemeContext";

export default function BodegasAdminPanel() {
  const { currentColors } = useTheme();
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nombre: "", tiempoEntrega: 72 });
  const [error, setError] = useState("");

  // Cargar bodegas con listener en tiempo real
  useEffect(() => {
    setLoading(true);
    const unsub = escucharBodegas((data) => {
      setBodegas(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.nombre.trim()) {
      setError("El nombre es requerido");
      return;
    }

    try {
      if (editingId) {
        await actualizarBodega(editingId, formData.nombre, formData.tiempoEntrega);
      } else {
        await crearBodega(formData.nombre, formData.tiempoEntrega);
      }
      setFormData({ nombre: "", tiempoEntrega: 72 });
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      setError("Error al guardar la bodega");
      console.error(err);
    }
  };

  const handleEdit = (bodega: Bodega) => {
    setFormData({ nombre: bodega.nombre, tiempoEntrega: bodega.tiempoEntrega });
    setEditingId(bodega.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta bodega?")) {
      try {
        await eliminarBodega(id);
      } catch (err) {
        setError("Error al eliminar la bodega");
        console.error(err);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ nombre: "", tiempoEntrega: 72 });
    setError("");
  };

  return (
    <div className="w-full">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <h2 
          style={{
            color: currentColors.textPrimary,
          }}
          className="text-2xl font-bold"
        >
          Gestión de Bodegas
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              backgroundColor: currentColors.accentColor,
              color: currentColors.buttonText,
            }}
            className="px-4 py-2 font-bold rounded-lg transition-colors"
          >
            + Nueva Bodega
          </button>
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <div 
          style={{
            backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#ffffff' : currentColors.bgSecondary,
            borderColor: currentColors.borderColor,
          }}
          className="p-6 rounded-lg mb-6 border"
        >
          <h3 
            style={{
              color: currentColors.textPrimary,
            }}
            className="text-lg font-bold mb-4"
          >
            {editingId ? "Editar Bodega" : "Nueva Bodega"}
          </h3>

          {error && (
            <div 
              style={{
                backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#fef2f2' : 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
              }}
              className="mb-4 p-3 rounded-lg"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                style={{
                  color: currentColors.textPrimary,
                }}
                className="block text-sm font-medium mb-2"
              >
                Nombre de la Bodega
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="ej: Bodega Central"
                style={{
                  backgroundColor: currentColors.bgPrimary,
                  borderColor: currentColors.borderColor,
                  color: currentColors.textPrimary,
                }}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label 
                style={{
                  color: currentColors.textPrimary,
                }}
                className="block text-sm font-medium mb-2"
              >
                Tiempo de Entrega (horas laborales)
              </label>
              <select
                value={formData.tiempoEntrega}
                onChange={(e) => setFormData({ ...formData, tiempoEntrega: parseInt(e.target.value) })}
                style={{
                  backgroundColor: currentColors.bgPrimary,
                  borderColor: currentColors.borderColor,
                  color: currentColors.textPrimary,
                }}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value={12}>12 horas (Rápida)</option>
                <option value={72}>72 horas (Estándar)</option>
              </select>
              {editingId === "technothings" && (
                <p 
                  style={{
                    color: currentColors.textSecondary,
                  }}
                  className="text-xs mt-1"
                >
                  La bodega Technothings siempre tiene entrega de 12 horas
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                style={{
                  backgroundColor: currentColors.accentColor,
                  color: currentColors.buttonText,
                }}
                className="flex-1 px-4 py-2 font-bold rounded-lg transition-colors"
              >
                {editingId ? "Actualizar" : "Crear"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#e2e8f0' : currentColors.bgSecondary,
                  color: currentColors.textPrimary,
                }}
                className="flex-1 px-4 py-2 font-bold rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de bodegas */}
      {loading ? (
        <div 
          style={{
            color: currentColors.textSecondary,
          }}
          className="text-center py-12"
        >Cargando bodegas...</div>
      ) : bodegas.length === 0 ? (
        <div 
          style={{
            color: currentColors.textSecondary,
          }}
          className="text-center py-12"
        >No hay bodegas creadas</div>
      ) : (
        <div className="grid gap-4">
          {bodegas.map((bodega) => (
            <div
              key={bodega.id}
              style={{
                backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#ffffff' : currentColors.bgSecondary,
                borderColor: currentColors.borderColor,
              }}
              className="p-4 rounded-lg border flex justify-between items-center"
            >
              <div className="flex-1">
                <h3 
                  style={{
                    color: currentColors.textPrimary,
                  }}
                  className="font-bold"
                >
                  {bodega.nombre}
                  {bodega.id === "technothings" && (
                    <span 
                      style={{
                        backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#f0fdf4' : 'rgba(34, 197, 94, 0.1)',
                        color: '#22c55e',
                      }}
                      className="ml-2 text-xs px-2 py-1 rounded"
                    >
                      Default
                    </span>
                  )}
                </h3>
                <p 
                  style={{
                    color: currentColors.textSecondary,
                  }}
                  className="text-sm mt-1"
                >
                  Entrega: {bodega.tiempoEntrega} horas laborales
                </p>
              </div>
              <div className="flex gap-2">
                {bodega.id !== "technothings" && (
                  <>
                    <button
                      onClick={() => handleEdit(bodega)}
                      style={{
                        backgroundColor: currentColors.accentColor,
                        color: currentColors.buttonText,
                      }}
                      className="px-3 py-2 font-bold rounded-lg transition-colors text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(bodega.id)}
                      style={{
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                      }}
                      className="px-3 py-2 font-bold rounded-lg transition-colors text-sm"
                    >
                      Eliminar
                    </button>
                  </>
                )}
                {bodega.id === "technothings" && (
                  <span 
                    style={{
                      color: currentColors.textSecondary,
                    }}
                    className="text-xs"
                  >
                    No se puede eliminar
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
