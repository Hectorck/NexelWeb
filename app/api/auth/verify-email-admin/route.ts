import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { emailsCoinciden, normalizarEmail } from "@/lib/email";

const coincideEmail = (emailGuardado?: string, emailNormalizado?: string) =>
  (!!emailNormalizado &&
    ((emailGuardado && emailsCoinciden(emailGuardado, emailNormalizado)) ||
      false));

export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json();
    const emailNormalizado =
      typeof email === "string" ? normalizarEmail(email) : "";

    console.log("\n========================================");
    console.log("🔍 [ADMIN API] Verificando email:", emailNormalizado);
    console.log("🎭 [ADMIN API] Role solicitado:", role);
    console.log("========================================");

    if (!emailNormalizado) {
      console.log("❌ [ADMIN API] Email vacío");
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    console.log("🔗 [ADMIN API] Usando Admin SDK (sin reglas de seguridad)...");

    // Obtener pre-clientes usando Admin SDK
    const preClientesSnapshot = await adminDb.collection("pre-clientes").get();
    console.log("📋 [ADMIN API] Pre-clientes encontrados:", preClientesSnapshot.size);

    const preClientes = preClientesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    }));

    console.log("📊 [ADMIN API] Total pre-clientes:", preClientes.length);
    preClientes.forEach(pc => {
      console.log(`  - ID: ${pc.id}, Email: ${pc.email}, Normalizado: ${pc.emailNormalizado}, Estado: ${pc.estado}`);
    });

    // Buscar coincidencias aprobadas
    const coincidenciasAprobado = preClientes.filter(
      (preCliente: any) =>
        preCliente.estado === "aprobado" &&
        (preCliente.emailNormalizado === emailNormalizado ||
          coincideEmail(preCliente.email, emailNormalizado))
    );

    console.log("🎯 [ADMIN API] Coincidencias aprobadas:", coincidenciasAprobado.length);
    coincidenciasAprobado.forEach(pc => {
      console.log(`  ✅ Coincidencia: ${pc.id} - ${pc.email}`);
    });

    // Buscar coincidencias convertidas
    const coincidenciasConvertido = preClientes.filter(
      (preCliente: any) =>
        preCliente.estado === "convertido" &&
        (preCliente.emailNormalizado === emailNormalizado ||
          coincideEmail(preCliente.email, emailNormalizado))
    );

    console.log("🔄 [ADMIN API] Coincidencias convertidas:", coincidenciasConvertido.length);

    if (!role) {
      if (coincidenciasAprobado.length > 0) {
        console.log("✅ [ADMIN API] Permitido como pre-cliente");
        return NextResponse.json({
          isPermitted: true,
          role: "pre-cliente",
          debug: {
            method: "admin-sdk",
            emailBuscado: emailNormalizado,
            totalPreClientes: preClientes.length,
            coincidenciasAprobado: coincidenciasAprobado.length,
            coincidenciasConvertido: coincidenciasConvertido.length,
          }
        });
      }

      if (coincidenciasConvertido.length > 0) {
        console.log("✅ [ADMIN API] Permitido como cliente");
        return NextResponse.json({
          isPermitted: true,
          role: "cliente",
          debug: {
            method: "admin-sdk",
            emailBuscado: emailNormalizado,
            totalPreClientes: preClientes.length,
            coincidenciasAprobado: coincidenciasAprobado.length,
            coincidenciasConvertido: coincidenciasConvertido.length,
          }
        });
      }

      // Verificar en colección de clientes
      const clientesSnapshot = await adminDb.collection("clientes").get();
      const clienteEncontrado = clientesSnapshot.docs.some((doc) => {
        const cliente = doc.data() as any;
        return (
          cliente.emailNormalizado === emailNormalizado ||
          coincideEmail(cliente.email, emailNormalizado)
        );
      });

      console.log("👥 [ADMIN API] Cliente encontrado:", clienteEncontrado);

      return NextResponse.json({
        isPermitted: clienteEncontrado,
        role: clienteEncontrado ? "cliente" : null,
        debug: {
          method: "admin-sdk",
          emailBuscado: emailNormalizado,
          totalPreClientes: preClientes.length,
          coincidenciasAprobado: coincidenciasAprobado.length,
          coincidenciasConvertido: coincidenciasConvertido.length,
          clienteEncontrado,
        }
      });
    }

    if (role === "pre-cliente") {
      const isPermitted = coincidenciasAprobado.length > 0;
      console.log(`📌 [ADMIN API] Invitación pre-cliente encontrada: ${isPermitted}`);

      return NextResponse.json({
        isPermitted,
        role: "pre-cliente",
        debug: {
          method: "admin-sdk",
          emailBuscado: emailNormalizado,
          totalPreClientes: preClientes.length,
          coincidenciasAprobado: coincidenciasAprobado.length,
        },
      });
    }

    if (role === "cliente") {
      if (coincidenciasConvertido.length > 0) {
        console.log("📌 [ADMIN API] Cliente encontrado por pre-cliente convertido: true");
        return NextResponse.json({
          isPermitted: true,
          role: "cliente",
          debug: {
            method: "admin-sdk",
            emailBuscado: emailNormalizado,
            coincidenciasConvertido: coincidenciasConvertido.length,
          },
        });
      }

      const clientesSnapshot = await adminDb.collection("clientes").get();
      const coincidencias = clientesSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }))
        .filter(
          (cliente: any) =>
            cliente.emailNormalizado === emailNormalizado ||
            coincideEmail(cliente.email, emailNormalizado)
        );
      
      console.log(`📌 [ADMIN API] Cliente permitido encontrado: ${coincidencias.length > 0}`);

      return NextResponse.json({
        isPermitted: coincidencias.length > 0,
        role: "cliente",
        debug: {
          method: "admin-sdk",
          emailBuscado: emailNormalizado,
          clientesEncontrados: coincidencias.length,
        },
      });
    }

    console.log("❌ [ADMIN API] Role no válido:", role);
    return NextResponse.json(
      { error: "Rol no válido" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("❌ [ADMIN API] ERROR:", error);
    console.error("    Mensaje:", error.message);
    
    return NextResponse.json(
      { 
        error: error.message || "Error al verificar email",
        details: error.toString(),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
