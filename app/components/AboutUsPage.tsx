'use client';

import Image from 'next/image';
import styles from '@/app/styles/aboutus.module.css';

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image: string;
}

export default function AboutUsPage() {
  const teamMembers: TeamMember[] = [
    {
      name: 'Héctor Cobeña',
      role: 'Fundador & Desarrollador Web',
      bio: 'Apasionado por la tecnología y el diseño digital. Su enfoque es crear sitios web modernos, funcionales y optimizados para resultados reales.',
      image: '/img/int_01.png'
    },
    {
      name: 'Abraham Cedeño',
      role: 'Desarrollador Backend',
      bio: 'Encargado de crear la base de datos y de que los datos de los clientes se mantengan seguros.',
      image: '/img/int2.png'
    },
    {
      name: 'Alexander Nieves',
      role: 'Diseñador UI/UX',
      bio: 'Encargado de la experiencia visual y la interacción. Cada tienda virtual es pensada para ser estética, intuitiva y memorable.',
      image: '/img/iint3.png'
    }
  ];

  return (
    <main className={styles.aboutus} style={{backgroundColor: "black"}}>
      {/* Intro Section */}
      <section className={styles['aboutus-intro']}>
        <h1>¿Quiénes Somos?</h1>
        <p>
          Somos un equipo apasionado por el desarrollo web, el diseño moderno y las soluciones tecnológicas
          que ayudan a los emprendedores a llevar su negocio al siguiente nivel.
        </p>
        <p>
          Nuestro objetivo es brindarte una tienda virtual atractiva, funcional y fácil de gestionar,
          para que vendas más y tengas más clientes.
        </p>
      </section>

      {/* Team Section */}
      <section className={styles.team}>
        <h2>Conoce a Nuestro Equipo</h2>
        <div className={styles['team-container']}>
          {teamMembers.map((member, index) => (
            <div key={index} className={styles['team-member']}>
              <img src={member.image} alt={member.name} />
              <h3>{member.name}</h3>
              <p className={styles.role}>{member.role}</p>
              <p className={styles.bio}>{member.bio}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
