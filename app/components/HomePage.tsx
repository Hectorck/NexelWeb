'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from '@/app/styles/home.module.css';

export default function Home() {
  const [activeAdminView, setActiveAdminView] = useState('productos');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const adminViews = {
    productos: { id: 'img-productos', img: '/img/vistaProducto1.png', alt: 'Vista de Productos' },
    inventario: { id: 'img-inventario', img: '/img/vistaInventarios.png', alt: 'Vista de Inventario' },
    pedidos: { id: 'img-pedidos', img: '/img/vistaPedido.png', alt: 'Vista de Pedidos' },
  };



  const faqs = [
    {
      question: '¿Lo que desarrollan tiene algún límite?',
      answer: 'No, lo que creamos no tiene límite. Desarrollamos la tienda virtual que usted desea, completamente personalizada a sus ideas, estilo y objetivos de venta. Para esto le sugiero revisar la sección "Servicio" que se encuentra en la misma página'
    },
    {
      question: '¿Cuánto tiempo tarda en entregarse una tienda virtual?',
      answer: 'El tiempo depende de la complejidad del proyecto. En promedio, una tienda virtual se entrega en 5-7 días hábiles, con comunicación constante durante el proceso.'
    },
    {
      question: '¿Puedo administrar mi tienda yo mismo después?',
      answer: 'Sí. Una vez entregada, la tienda queda totalmente bajo su control. Además, le enseñamos cómo subir productos, cambiar precios, revisar pedidos fácilmente e incluso crear blogs desde su panel de administración.'
    },
    {
      question: '¿Ofrecen soporte técnico luego de la entrega?',
      answer: 'Claro. Incluimos un período de soporte gratuito de una semana posterior a la entrega para asegurarnos de que todo funcione correctamente y resolver cualquier duda que tenga. Pasado ese tiempo si se cobra un monto adicional al mes.'
    },
    {
      question: '¿Puedo pedir funciones extra más adelante?',
      answer: 'Por supuesto. Podemos añadir nuevas funciones en cualquier momento: integración con pagos, chat en vivo, análisis de ventas y mucho más. Eso sí, esas funciones requieren un pago extra.'
    }
  ];

  return (
    <main className={styles.main}>
      {/* Hero Section */}
      <section className={`${styles.section} ${styles['main-section']}`}>
        <div className={styles['text-main']}>
          <h1>TU NEGOCIO AL SIGUIENTE NIVEL</h1>
          <p>
            Creamos tiendas virtuales personalizadas, donde podrás crear productos,
            gestionar pedidos, transacciones de compras, etc. Y todo eso desde cualquier lugar.
          </p>
          <Link href="/pages/service" className={styles['main-btn']}>
            Conoce más aquí
          </Link>
        </div>

        <div className={styles['role-content']}>
          {/* Customer Role */}
          <div className={styles['role']}>
            <h1>Rol del cliente</h1>
            <div className={styles['role1-content']}>
              <div className={styles['role-item']}>
                <a href="#"><i className="fa-solid fa-magnifying-glass"></i><h2>Buscar</h2></a>
              </div>
              <div className={styles['role-item']}>
                <a href="#"><i className="fa-solid fa-cart-shopping"></i><h2>Comprar</h2></a>
              </div>
              <div className={styles['role-item']}>
                <a href="#"><i className="fa-solid fa-credit-card"></i><h2>Pagar</h2></a>
              </div>
              <div className={styles['role-item']}>
                <a href="#"><i className="fa-solid fa-bookmark"></i><h2>Guardar</h2></a>
              </div>
              <div className={styles['role-item']}>
                <a href="#"><i className="fa-solid fa-comment"></i><h2>Comentar</h2></a>
              </div>
            </div>
          </div>

          {/* Admin Role */}
          <div className={styles['role']}>
            <h1>Rol del administrador</h1>
            <div className={styles['role2-content']}>
              <div className={styles['role-item']}>
                <a href="#"><i className="fa-solid fa-user"></i><h2>Clientes</h2></a>
              </div>
              <div className={styles['role-item']}>
                <a href="#"><i className="fa-solid fa-box"></i><h2>Pedidos</h2></a>
              </div>
              <div className={styles['role-item']}>
                <a href="#"><i className="fa-solid fa-cubes"></i><h2>Productos</h2></a>
              </div>
              <div className={styles['role-item']}>
                <a href="#"><i className="fa-solid fa-money-bill"></i><h2>Transacciones</h2></a>
              </div>
              <div className={styles['role-item']}>
                <a href="#"><i className="fa-solid fa-blog"></i><h2>Blogs</h2></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Admin View Section */}
      <section className={styles['admin-view-section']}>
        <div className={styles['admin-view-container']}>
          <div className={styles['admin-view-buttons']}>
            {Object.entries(adminViews).map(([key]) => (
              <button
                key={key}
                className={`${styles['view-btn']} ${activeAdminView === key ? styles.active : ''}`}
                onClick={() => setActiveAdminView(key)}
              >
                Vista {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>

          <div className={styles['admin-view-images']}>
            {Object.entries(adminViews).map(([key, view]) => (
              <img
                key={key}
                id={view.id}
                src={view.img}
                alt={view.alt}
                className={`${styles['view-image']} ${activeAdminView === key ? styles.active : ''}`}
              />
            ))}
          </div>

          <div className={styles['admin-view-text']}>
            <h2>Con tu tienda virtual, tendrás el control total de tu negocio.</h2>
            <p>
              Crea, gestiona y haz crecer tus ventas sin depender de nadie.
              Todo desde una plataforma intuitiva, moderna y adaptada a ti.
            </p>
            <a
              href="https://wa.me/593963328168?text=¡Hola!%20Estoy%20interesado%20en%20una%20tienda%20virtual%20🚀"
              target="_blank"
              className={styles['cta-whatsapp']}
            >
              <i className="fa-brands fa-whatsapp"></i> Habla con nosotros
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className={styles['about-section']}>
        <div className={styles['about-container']}>
          <div className={styles['about-text']}>
            <h2>¿Quiénes somos?</h2>
            <p>
              Somos un grupo de <strong>3 desarrolladores</strong> con amplia experiencia creando
              <strong> tiendas virtuales</strong> para emprendedores que buscan vender más,
              atraer nuevos clientes y llevar su marca al siguiente nivel.
            </p>
          </div>
          <div className={styles['about-icon']}>
            <i className="fa-solid fa-users"></i>
          </div>
          <Link href="/pages/aboutus" className={styles['about-btn']}>
            Conoce más sobre nosotros
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles['faq-section']}>
        <div className={styles['faq-container']}>
          <h2>Preguntas Frecuentes</h2>
          <div className={styles['faq-list']}>
            {faqs.map((faq, index) => (
              <div key={index} className={styles['faq-item']}>
                <h3
                  className={styles['faq-question']}
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                >
                  {faq.question}
                  <i className={`fa-solid fa-chevron-${activeFaq === index ? 'up' : 'down'}`}></i>
                </h3>
                {activeFaq === index && (
                  <p className={styles['faq-answer']}>{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
