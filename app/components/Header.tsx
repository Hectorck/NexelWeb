'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import styles from '@/app/styles/header.module.css';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header>
      <nav className={styles.nav}>
        {/* Logo */}
        <div className={styles['logo-nav']}>
          <Link href="/">
            <img src="/img/nl.png" alt="Logo Nexel" />
            <h2>Nexel</h2>
          </Link>
        </div>

        {/* Hamburger Menu */}
        <div 
          className={styles['menu-toggle']} 
          id="menu-toggle"
          onClick={toggleMenu}
        >
          <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </div>

        {/* Navigation Links */}
        <div 
          className={`${styles['btn-nav']} ${menuOpen ? styles.active : ''}`} 
          id="nav-links"
        >
          <ul>
            <li><Link href="/" onClick={closeMenu}>Inicio</Link></li>
            <li><Link href="/pages/aboutus" onClick={closeMenu}>Sobre Nosotros</Link></li>
            <li><Link href="/pages/service" onClick={closeMenu}>Servicio</Link></li>
            <li>
              <a 
                href="https://wa.me/593963328168?text=Hola!%20Estoy%20interesado%20en%20una%20tienda%20virtual" 
                onClick={closeMenu}
              >
                Contacto
              </a>
            </li>
            <li>
              <Link 
                href="/registro" 
                onClick={closeMenu}
                className="bg-blue-900 hover:bg-blue-1000 text-white px-4 py-2 rounded-lg transition-all"
              >
                Prueba Gratuita
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
