import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AppShell from "@/components/app-shell";
import { NewProjectClient } from "@/components/new-project-client";

/* ---------------------------------------------------------
 * /dashboard/new — Simulasi Baru (dialog create terbuka)
 * ------------------------------------------------------- */
export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell active="template" title="Simulasi Baru">
      <div className="p-8">
        <h2 className="text-[32px] font-semibold tracking-tight text-primary mb-1">
          Simulasi Baru
        </h2>
        <p className="text-[14px] text-secondary">
          Buat proyek topologi jaringan baru — mulai dari kanvas kosong.
        </p>
      </div>
      <NewProjectClient />
    </AppShell>
  );
}
