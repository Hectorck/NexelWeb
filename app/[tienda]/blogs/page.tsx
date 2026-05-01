"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loading3DIcon } from "../../components/Loading3DIcon";
import { getPublishedBlogs, getBlogsByUsuario } from "@/lib/blogs-db";
import type { Blog } from "@/lib/blog-types";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import { Icons } from "@/app/components/Icons";

export default function BlogsPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const { currentColors } = useTheme();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let data: Blog[];
      
      if (usuario?.uid) {
        // Si el usuario está autenticado, mostrar sus blogs (publicados y borradores)
        data = await getBlogsByUsuario(usuario.uid);
      } else {
        // Si no está autenticado, mostrar todos los blogs publicados
        data = await getPublishedBlogs();
      }
      
      setBlogs(data);
      setLoading(false);
    }
    load();
  }, [usuario?.uid]);

  const featured = blogs.find((b) => b.featured);
  const others = blogs.filter((b) => !b.featured);

  if (!currentColors) {
    return (
      <div className="flex items-center justify-center h-screen">
        Cargando...
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
      <main className="max-w-6xl mx-auto px-4 py-8 lg:px-6 flex-1">
        <h1 className="text-4xl font-bold mb-4" style={{ color: currentColors.textPrimary }}>
          {usuario ? "Mis Blogs" : "Blog de Tecno Things"}
        </h1>
        <p
          className="mb-12"
          style={{ color: currentColors.textSecondary }}
        >
          {usuario 
            ? "Gestiona tus artículos, tutoriales y noticias sobre tecnología" 
            : "Artículos, tutoriales y noticias sobre tecnología"
          }
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loading3DIcon />
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-12">
            <div 
              className="opacity-30 mb-4 flex justify-center"
              style={{ color: currentColors.textSecondary }}
            >
              <div className="text-6xl">
                {Icons.article}
              </div>
            </div>
            <h3 className="text-xl font-semibold mt-4" style={{ color: currentColors.textPrimary }}>
              {usuario ? "Aún no has creado ningún blog" : "No hay artículos disponibles"}
            </h3>
            <p className="mt-2" style={{ color: currentColors.textSecondary }}>
              {usuario 
                ? "Comienza creando tu primer artículo para compartir con tus clientes." 
                : "No hay artículos publicados en este momento."
              }
            </p>
            {usuario && (
              <a
                href="/mi-tienda/edit-blogs"
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-lg transition-colors"
                style={{ backgroundColor: currentColors.buttonBg, color: currentColors.buttonText }}
              >
                {Icons.add}
                Crear mi primer blog
              </a>
            )}
          </div>
        ) : (
          <>
            {featured && (
              <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4" style={{ color: currentColors.textPrimary }}>Blog destacado</h2>
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/blogs/${featured.id}`);
                  }}
                  className="w-full text-left rounded-2xl border overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition flex flex-col md:flex-row"
                  style={{ 
                    backgroundColor: currentColors.bgSecondary,
                    borderColor: currentColors.borderColor
                  }}
                >
                  {featured.blocks?.some((b) => b.type === "image") && (
                    <div className="w-full md:w-1/3 h-48 md:h-auto flex-shrink-0">
                      {featured.blocks
                        .find((b) => b.type === "image")
                        ?.type === "image" && (
                        <img
                          src={
                            featured.blocks.find((b) => b.type === "image")?.type === "image"
                              ? featured.blocks.find((b) => b.type === "image")?.url
                              : ""
                          }
                          alt={
                            featured.blocks.find((b) => b.type === "image")?.type === "image"
                              ? featured.blocks.find((b) => b.type === "image")?.alt || featured.title
                              : ""
                          }
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  )}
                  <div className="p-6 flex flex-col justify-center flex-1">
                    <h3 className="text-xl font-bold mb-2">{featured.title}</h3>
                    {featured.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
                        {featured.description}
                      </p>
                    )}
                    <div className="inline-flex items-center gap-1 text-sm text-purple-600 dark:text-purple-300 mt-1 w-fit">
                      <span className="material-icons-round text-base">visibility</span>
                      <span>Leer artículo completo</span>
                    </div>
                  </div>
                </button>
              </section>
            )}

            {others.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Todos los artículos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {others.map((b) => {
                    const imageBlock = b.blocks?.find((block) => block.type === "image");
                    return (
                      <article
                        key={b.id}
                        onClick={() => {
                          router.push(`/blogs/${b.id}`);
                        }}
                        className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition"
                      >
                        {imageBlock && imageBlock.type === "image" && (
                          <div className="w-full h-40 overflow-hidden">
                            <img
                              src={imageBlock.url}
                              alt={imageBlock.alt || b.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="text-lg font-semibold mb-2">{b.title}</h3>
                          {b.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-3 flex-1">
                              {b.description}
                            </p>
                          )}
                          <div className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-300 mt-auto">
                            <span className="material-icons-round text-sm">arrow_forward</span>
                            <span>Ver más</span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
