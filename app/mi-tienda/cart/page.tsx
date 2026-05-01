"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { useTheme } from "@/lib/ThemeContext";
import { obtenerTiendasUsuario, obtenerRedesSociales } from "@/lib/firebaseService";
import { Tienda } from "@/lib/types";

type CarritoProducto = {
	id: string;
	nombre: string;
	precio: number;
	stock: number;
	cantidad: number;
	imagenes?: string[];
	descripcion?: string;
	marca?: string;
	categoria?: string;
};

type User = {
	uid: string;
	role?: string;
	displayName?: string;
	email?: string;
};

export default function CartPage() {
	const { carrito, removeCarrito, addCarrito, user, setUser } = useUser() as {
		carrito: CarritoProducto[];
		removeCarrito: (id: string) => void;
		addCarrito: (p: CarritoProducto) => void;
		user: User | null;
		setUser: (u: User) => void;
	};
	const { currentColors } = useTheme();
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);
	const [tienda, setTienda] = useState<Tienda | null>(null);
	const [tiendaLoading, setTiendaLoading] = useState(false);
	const [redesSociales, setRedesSociales] = useState<any>(null);

	// Cargar tienda y redes sociales del usuario
	useEffect(() => {
		const cargarDatos = async () => {
			if (!user?.uid) return;
			setTiendaLoading(true);
			try {
				// Cargar tienda
				const tiendas = await obtenerTiendasUsuario(user.uid);
				if (tiendas.length > 0) {
					setTienda(tiendas[0]);
				}

				// Cargar redes sociales del usuario
				const redes = await obtenerRedesSociales(user.uid);
				setRedesSociales(redes);
			} catch (err) {
				console.error("Error al cargar datos:", err);
			} finally {
				setTiendaLoading(false);
			}
		};
		cargarDatos();
	}, [user?.uid]);

	// Calcular totales
	const subtotal = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
	const envio = 0; // Envío gratis por ahora
	const total = subtotal + envio;

	const handleCantidad = (id: string, cantidad: number) => {
		if (cantidad < 1) return;
		const prod = carrito.find(p => p.id === id);
		if (prod) {
			if (cantidad > prod.stock) {
				setError(`Solo hay ${prod.stock} unidades disponibles en stock de "${prod.nombre}".`);
				return;
			}
			setError("");
			removeCarrito(id);
			addCarrito({ ...prod, cantidad });
		}
	};

	// Recargar redes sociales manualmente
	const handleRecargarRedes = async () => {
		if (!user?.uid) return;
		try {
			const redes = await obtenerRedesSociales(user.uid);
			setRedesSociales(redes);
			setSuccess("✓ Redes sociales recargadas");
			setTimeout(() => setSuccess(""), 3000);
		} catch (err) {
			console.error("Error recargando redes:", err);
			setError("Error al recargar redes sociales");
			setTimeout(() => setError(""), 3000);
		}
	};

	// Enviar a WhatsApp
	const handleComprarWhatsApp = () => {
		if (!redesSociales?.whatsapp) {
			setError("El WhatsApp de la tienda no está configurado.");
			return;
		}

		// Crear mensaje para WhatsApp
		// Ejemplo de formato:
		// Hola, Me gustaría realizar una compra:
		// 
		// MONITOR GIGABYTE MO27Q28G 26.5INCH WOLED 2560X1440 2HDMI DP USB-C 3USB-3.2 280HZ ANTI-REFLECTION (Cantidad: 1)
		// LAPTOP LENOVO CORE I7 16GB RAM 512GB SSD (Cantidad: 2)
		// 
		// ━━━━━━━━━━━━━━━
		// TOTAL: $1,850.00
		// ━━━━━━━━━━━━━━━
		// 
		// Quiero confirmar disponibilidad y conocer más detalles. ¡Gracias!
		let mensaje = "Hola, Me gustaría realizar una compra:\n\n";
		
		carrito.forEach((item, index) => {
			// Nombre del producto en mayúsculas
			mensaje += `${item.nombre.toUpperCase()}`;
			
			// Agregar especificaciones técnicas si existen
			const especificaciones = [];
			if (item.descripcion) especificaciones.push(item.descripcion);
			if (item.marca) especificaciones.push(item.marca);
			if (item.categoria) especificaciones.push(item.categoria);
			
			if (especificaciones.length > 0) {
				mensaje += ` ${especificaciones.join(' ')}`;
			}
			
			// Agregar cantidad
			mensaje += ` (Cantidad: ${item.cantidad})\n`;
		});

		// Línea separadora y total
		mensaje += "━━━━━━━━━━━━━━━\n";
		mensaje += `TOTAL: $${total.toFixed(2)}\n`;
		mensaje += "━━━━━━━━━━━━━━━\n\n";
		mensaje += "Quiero confirmar disponibilidad y conocer más detalles. ¡Gracias!";

		// Codificar mensaje para URL
		const mensajeCodificado = encodeURIComponent(mensaje);
		const whatsappUrl = `https://wa.me/${redesSociales.whatsapp}?text=${mensajeCodificado}`;

		// Abrir WhatsApp
		window.open(whatsappUrl, "_blank");
	};

	// Validar que currentColors exista
	if (!currentColors) {
		return (
			<div className="flex items-center justify-center h-screen" style={{ backgroundColor: "#0f172a" }}>
				Cargando...
			</div>
		);
	}

	return (
		<div style={{ backgroundColor: currentColors.bgPrimary, color: currentColors.textPrimary }} className="min-h-screen flex flex-col transition-colors">
			<main className="max-w-6xl mx-auto px-4 py-8 lg:px-6 py-6 sm:py-12 flex-1">
				<h1 className="text-3xl font-bold mb-8" style={{ color: currentColors.textPrimary }}>Carrito de compras</h1>
				{error && (
					<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
						{error}
					</div>
				)}
				{success && (
					<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
						{success}
					</div>
				)}
								{success && (
					<div className="mb-4 p-3 rounded-lg border" style={{ backgroundColor: '#10b98120', color: '#059669', borderColor: '#10b98150' }}>
						{success}
					</div>
				)}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Items */}
					<div className="lg:col-span-2">
						{carrito.length === 0 ? (
							<div className="text-center py-12">
								<span className="material-icons-round text-6xl opacity-30" style={{ color: currentColors.textPrimary }}>shopping_bag</span>
								<h3 className="text-xl font-semibold mt-4" style={{ color: currentColors.textPrimary }}>Carrito vacío</h3>
								<p className="text-sm opacity-70 mt-2" style={{ color: currentColors.textSecondary }}>Agrega productos para comenzar tu compra</p>
								<a href="/mi-tienda/inventario" className="inline-block mt-4 px-6 py-2 rounded-lg transition-colors" style={{ backgroundColor: currentColors.accentColor || '#7b68ee', color: 'white' }}>
									<span className="material-icons-round text-sm mr-2">shopping_cart</span>
									Continuar comprando
								</a>
							</div>
						) : (
							<div className="space-y-4">
								{carrito.map((p) => (
									<div key={p.id} className="flex items-center gap-4 rounded-xl shadow p-4" style={{ backgroundColor: currentColors.bgSecondary }}>
										<img src={p.imagenes?.[0] || "/no-image.png"} alt={p.nombre} className="w-20 h-20 object-contain rounded-lg border" style={{ borderColor: currentColors.borderColor }} />
										<div className="flex-1">
											<div className="font-bold text-lg" style={{ color: currentColors.textPrimary }}>{p.nombre}</div>
											<div className="text-slate-500 dark:text-slate-300" style={{ color: currentColors.textSecondary }}>${p.precio}</div>
											<div className="flex items-center gap-2 mt-2">
												<label className="text-sm" style={{ color: currentColors.textPrimary }}>Cantidad:</label>
												<input
													type="number"
													min={1}
													value={p.cantidad || 1}
													onChange={e => handleCantidad(p.id, Number(e.target.value))}
													className="w-16 px-2 py-1 rounded border"
													style={{ 
														backgroundColor: currentColors.bgPrimary,
														borderColor: currentColors.borderColor,
														color: currentColors.textPrimary
													}}
												/>
												<button 
													className="ml-2 transition-colors" 
													style={{ color: '#ef4444' }}
													onClick={() => removeCarrito(p.id)}
												>
													<span className="material-icons-round">delete</span>
												</button>
											</div>
										</div>
										<div className="font-bold text-lg" style={{ color: currentColors.textPrimary }}>${(p.precio * (p.cantidad || 1)).toFixed(2)}</div>
									</div>
								))}
							</div>
						)}
					</div>
					{/* Resumen */}
					<div className="lg:col-span-1">
						<div className="rounded-xl p-6 sticky top-20" style={{ backgroundColor: currentColors.bgSecondary, color: currentColors.textPrimary }}>
							<h2 className="text-lg font-bold mb-4">Resumen</h2>
							<div className="space-y-3 border-b pb-4 mb-4" style={{ borderColor: currentColors.borderColor }}>
								<div className="flex justify-between text-sm">
									<span>Subtotal</span>
									<span>${subtotal.toFixed(2)}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span>Envío</span>
									<span style={{ color: '#10b981' }}>Gratis</span>
								</div>
							</div>
							<div className="flex justify-between text-lg font-bold mb-6">
								<span>Total</span>
								<span>${total.toFixed(2)}</span>
							</div>

							{carrito.length > 0 && (
								<>
									{tiendaLoading ? (
										<div className="text-center py-2">
											<span className="material-icons-round animate-spin">refresh</span>
											<span className="ml-2">Cargando...</span>
										</div>
									) : redesSociales?.whatsapp ? (
										<button
											className="w-full block text-center px-4 py-3 font-bold rounded-lg transition-all disabled:opacity-60 mb-3"
											style={{ backgroundColor: currentColors.whatsappColor, color: 'white' }}
											onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentColors.accentColor}
											onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentColors.whatsappColor}
											onClick={handleComprarWhatsApp}
										>
											<span className="material-icons-round mr-2">whatsapp</span>
											Comprar por WhatsApp
										</button>
									) : (
										<div className="space-y-3">
											<div className="text-center py-2 text-sm" style={{ color: '#f97316' }}>
												<span className="material-icons-round text-sm">warning</span>
												<span className="ml-1">WhatsApp no configurado</span>
											</div>
											<button
												onClick={handleRecargarRedes}
												className="w-full block text-center px-4 py-2 font-medium rounded-lg transition-colors text-sm"
												style={{ backgroundColor: currentColors.accentColor || '#3b82f6', color: 'white' }}
											>
												<span className="material-icons-round mr-2">refresh</span>
												Recargar datos
											</button>
										</div>
									)}

									<a 
										href="/mi-tienda/inventario" 
										className="w-full block text-center px-4 py-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
										style={{ borderColor: currentColors.borderColor }}
									>
										<span className="material-icons-round mr-2">add_shopping_cart</span>
										Seguir comprando
									</a>
								</>
							)}
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
