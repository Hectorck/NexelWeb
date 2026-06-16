"use client";

import React, { useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500&display=swap');

  @keyframes proj-fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes proj-lineGrow {
    from { width: 0; }
    to   { width: 48px; }
  }

  @keyframes proj-glowPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(0,191,255,0); }
    50%       { box-shadow: 0 0 24px 4px rgba(0,191,255,0.18); }
  }

  /* ── sección wrapper ── */
  .proj-section {
    background-color: #141313;
    padding: 80px 10%;
    color: white;
    font-family: 'Inter', sans-serif;
  }

  /* ── header ── */
  .proj-header {
    text-align: center;
    margin-bottom: 64px;
    animation: proj-fadeUp 0.6s ease forwards;
  }

  .proj-eyebrow {
    display: inline-block;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #00bfff;
    margin-bottom: 14px;
  }

  .proj-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 16px;
    line-height: 1.15;
  }

  .proj-title span {
    color: #00bfff;
  }

  .proj-subtitle {
    font-size: 1.05rem;
    color: #888;
    max-width: 480px;
    margin: 0 auto;
    line-height: 1.65;
  }

  /* ── filtros ── */
  .proj-filters {
    display: flex;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 52px;
    animation: proj-fadeUp 0.6s ease 0.1s both forwards;
    opacity: 0;
  }

  .proj-filter-btn {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 8px 20px;
    border-radius: 50px;
    border: 1px solid #2a2a2a;
    background: transparent;
    color: #666;
    cursor: pointer;
    transition: all 0.25s;
  }

  .proj-filter-btn:hover {
    border-color: #00bfff;
    color: #00bfff;
  }

  .proj-filter-btn.active {
    background: #00bfff;
    border-color: #00bfff;
    color: #000;
  }

  /* ── grid ── */
  .proj-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 28px;
  }

  @media (max-width: 768px) {
    .proj-grid {
      grid-template-columns: 1fr;
    }
    .proj-section {
      padding: 60px 5%;
    }
  }

  /* ── card ── */
  .proj-card {
    position: relative;
    border-radius: 20px;
    border: 1px solid #1f1f1f;
    background: #181818;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .proj-card:hover {
    border-color: #00bfff44;
    animation: proj-glowPulse 2.5s ease infinite;
  }

  /* ── imagen mock ── */
  .proj-img {
    position: relative;
    height: 210px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .proj-img-bg {
    width: 100%;
    height: 100%;
    transition: transform 0.5s ease;
  }

  .proj-card:hover .proj-img-bg {
    transform: scale(1.04);
  }

  /* ── tag tipo ── */
  .proj-tag {
    position: absolute;
    top: 14px;
    left: 14px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: 50px;
    backdrop-filter: blur(8px);
  }

  /* ── año ── */
  .proj-year {
    position: absolute;
    top: 14px;
    right: 14px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: rgba(255,255,255,0.6);
    background: rgba(0,0,0,0.45);
    padding: 4px 10px;
    border-radius: 50px;
    backdrop-filter: blur(8px);
  }

  /* ── info ── */
  .proj-info {
    padding: 24px 26px 26px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
  }

  .proj-name {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.2rem;
    font-weight: 700;
    color: #fff;
    margin: 0;
    line-height: 1.2;
  }

  .proj-desc {
    font-size: 0.88rem;
    color: #777;
    line-height: 1.6;
    margin: 0;
  }

  /* ── tech stack ── */
  .proj-stack {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
  }

  .proj-tech {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid #2a2a2a;
    color: #555;
    text-transform: uppercase;
  }

  /* ── footer card ── */
  .proj-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 26px 22px;
    border-top: 1px solid #1f1f1f;
    margin-top: auto;
  }

  .proj-link {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #00bfff;
    text-decoration: none;
    transition: gap 0.2s;
  }

  .proj-link:hover {
    gap: 11px;
  }

  .proj-link svg {
    width: 14px;
    height: 14px;
    transition: transform 0.2s;
  }

  .proj-link:hover svg {
    transform: translateX(3px);
  }

  .proj-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 8px #22c55e88;
    flex-shrink: 0;
  }

  .proj-live-label {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: #22c55e;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* ── CTA final ── */
  .proj-cta {
    text-align: center;
    margin-top: 64px;
    animation: proj-fadeUp 0.6s ease 0.5s both forwards;
    opacity: 0;
  }

  .proj-cta p {
    color: #555;
    font-size: 0.95rem;
    margin-bottom: 20px;
  }

  .proj-cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: transparent;
    border: 1px solid #00bfff55;
    color: #00bfff;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 14px 32px;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.3s;
  }

  .proj-cta-btn:hover {
    background: #00bfff;
    color: #000;
    border-color: #00bfff;
    box-shadow: 0 0 24px rgba(0,191,255,0.3);
  }

  /* ── accesibilidad ── */
  @media (prefers-reduced-motion: reduce) {
    .proj-card, .proj-header, .proj-filters, .proj-cta {
      animation: none;
      opacity: 1;
    }
  }
