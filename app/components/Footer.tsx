'use client';

import Link from 'next/link';
import styles from '@/app/styles/footer.module.css';
import { useAuth } from '@/lib/AuthContext';

export default function Footer() {
  const { usuario } = useAuth();
  const isAuthenticated = !!usuario;

  return (
    <footer className={styles['main-footer']}>
      <div className={styles['footer-container']}>
        {/* Columna 1: Brand */}
        <div className={styles['footer-brand']}>
          <img src="/img/nl.png" alt="Nexel Logo" />
          <p>Tu negocio al siguiente nivel.</p>
        </div>

        {/* Columna 2: Links - Diferentes según autenticación */}
        <div className={styles['footer-links']}>
          <h4>{isAuthenticated ? 'Gestión' : 'Enlaces útiles'}</h4>
          <ul>
            {isAuthenticated ? (
              <>
                <li><Link href="/mi-tienda">Mi Tienda</Link></li>
                <li><Link href="/mi-tienda/inventario">Inventario</Link></li>
                <li><Link href="/mi-tienda/blogs">Crear Blogs</Link></li>
                <li>
                  <a href="https://wa.me/593963328168?text=Hola!%20Estoy%20interesado%20en%20tu%20tienda">
                    Contacto
                  </a>
                </li>
              </>
            ) : (
              <>
                <li><Link href="/">Inicio</Link></li>
                <li><Link href="/pages/aboutus">Quiénes somos</Link></li>
                <li><Link href="/pages/service">Nuestros servicios</Link></li>
                <li>
                  <a href="https://wa.me/593963328168?text=Hola!%20Estoy%20interesado%20en%20una%20tienda%20virtual">
                    WhatsApp
                  </a>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Columna 3: Social */}
        <div className={styles['footer-social']}>
          <h4>Síguenos</h4>
          <div className={styles['social-icons']}>
            <a 
              href="https://www.facebook.com/share/1CvmMT8UeP/" 
              className={styles['social-icon']}
            >
              <i className="fa-brands fa-facebook-f"></i>
            </a>
            <a 
              href="https://www.instagram.com/nexel_ec25/" 
              className={styles['social-icon']}
            >
              <i className="fa-brands fa-instagram"></i>
            </a>
          </div>
        </div>
      </div>

      <div className={styles['footer-bottom']}>
        <p>© 2026 Nexel. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
