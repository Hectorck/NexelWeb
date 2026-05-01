"use client";

import { useEffect, useState, ChangeEvent } from "react";
import type {
	Blog,
	BlogBlock,
	BlogBlockType,
	BlogFieldStyle,
} from "@/lib/blog-types";
import {
	getBlogsByUsuario,
	saveBlog,
	deleteBlog,
	setFeaturedBlog,
	removeFeaturedBlog,
	updateBlogPositions,
} from "@/lib/blogs-db";
import { uploadImageAndGetUrl } from "@/lib/upload-image";
import BlogPreview from "../blogs/BlogPreview";
import { Icons, getCategoryIcon } from "@/app/components/Icons";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";

type EditableBlog = Partial<Blog> & { id?: string };

function createEmptyBlog(): EditableBlog {
	return {
		title: "",
		description: "",
		blocks: [],
		status: "draft",
		featured: false,
	};
}

function createBlockId() {
	return `block-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toPreviewBlog(blog: EditableBlog): Blog {
	return {
		id: blog.id || "preview",
		title: blog.title || "",
		description: blog.description || "",
		blocks: (blog.blocks as BlogBlock[]) || [],
		featured: blog.featured || false,
		status: (blog.status as any) || "draft",
	};
}

export default function AdminEditBlogsPage() {
	const { usuario } = useAuth();
	const { currentColors } = useTheme();
	const [blogs, setBlogs] = useState<Blog[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [editingBlog, setEditingBlog] = useState<EditableBlog | null>(null);
	const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">(
		"desktop"
	);
	const [showPreviewModal, setShowPreviewModal] = useState(false);
	const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
	const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
	const [draggedBlogIndex, setDraggedBlogIndex] = useState<number | null>(null);

	useEffect(() => {
		async function load() {
			if (!usuario?.uid) return;
			
			setLoading(true);
			const userBlogs = await getBlogsByUsuario(usuario.uid);
			setBlogs(userBlogs);
			if (userBlogs.length > 0) {
				setSelectedId(userBlogs[0].id);
				setEditingBlog(userBlogs[0]);
			} else {
				setSelectedId(null);
				setEditingBlog(createEmptyBlog());
			}
			setLoading(false);
		}
		load();
	}, [usuario?.uid]);

	const handleSelectBlog = (blog: Blog) => {
		setSelectedId(blog.id);
		setEditingBlog(blog);
	};

	const handleNewBlog = () => {
		setSelectedId(null);
		setEditingBlog(createEmptyBlog());
	};

	const updateEditingField = (
		field: keyof EditableBlog,
		value: string | boolean | "draft" | "published"
	) => {
		setEditingBlog((prev) => (prev ? { ...prev, [field]: value } : prev));
	};

	const addBlock = (type: BlogBlockType) => {
		const newBlock: BlogBlock = {
			id: createBlockId(),
			type,
			content: type === "subtitle" ? "Nuevo subtítulo" : "",
			style: {},
		};
		setEditingBlog((prev) =>
			prev ? { ...prev, blocks: [...(prev.blocks || []), newBlock] } : prev
		);
	};

	const updateBlock = (
		index: number,
		updateFn: (block: BlogBlock) => BlogBlock
	) => {
		setEditingBlog((prev) => {
			if (!prev || !Array.isArray(prev.blocks)) return prev;
			const blocks = [...prev.blocks];
			blocks[index] = updateFn(blocks[index] as BlogBlock);
			return { ...prev, blocks };
		});
	};

	const removeBlock = (index: number) => {
		setEditingBlog((prev) => {
			if (!prev || !Array.isArray(prev.blocks)) return prev;
			const blocks = [...prev.blocks];
			blocks.splice(index, 1);
			return { ...prev, blocks };
		});
	};

	const moveBlock = (index: number, direction: -1 | 1) => {
		setEditingBlog((prev) => {
			if (!prev || !Array.isArray(prev.blocks)) return prev;
			const blocks = [...prev.blocks];
			const newIndex = index + direction;
			if (newIndex < 0 || newIndex >= blocks.length) return prev;
			[blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];
			return { ...prev, blocks };
		});
	};

	const handleBlockDragStart = (e: React.DragEvent, index: number) => {
		setDraggedBlockIndex(index);
		e.dataTransfer.effectAllowed = "move";
	};

	const handleBlockDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const handleBlockDrop = (e: React.DragEvent, targetIndex: number) => {
		e.preventDefault();
		if (draggedBlockIndex === null || draggedBlockIndex === targetIndex) return;

		setEditingBlog((prev) => {
			if (!prev || !Array.isArray(prev.blocks)) return prev;
			const blocks = [...prev.blocks];
			const draggedBlock = blocks[draggedBlockIndex];
			
			// Remover dragged block
			blocks.splice(draggedBlockIndex, 1);
			
			// Ajustar índice destino después de remover
			const adjustedTargetIndex = draggedBlockIndex < targetIndex ? targetIndex - 1 : targetIndex;
			
			// Insertar en nueva posición
			blocks.splice(adjustedTargetIndex, 0, draggedBlock);
			
			return { ...prev, blocks };
		});
		
		setDraggedBlockIndex(null);
	};

	const handleBlogDragStart = (e: React.DragEvent, index: number) => {
		setDraggedBlogIndex(index);
		e.dataTransfer.effectAllowed = "move";
	};

	const handleBlogDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const handleBlogDrop = async (e: React.DragEvent, targetIndex: number) => {
		e.preventDefault();
		if (draggedBlogIndex === null || draggedBlogIndex === targetIndex) return;

		const draggedBlog = blogs[draggedBlogIndex];
		const updated = [...blogs];
		
		// Remover dragged blog
		updated.splice(draggedBlogIndex, 1);
		
		// Ajustar índice destino después de remover
		const adjustedTargetIndex = draggedBlogIndex < targetIndex ? targetIndex - 1 : targetIndex;
		
		// Insertar en nueva posición
		updated.splice(adjustedTargetIndex, 0, draggedBlog);
		
		// Guardar nuevo orden en la BD
		await updateBlogPositions(updated.map(b => b.id));
		
		// Actualizar estado local
		setBlogs(updated);
		setDraggedBlogIndex(null);
	};

	const updateBlockStyle = (
		index: number,
		key: keyof BlogFieldStyle,
		value: string
	) => {
		updateBlock(index, (block) => ({
			...block,
			style: {
				...(block.style || {}),
				[key]: value || undefined,
			},
		}));
	};

	const handleImageFileChange = async (
		index: number,
		e: ChangeEvent<HTMLInputElement>
	) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const blockId = (editingBlog?.blocks as BlogBlock[] | undefined)?.[index]?.id;
		if (!blockId) return;
		try {
			setUploadingBlockId(blockId);
			const path = `blogs/${Date.now()}-${file.name}`;
			const url = await uploadImageAndGetUrl(file, path);
			updateBlock(index, (block) => ({ ...block, url } as BlogBlock));
		} finally {
			setUploadingBlockId(null);
		}
	};

	const handleDeleteBlog = async (id: string) => {
		if (!confirm("¿Eliminar este blog? Esta acción no se puede deshacer.")) {
			return;
		}
		setSaving(true);
		await deleteBlog(id);
		const remaining = blogs.filter((b) => b.id !== id);
		setBlogs(remaining);
		if (selectedId === id) {
			if (remaining.length > 0) {
				setSelectedId(remaining[0].id);
				setEditingBlog(remaining[0]);
			} else {
				setSelectedId(null);
				setEditingBlog(createEmptyBlog());
			}
		}
		setSaving(false);
	};

	const handleSave = async (statusOverride?: "draft" | "published") => {
		if (!editingBlog || !usuario?.uid) return;
		setSaving(true);
		const payload: EditableBlog = {
			id: editingBlog.id,
			title: editingBlog.title || "",
			description: editingBlog.description || "",
			blocks: (editingBlog.blocks as BlogBlock[]) || [],
			status: statusOverride || (editingBlog.status as any) || "draft",
			featured: editingBlog.featured || false,
			usuarioId: usuario.uid,
		};

		const saved = await saveBlog(payload as any);

		setBlogs((prev) => {
			const exists = prev.some((b) => b.id === saved.id);
			if (exists) {
				return prev.map((b) => (b.id === saved.id ? saved : b));
			}
			return [saved, ...prev];
		});

		setSelectedId(saved.id);
		setEditingBlog(saved);
		setSaving(false);
	};

	const handleMakeFeatured = async () => {
		if (!editingBlog?.id) {
			alert("Primero guarda o publica el blog antes de destacarlo.");
			return;
		}
		setSaving(true);
		
		try {
			if (editingBlog.featured) {
				await removeFeaturedBlog();
				setBlogs((prev) =>
					prev.map((b) => ({ ...b, featured: false }))
				);
				setEditingBlog((prev) => (prev ? { ...prev, featured: false } : prev));
			} else {
				await setFeaturedBlog(editingBlog.id);
				setBlogs((prev) =>
					prev.map((b) => ({ ...b, featured: b.id === editingBlog.id }))
				);
				setEditingBlog((prev) => (prev ? { ...prev, featured: true } : prev));
			}
		} catch (error) {
			console.error("Error al cambiar destacado:", error);
			alert("Error al cambiar el estado destacado del blog.");
		} finally {
			setSaving(false);
		}
	};

	const previewBlog = editingBlog ? toPreviewBlog(editingBlog) : null;

	// Verificar si el usuario está autenticado
	if (!usuario || !currentColors) {
		return (
			<div 
				style={{
					backgroundColor: currentColors?.bgPrimary || '#f9fafb',
				}}
				className="min-h-screen flex items-center justify-center"
			>
				<div className="text-center">
					<h2 
						style={{
							color: currentColors?.textPrimary || '#111827',
						}}
						className="text-xl font-semibold mb-2"
					>
						Acceso restringido
					</h2>
					<p 
						style={{
							color: currentColors?.textSecondary || '#6b7280',
						}}
						className="mb-4"
					>
						Debes iniciar sesión para acceder al editor de blogs.
					</p>
					<a
						href="/login"
						style={{
							backgroundColor: currentColors?.accentColor || '#2563eb',
							color: currentColors?.buttonText || '#ffffff',
						}}
						className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
					>
						Iniciar sesión
					</a>
				</div>
			</div>
		);
	}

	return (
		<div 
			style={{
				backgroundColor: currentColors.bgPrimary,
				color: currentColors.textPrimary,
			}}
			className="min-h-screen flex flex-col"
		>
			<div className="flex-1 w-full py-6 sm:py-12 px-4 pt-4 pb-24">
				<div className="flex flex-col gap-2 mb-4">
					<h1 
						style={{
							color: currentColors.textPrimary,
						}}
						className="text-2xl font-bold tracking-tight"
					>
						Editor de blogs
					</h1>
					<p 
						style={{
							color: currentColors.textSecondary,
						}}
						className="text-sm max-w-2xl"
					>
						Crea y edita artículos del blog usando bloques de subtítulos, párrafos e
						imágenes, con previsualización en vivo para desktop y móvil.
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-6 mt-4">
					{/* Editor y lista de blogs */}
					<section className="space-y-4">
						{/* Lista de blogs */}
						<div 
							style={{
								backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#ffffff' : currentColors.bgSecondary,
								borderColor: currentColors.bgPrimary === '#ffffff' ? currentColors.borderColor : 'rgba(255, 255, 255, 0.08)',
							}}
							className="rounded-2xl border overflow-hidden"
						>
							<div 
								style={{
									borderColor: currentColors.bgPrimary === '#ffffff' ? currentColors.borderColor : 'rgba(255, 255, 255, 0.08)',
								}}
								className="flex items-center justify-between px-4 py-3 border-b"
							>
								<div className="flex items-center gap-2">
									<span 
										style={{
											color: currentColors.textSecondary,
										}}
									>{Icons.article}</span>
									<h2 
										style={{
											color: currentColors.textPrimary,
										}}
										className="font-semibold text-sm"
									>Blogs existentes</h2>
								</div>
								<button
									onClick={handleNewBlog}
									style={{
										backgroundColor: currentColors.accentColor,
										color: currentColors.buttonText,
									}}
									className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full"
								>
									<span>{Icons.add}</span>
									Nuevo blog
								</button>
							</div>
							<div className="max-h-64 overflow-auto divide-y" style={{ borderColor: currentColors.bgPrimary === '#ffffff' ? currentColors.borderColor : 'rgba(255, 255, 255, 0.05)' }}>
								{loading ? (
									<div className="px-4 py-4 text-sm" style={{ color: currentColors.textSecondary }}>
										Cargando blogs...
									</div>
								) : blogs.length === 0 ? (
									<div className="px-4 py-4 text-sm" style={{ color: currentColors.textSecondary }}>
										No hay blogs aún. Crea el primero.
									</div>
								) : (
									blogs.map((b, blogIndex) => (
										<div
											key={b.id}
											draggable
											onDragStart={(e) => handleBlogDragStart(e, blogIndex)}
											onDragOver={handleBlogDragOver}
											onDrop={(e) => handleBlogDrop(e, blogIndex)}
											onDragEnd={() => setDraggedBlogIndex(null)}
											className={`flex items-center justify-between px-4 py-3 text-sm cursor-pointer transition-all ${
												selectedId === b.id
													? "opacity-90"
													: "hover:opacity-80"
											} ${
												draggedBlogIndex === blogIndex
													? "opacity-50 scale-95"
													: ""
											}`}
											style={{
												backgroundColor: selectedId === b.id ? currentColors.accentColor + '20' : 'transparent',
											}}
											onClick={() => handleSelectBlog(b)}
										>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2">
													<span className="truncate font-medium" style={{ color: currentColors.textPrimary }}>
														{b.title || "(Sin título)"}
													</span>
													{b.featured && (
														<span 
															style={{
																backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#fef3c7' : 'rgba(245, 158, 11, 0.1)',
																color: '#f59e0b',
															}}
															className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
														>
															<span className="text-sm">{Icons.star}</span>
															Destacado
														</span>
													)}
												</div>
												<div className="flex items-center gap-2 mt-0.5 text-xs">
													<span
														style={{
															borderColor: b.status === "published" ? '#10b981' : currentColors.borderColor,
															color: b.status === "published" ? '#10b981' : currentColors.textSecondary,
														}}
														className="inline-flex items-center px-1.5 py-0.5 rounded-full border text-[11px]"
													>
														{b.status === "published" ? "Publicado" : "Borrador"}
													</span>
												</div>
											</div>
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteBlog(b.id);
												}}
												style={{ color: '#ef4444' }}
												className="ml-3 text-xs hover:opacity-80"
											>
												Eliminar
											</button>
										</div>
									))
								)}
							</div>
						</div>

						{/* Formulario de edición */}
						<div 
							style={{
								backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#ffffff' : currentColors.bgSecondary,
								borderColor: currentColors.bgPrimary === '#ffffff' ? currentColors.borderColor : 'rgba(255, 255, 255, 0.08)',
							}}
							className="rounded-2xl border p-4 md:p-5 space-y-4"
						>
							{!editingBlog ? (
								<p style={{ color: currentColors.textSecondary }} className="text-sm">
									Selecciona un blog de la lista o crea uno nuevo.
								</p>
							) : (
								<>
									<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
										<div className="flex-1 min-w-0">
											<label style={{ color: currentColors.textSecondary }} className="block text-xs font-semibold mb-1">
												Título del blog
											</label>
											<input
												type="text"
												value={editingBlog.title || ""}
												onChange={(e) => updateEditingField("title", e.target.value)}
												style={{
													backgroundColor: currentColors.bgPrimary,
													borderColor: currentColors.borderColor,
													color: currentColors.textPrimary,
												}}
												className="w-full px-3 py-2 rounded-lg border text-sm"
												placeholder="Ej. Novedades en tecnología para este mes"
											/>
										</div>
										<div className="flex flex-col items-start gap-2 mt-3 md:mt-0 md:ml-4">
											{editingBlog.id && editingBlog.featured && (
												<span 
													style={{
														backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#fef3c7' : 'rgba(245, 158, 11, 0.1)',
														color: '#f59e0b',
													}}
													className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
												>
													<span className="text-xs">{Icons.star}</span>
													Este es el blog destacado
												</span>
											)}
											<button
												type="button"
												onClick={handleMakeFeatured}
												disabled={!editingBlog.id || saving}
												style={{
													borderColor: editingBlog.featured ? '#ef4444' : '#f59e0b',
													color: editingBlog.featured ? '#ef4444' : '#f59e0b',
												}}
												className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
											>
												<span className="text-sm">{editingBlog.featured ? Icons.star_off : Icons.star}</span>
												{editingBlog.featured ? "Quitar destacado" : "Marcar como destacado"}
											</button>
										</div>
									</div>

									<div>
										<label style={{ color: currentColors.textSecondary }} className="block text-xs font-semibold mb-1">
											Descripción corta (se muestra en la lista de artículos)
										</label>
										<textarea
											value={editingBlog.description || ""}
											onChange={(e) => updateEditingField("description", e.target.value)}
											style={{
												backgroundColor: currentColors.bgPrimary,
												borderColor: currentColors.borderColor,
												color: currentColors.textPrimary,
											}}
											className="w-full px-3 py-2 rounded-lg border text-sm min-h-[60px]"
											placeholder="Resumen breve del contenido del blog."
										/>
									</div>

									<div className="flex flex-wrap gap-2 text-xs">
										<button
											type="button"
											onClick={() => addBlock("subtitle")}
											style={{
												backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#f1f5f9' : currentColors.bgSecondary,
												color: currentColors.textPrimary,
											}}
											className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full hover:opacity-80"
										>
											<span className="text-sm">{Icons.title}</span>
											Subtítulo
										</button>
										<button
											type="button"
											onClick={() => addBlock("paragraph")}
											style={{
												backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#f1f5f9' : currentColors.bgSecondary,
												color: currentColors.textPrimary,
											}}
											className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full hover:opacity-80"
										>
											<span className="text-sm">{Icons.notes}</span>
											Párrafo
										</button>
										<button
											type="button"
											onClick={() => addBlock("image")}
											style={{
												backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#f1f5f9' : currentColors.bgSecondary,
												color: currentColors.textPrimary,
											}}
											className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full hover:opacity-80"
										>
											<span className="text-sm">{Icons.image}</span>
											Imagen
										</button>
									</div>

									<div className="space-y-3 max-h-[420px] overflow-auto pr-1">
										{Array.isArray(editingBlog.blocks) &&
										(editingBlog.blocks as BlogBlock[]).length > 0 ? (
											(editingBlog.blocks as BlogBlock[]).map((block, index) => (
												<div
													key={block.id || index}
													style={{
														borderColor: currentColors.borderColor,
														backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#f8fafc' : currentColors.bgSecondary,
													}}
													className={`border rounded-xl p-3 transition-all ${
														draggedBlockIndex === index
															? "opacity-50 scale-95"
															: "hover:opacity-80"
													}`}
												>
													<div className="flex items-center justify-between mb-2">
														<div 
															draggable
															onDragStart={(e) => handleBlockDragStart(e, index)}
															onDragOver={handleBlockDragOver}
															onDrop={(e) => handleBlockDrop(e, index)}
															onDragEnd={() => setDraggedBlockIndex(null)}
															className="flex items-center gap-2 text-xs font-semibold cursor-move"
															style={{ color: currentColors.textSecondary }}
														>
															<span 
																style={{
																	backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#e2e8f0' : currentColors.bgSecondary,
																}}
																className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px]"
															>
																{index + 1}
															</span>
															<span>
																{block.type === "subtitle"
																	? "Subtítulo"
																	: block.type === "paragraph"
																	? "Párrafo"
																	: "Imagen"}
															</span>
														</div>
														<div className="flex items-center gap-1">
															<button
																type="button"
																style={{ color: currentColors.textSecondary }}
																className="p-1 rounded hover:opacity-80"
																onClick={() => moveBlock(index, -1)}
															>
																<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
																	<path d="M0 0h24v24H0V0z" fill="none" />
																	<path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.59 5.59L20 12l-8-8-8 8z" />
																</svg>
															</button>
															<button
																type="button"
																style={{ color: currentColors.textSecondary }}
																className="p-1 rounded hover:opacity-80"
																onClick={() => moveBlock(index, 1)}
															>
																<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
																	<path d="M0 0h24v24H0V0z" fill="none" />
																	<path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" />
																</svg>
															</button>
															<button
																type="button"
																style={{ color: '#ef4444' }}
																className="p-1 rounded hover:opacity-80"
																onClick={() => removeBlock(index)}
															>
																<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
																	<path d="M0 0h24v24H0V0z" fill="none" />
																	<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
																</svg>
															</button>
														</div>
													</div>

													{block.type === "subtitle" && (
														<input
															type="text"
															value={block.content || ""}
															onChange={(e) =>
																updateBlock(index, (b) => ({ ...b, content: e.target.value }))
															}
															style={{
																backgroundColor: currentColors.bgPrimary,
																borderColor: currentColors.borderColor,
																color: currentColors.textPrimary,
																fontSize: block.style?.fontSize || '18px',
																fontWeight: block.style?.fontWeight || '600',
															}}
															className="w-full px-3 py-2 rounded-lg border"
															placeholder="Escribe el subtítulo..."
														/>
													)}

													{block.type === "paragraph" && (
														<textarea
															value={block.content || ""}
															onChange={(e) =>
																updateBlock(index, (b) => ({ ...b, content: e.target.value }))
															}
															style={{
																backgroundColor: currentColors.bgPrimary,
																borderColor: currentColors.borderColor,
																color: currentColors.textPrimary,
																fontSize: block.style?.fontSize || '14px',
															}}
															className="w-full px-3 py-2 rounded-lg border min-h-[80px]"
															placeholder="Escribe el párrafo..."
														/>
													)}

													{block.type === "image" && (
														<div className="space-y-2">
															{block.url ? (
																<div className="relative">
																	<img
																		src={block.url}
																		alt="Imagen del blog"
																		className="w-full rounded-lg"
																		style={{ maxHeight: "200px", objectFit: "cover" }}
																	/>
																	</div>
															) : (
																<div
																	style={{
																		backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#f8fafc' : currentColors.bgSecondary,
																		borderColor: currentColors.borderColor,
																	}}
																	className="w-full h-32 rounded-lg border flex items-center justify-center"
																>
																	<span style={{ color: currentColors.textSecondary }}>
																		{Icons.image}
																	</span>
																</div>
															)}
															<input
																type="file"
																accept="image/*"
																onChange={(e) => handleImageFileChange(index, e)}
																className="w-full text-sm"
															/>
														</div>
													)}
												</div>
											))
										) : (
											<div
												style={{
													backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#f8fafc' : currentColors.bgSecondary,
													borderColor: currentColors.borderColor,
												}}
												className="border rounded-xl p-8 text-center"
											>
												<span style={{ color: currentColors.textSecondary }}>
													{Icons.notes}
												</span>
												<p style={{ color: currentColors.textSecondary }} className="mt-2 text-sm">
													Agrega bloques para empezar a escribir
												</p>
											</div>
										)}
									</div>

									<div 
								style={{
									borderColor: currentColors.bgPrimary === '#ffffff' ? currentColors.borderColor : 'rgba(255, 255, 255, 0.08)',
								}}
								className="flex gap-2 pt-4 border-t"
							>
										<button
											type="button"
											onClick={() => handleSave("draft")}
											disabled={saving}
											style={{
												backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#e2e8f0' : currentColors.bgSecondary,
												color: currentColors.textPrimary,
											}}
											className="flex-1 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
										>
											{saving ? "Guardando..." : "Guardar borrador"}
										</button>
										<button
											type="button"
											onClick={() => handleSave("published")}
											disabled={saving}
											style={{
												backgroundColor: currentColors.accentColor,
												color: currentColors.buttonText,
											}}
											className="flex-1 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
										>
											{saving ? "Publicando..." : "Publicar"}
										</button>
									</div>
								</>
							)}
						</div>
					</section>

					{/* Previsualización */}
					<section 
						style={{
							backgroundColor: currentColors.bgPrimary === '#ffffff' ? '#ffffff' : currentColors.bgSecondary,
							borderColor: currentColors.bgPrimary === '#ffffff' ? currentColors.borderColor : 'rgba(255, 255, 255, 0.08)',
						}}
						className="rounded-2xl border overflow-hidden"
					>
						<div 
							style={{
								borderColor: currentColors.bgPrimary === '#ffffff' ? currentColors.borderColor : 'rgba(255, 255, 255, 0.08)',
							}}
							className="flex items-center justify-between px-4 py-3 border-b"
						>
							<div className="flex items-center gap-2 text-sm">
								<span style={{ color: currentColors.textSecondary }}>
									{Icons.visibility}
								</span>
								<span style={{ color: currentColors.textPrimary }}>Vista previa</span>
							</div>
							<div className="flex items-center gap-2 text-xs">
								<div 
										style={{
									borderColor: currentColors.bgPrimary === '#ffffff' ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
								}}
								className="inline-flex items-center rounded-full p-0.5"
							>
									<button
										type="button"
										onClick={() => setPreviewDevice("desktop")}
										style={{
											backgroundColor: previewDevice === "desktop" ? currentColors.bgPrimary : 'transparent',
											color: previewDevice === "desktop" ? currentColors.textPrimary : currentColors.textSecondary,
										}}
										className={`px-2.5 py-1 rounded-full flex items-center gap-1`}
									>
										<span className="text-sm">{Icons.desktop_windows}</span>
										Desktop
									</button>
									<button
										type="button"
										onClick={() => setPreviewDevice("mobile")}
										style={{
											backgroundColor: previewDevice === "mobile" ? currentColors.bgPrimary : 'transparent',
											color: previewDevice === "mobile" ? currentColors.textPrimary : currentColors.textSecondary,
										}}
										className={`px-2.5 py-1 rounded-full flex items-center gap-1`}
									>
										<span className="text-sm">{Icons.phone_iphone}</span>
										Móvil
									</button>
								</div>
							</div>
						</div>
						<div 
							style={{
								backgroundColor: currentColors.bgPrimary,
							}}
							className="p-4"
						>
							{previewBlog ? (
								<BlogPreview blog={previewBlog} device={previewDevice} />
							) : (
								<div className="text-center py-12" style={{ color: currentColors.textSecondary }}>
									<span className="text-4xl">{Icons.visibility_off}</span>
									<p className="mt-2">Selecciona un blog para ver la vista previa</p>
								</div>
							)}
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