`;

type Project = {
  id: string;
  name: string;
  desc: string;
  category: string;
  tag: string;
  tagColor: string;
  tagBg: string;
  year: string;
  stack: string[];
  href: string;
  gradient: string;
  icon: string;
};

const PROJECTS: Project[] = [
  {
    id: "techno",
    name: "TechnoThings",
    desc: "E-commerce de tecnología gaming y componentes electrónicos. Catálogo filtrable, carrito y checkout integrado.",
    category: "E-commerce",
    tag: "Gaming & Tech",
    tagColor: "#a855f7",
    tagBg: "rgba(168,85,247,0.15)",
    year: "Marzo, 2026",
    stack: ["Next.js", "TypeScript", "Firebase", "Tailwind"],
    href: "https://www.tecnothings.com",
    gradient: "linear-gradient(135deg, #0f0c29 0%, #1a0533 50%, #24243e 100%)",
    icon: "🎮",
  },
  {
    id: "marca",
    name: "Marca Estilo",
    desc: "Tienda de camisetas de lujo para hombres. Diseño premium con pasarela de pagos Datafast y gestión de pedidos en Firebase.",
    category: "E-commerce",
    tag: "Moda de lujo",
    tagColor: "#dcb432",
    tagBg: "rgba(220,180,50,0.15)",
    year: "Mayo, 2026",
    stack: ["Next.js", "TypeScript", "Firebase", "Datafast"],
    href: "https://marca-estilo-41im.vercel.app/",
    gradient: "linear-gradient(135deg, #080808 0%, #1a1500 50%, #0d0d00 100%)",
    icon: "👔",
  },
  {
    id: "Cosmeticos y suninistros",
    name: "Tiffanys Suministros y variedades",
    desc: "Plataforma de venta de cosméticos y suministros de oficina. Catálogo doble con experiencia de compra unificada.",
    category: "E-commerce",
    tag: "Retail",
    tagColor: "#ec4899",
    tagBg: "rgba(236,72,153,0.15)",
    year: "2024",
    stack: ["React", "Node.js", "MongoDB", "Stripe"],
    href: "https://www.tiffanysec.com",
    gradient: "linear-gradient(135deg, #1a0010 0%, #2d0020 50%, #1a0830 100%)",
    icon: "💄",
  },
  {
    id: "samsung",
    name: "Samsung Ecuador",
    desc: "Desarrollo web para Samsung Ecuador. Experiencia de marca institucional con catálogo de productos y soporte al cliente.",
    category: "Corporativo",
    tag: "Corporativo",
    tagColor: "#00bfff",
    tagBg: "rgba(0,191,255,0.15)",
    year: "2023",
    stack: ["React", "TypeScript", "REST API", "CSS"],
    href: "https://www.samsungecuador.com",
    gradient: "linear-gradient(135deg, #001529 0%, #001f3f 50%, #00090f 100%)",
    icon: "📱",
  },
];

const CATEGORIES = ["Todos", "E-commerce", "Corporativo"];

export default function ProjectsPage() {
  const [active, setActive] = useState("Todos");

  const filtered =
    active === "Todos"
      ? PROJECTS
      : PROJECTS.filter((p) => p.category === active);

  return (
    <>
      <style>{styles}</style>
      <section className="proj-section">
        {/* Header */}
        <div className="proj-header">
          <span className="proj-eyebrow">Portafolio</span>
          <h1 className="proj-title">
            Proyectos que<br />
            <span>hablan por sí solos</span>
          </h1>
          <p className="proj-subtitle">
            Cada proyecto resuelve un problema real. Aquí algunos de los
            productos que he construido de inicio a fin.
          </p>
        </div>

        {/* Filtros */}
        <div className="proj-filters">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`proj-filter-btn${active === cat ? " active" : ""}`}
              onClick={() => setActive(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="proj-grid">
          {filtered.map((proj, i) => (
            <div
              key={proj.id}
              className="proj-card"
              style={{ animationDelay: `${i * 100 + 200}ms` }}
            >
              {/* Imagen / mock */}
              <div className="proj-img">
                <div
                  className="proj-img-bg"
                  style={{ background: proj.gradient }}
                >
                  {/* Decoración interna */}
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      gap: 12,
                      opacity: 0.85,
                    }}
                  >
                    <span style={{ fontSize: 52 }}>{proj.icon}</span>
                    <span
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.35)",
                      }}
                    >
                      {proj.name}
                    </span>
                    {/* líneas decorativas */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage:
                          "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(255,255,255,0.02) 28px, rgba(255,255,255,0.02) 29px)",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Tag */}
                <span
                  className="proj-tag"
                  style={{
                    color: proj.tagColor,
                    background: proj.tagBg,
                    border: `1px solid ${proj.tagColor}44`,
                  }}
                >
                  {proj.tag}
                </span>

                {/* Año */}
                <span className="proj-year">{proj.year}</span>
              </div>

              {/* Info */}
              <div className="proj-info">
                <h2 className="proj-name">{proj.name}</h2>
                <p className="proj-desc">{proj.desc}</p>
                <div className="proj-stack">
                  {proj.stack.map((tech) => (
                    <span key={tech} className="proj-tech">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="proj-card-footer">
                <span className="proj-live-label">
                  <span className="proj-dot" />
                  En producción
                </span>
                <a
                  href={proj.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="proj-link"
                >
                  Ver proyecto
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="proj-cta">
          <p>¿Tienes un proyecto en mente?</p>
          <a href="/contacto" className="proj-cta-btn">
            Hablemos
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </section>
    </>
  );
}