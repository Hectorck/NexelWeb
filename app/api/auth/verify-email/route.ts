import { adminDb } from "@/lib/firebaseAdmin";
import { emailsCoinciden, normalizarEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const emailNormalizado = typeof email === "string" ? normalizarEmail(email) : "";

    if (!emailNormalizado) {
      return NextResponse.json({ error: "Email es requerido" }, { status: 400 });
    }

    const snapshot = await adminDb.collection("pre-clientes").get();

    const preClientes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const coincideEmail = (emailGuardado?: string) =>
      emailGuardado ? emailsCoinciden(emailGuardado, emailNormalizado) : false;

    const esAprobado = preClientes.find(
      (pc: any) =>
        pc.estado === "aprobado" &&
        (pc.emailNormalizado === emailNormalizado || coincideEmail(pc.email))
    );

    if (esAprobado) {
      return NextResponse.json({ isPermitted: true, role: "pre-cliente" });
    }

    const esConvertido = preClientes.find(
      (pc: any) =>
        pc.estado === "convertido" &&
        (pc.emailNormalizado === emailNormalizado || coincideEmail(pc.email))
    );

    if (esConvertido) {
      return NextResponse.json({ isPermitted: true, role: "cliente" });
    }

    const clientesSnapshot = await adminDb.collection("clientes").get();
    const esCliente = clientesSnapshot.docs.some((doc) => {
      const data = doc.data();
      return (
        data.emailNormalizado === emailNormalizado || coincideEmail(data.email)
      );
    });

    const logs = [];
    logs.push("Email: " + emailNormalizado);
    logs.push("Project ID: " + process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

    if (esCliente) {
      return NextResponse.json({ isPermitted: true, role: "cliente" });
    }

    return NextResponse.json({
      isPermitted: false,
      error: "Este email no tiene una invitación activa. Contacta al equipo de Nexel para obtener acceso.",
    });

  } catch (error: any) {
    console.error("❌ [API] Error:", error.message);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}