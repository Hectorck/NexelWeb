import { redirect } from "next/navigation";

export default function AdminPage() {
  // Redirigir automáticamente al dashboard
  redirect("/admin/dashboard");
}
