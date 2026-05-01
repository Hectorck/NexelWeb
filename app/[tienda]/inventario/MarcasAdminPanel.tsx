import React, { useEffect, useState } from "react";
import { obtenerMarcasUsuario, guardarMarcaUsuario, eliminarMarca } from "@/lib/marcas-db";
import { useTheme } from "@/lib/ThemeContext";

const COLLECTION = "marcas";

export default function MarcasAdminPanel({ usuarioId }: { usuarioId: string }) {
  const { currentColors } = useTheme();
  const [marcas, setMarcas] = useState<any[]>([]);
  const [nuevaMarca, setNuevaMarca] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!usuarioId) return;
    obtenerMarcasUsuario(usuarioId).then(setMarcas);
  }, [usuarioId]);

  const agregarMarca = async () => {
    if (!nuevaMarca.trim()) return;
    setLoading(true);
    await guardarMarcaUsuario(nuevaMarca, usuarioId);
    setNuevaMarca("");
    setLoading(false);
    // Recargar marcas después de agregar
    obtenerMarcasUsuario(usuarioId).then(setMarcas);
  };

  const eliminarMarca = async (id: string) => {
    await eliminarMarca(id);
    // Recargar marcas después de eliminar
    obtenerMarcasUsuario(usuarioId).then(setMarcas);
  };

  return (
    <div 
      style={{
        backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#ffffff' : currentColors.bgSecondary,
        borderColor: currentColors.borderColor,
      }}
      className="max-w-xl mx-auto rounded-xl shadow p-6 border"
    >
      <h2 
        style={{
          color: currentColors.textPrimary,
        }}
        className="text-xl font-bold mb-4"
      >Gestión de Marcas</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          style={{
            backgroundColor: currentColors.bgPrimary,
            borderColor: currentColors.borderColor,
            color: currentColors.textPrimary,
          }}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Nueva marca..."
          value={nuevaMarca}
          onChange={e => setNuevaMarca(e.target.value)}
        />
        <button
          style={{
            backgroundColor: currentColors.accentColor,
            color: currentColors.buttonText,
          }}
          className="px-4 py-2 rounded font-bold"
          onClick={agregarMarca}
          disabled={loading}
        >
          Agregar marca
        </button>
      </div>
      <ul className="divide-y" style={{ borderColor: currentColors.borderColor }}>
        {marcas.map(marca => (
          <li key={marca.id} className="py-2 flex items-center justify-between">
            <span 
              style={{
                color: currentColors.textPrimary,
              }}
              className="font-semibold"
            >{marca.nombre}</span>
            <button
              style={{
                backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#fef2f2' : 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
              }}
              className="text-xs px-2 py-1 rounded hover:opacity-80"
              onClick={() => eliminarMarca(marca.id)}
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
