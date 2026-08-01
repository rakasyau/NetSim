import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AppShell from "@/components/app-shell";
import { SettingsForm } from "@/components/settings-form";

/* ---------------------------------------------------------
 * Pengaturan — profil akun
 * ------------------------------------------------------- */
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell active="settings" title="Pengaturan">
      <div className="p-8">
        <SettingsForm />
      </div>
    </AppShell>
  );
}
