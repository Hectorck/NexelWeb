import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ConditionalHeader from "@/app/components/ConditionalHeader";
import Footer from "@/app/components/Footer";
import { AuthProvider } from "@/lib/AuthContext";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexel | Tu negocio al siguiente nivel",
  description: "Creamos tiendas online profesionales y personalizadas para emprendedores.",
  keywords: "tienda virtual, e-commerce, tienda online, crear tienda, diseño web",
  authors: [{ name: "Nexel_ec25" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="es" />
        <meta name="revisit-after" content="7 days" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Nexel — Tiendas virtuales personalizadas para emprendedores" />
        <meta property="og:description" content="Transforma tu idea en una tienda online profesional." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Nexel" />
        <meta property="og:locale" content="es_EC" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Nexel — Tiendas virtuales personalizadas" />
        
        {/* Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Audiowide&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css" />
        
        {/* Material Icons */}
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
        
        {/* Favicon */}
        <link rel="icon" type="image/x-icon" href="/img/nl.png" />
      </head>
      <body className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <AuthProvider>
          <ConditionalHeader />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
