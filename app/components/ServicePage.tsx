'use client';

import Link from 'next/link';
import styles from '@/app/styles/service.module.css';

interface PlanFeature {
  icon: string;
  text: string;
}

interface Plan {
  name: string;
  price: number;
  description: string;
  deliveryTime: string;
  features: PlanFeature[];
  adminFeatures?: PlanFeature[];
  extraInfo: string;
  isNew?: boolean;
  whatsappText: string;
}

export default function ServicePage() {
  const plans: Plan[] = [
    {
      name: 'Plan Premium',
      price: 350,
      description: 'Tienda virtual completa con todas las herramientas esenciales para administrar tu negocio online.',
      deliveryTime: '3-5 días laborales',
      features: [
        { icon: 'fa-solid fa-store', text: 'Página de productos profesional' },
        { icon: 'fa-solid fa-search', text: 'Buscador avanzado de productos' },
        { icon: 'fa-solid fa-blog', text: 'Sistema de blogs integrado' },
        { icon: 'fa-solid fa-shopping-cart', text: 'Carrito de compras completo' },
      ],
      adminFeatures: [
        { icon: 'fa-solid fa-cog', text: 'Panel de administrador completo' },
        { icon: 'fa-solid fa-pen-to-square', text: 'Administración de blogs' },
        { icon: 'fa-solid fa-boxes-stacked', text: 'Administración de inventario de productos' },
        { icon: 'fa-solid fa-chart-line', text: 'Estadísticas y reportes de ventas' },
      ],
      extraInfo: 'Plan perfecto para negocios que quieren administrar su tienda online de forma profesional y eficiente.',
      whatsappText: 'Hola!%20Quiero%20el%20Plan%20Premium%20de%20tienda%20virtual'
    },
    {
      name: 'Plan Avanzado',
      price: 550,
      description: 'Todo lo del Plan Premium más cuenta para clientes con funcionalidades avanzadas de gestión.',
      deliveryTime: '7-10 días laborales',
      features: [
        { icon: 'fa-solid fa-store', text: 'Página de productos profesional' },
        { icon: 'fa-solid fa-search', text: 'Buscador avanzado de productos' },
        { icon: 'fa-solid fa-blog', text: 'Sistema de blogs integrado' },
        { icon: 'fa-solid fa-shopping-cart', text: 'Carrito de compras completo' },
        { icon: 'fa-solid fa-user-circle', text: 'Cuenta para clientes' },
        { icon: 'fa-solid fa-heart', text: 'Guardado de productos favoritos' },
        { icon: 'fa-solid fa-box', text: 'Historial de pedidos' },
        { icon: 'fa-solid fa-sync', text: 'Actualización de estado de pedidos' },
      ],
      adminFeatures: [
        { icon: 'fa-solid fa-cog', text: 'Panel de administrador completo' },
        { icon: 'fa-solid fa-pen-to-square', text: 'Administración de blogs' },
        { icon: 'fa-solid fa-boxes-stacked', text: 'Administración de inventario de productos' },
        { icon: 'fa-solid fa-chart-line', text: 'Estadísticas y reportes de ventas' },
        { icon: 'fa-solid fa-users', text: 'Gestión de cuentas de clientes' },
        { icon: 'fa-solid fa-clipboard-list', text: 'Administración de pedidos de clientes' },
      ],
      extraInfo: 'La solución completa para negocios que quieren ofrecer la mejor experiencia a sus clientes con todas las herramientas avanzadas.',
      isNew: true,
      whatsappText: 'Hola!%20Quiero%20el%20Plan%20Avanzado%20de%20tienda%20virtual'
    }
  ];

  return (
    <main>
      {/* Hero Section */}
      <section className={styles['service-hero']}>
        <div className={styles['hero-content']}>
          <h1>Nuestros Servicios</h1>
          <p>Transformamos tu idea en una tienda virtual profesional, moderna y totalmente funcional.</p>
        </div>
      </section>

      {/* Plans Section */}
      <section className={styles['plans-section']}>
        <h2 className={styles['section-title']}>Planes Disponibles</h2>
        <p className={styles['section-subtitle']}>Elige el plan que mejor se adapte a tu negocio</p>

        <div className={styles['plans-container']}>
          {plans.map((plan, index) => (
            <div key={index} className={`${styles['plan-card']} ${plan.isNew ? styles.featured : ''}`}>
              {plan.isNew && <div className={styles.tag}>Nuevo</div>}
              
              <h3>{plan.name}</h3>
              <p className={styles['delivery-time']}>{plan.deliveryTime}</p>
              <p className={styles['plan-price']}>${plan.price}</p>
              <p className={styles['plan-desc']}>{plan.description}</p>

              <h4>Incluye:</h4>
              <ul>
                {plan.features.map((feature, idx) => (
                  <li key={idx}>
                    <i className={feature.icon}></i> {feature.text}
                  </li>
                ))}
              </ul>

              {plan.adminFeatures && (
                <>
                  <h4>Administrador:</h4>
                  <ul>
                    {plan.adminFeatures.map((feature, idx) => (
                      <li key={idx}>
                        <i className={feature.icon}></i> {feature.text}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <p className={styles['extra-info']}>{plan.extraInfo}</p>

              <a
                href={`https://wa.me/593963328168?text=${plan.whatsappText}`}
                className={styles['plan-btn']}
              >
                Solicitar Plan
              </a>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
