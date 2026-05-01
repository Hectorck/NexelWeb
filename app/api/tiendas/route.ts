import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Buscar tiendas del usuario en Firestore
    const tiendasRef = adminDb.collection('tiendas');
    const snapshot = await tiendasRef.where('userId', '==', userId).get();

    const tiendas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      tiendas
    });

  } catch (error) {
    console.error('Error en API de tiendas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, userId, descripcion, logo, config } = body;

    if (!nombre || !userId) {
      return NextResponse.json(
        { error: 'nombre y userId son requeridos' },
        { status: 400 }
      );
    }

    // Crear nueva tienda
    const tiendaData = {
      nombre,
      userId,
      descripcion: descripcion || '',
      logo: logo || '',
      config: config || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await adminDb.collection('tiendas').add(tiendaData);

    return NextResponse.json({
      success: true,
      tienda: {
        id: docRef.id,
        ...tiendaData
      }
    });

  } catch (error) {
    console.error('Error creando tienda:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
