import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'slug es requerido' },
        { status: 400 }
      );
    }

    // Buscar tienda por slug normalized
    const tiendasRef = adminDb.collection('tiendas');
    const snapshot = await tiendasRef.get();
    
    const tienda = snapshot.docs.find(doc => {
      const data = doc.data();
      const normalizedTiendaName = data.nombre
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      return normalizedTiendaName === slug;
    });

    if (!tienda) {
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tienda: {
        id: tienda.id,
        nombre: tienda.data().nombre,
        descripcion: tienda.data().descripcion,
        logo: tienda.data().logo,
        config: tienda.data().config
      }
    });

  } catch (error) {
    console.error('Error obteniendo tienda por slug:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
