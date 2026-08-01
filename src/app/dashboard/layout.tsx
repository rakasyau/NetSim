import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { signOut } from "@/lib/auth";

/* ---------------------------------------------------------
 * Layout dashboard — guard auth (lapis kedua setelah proxy)
 * ------------------------------------------------------- */
export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen flex">
      {/* Rail sidebar (mengikuti mockup) */}
      <aside className="w-[68px] bg-[var(--surface)] border-r border-[var(--border-soft)] flex flex-col items-center py-5 gap-7 flex-shrink-0">
        <Link href="/dashboard" className="w-[34px] h-[34px] rounded-[9px] bg-[var(--accent)] flex items-center justify-center font-[var(--font-manrope)] font-extrabold text-[#0A0B0D] text-[15px] no-underline">
          N
        </Link>
        <nav className="flex flex-col gap-1.5 flex-1">
          <Link href="/dashboard" title="Dashboard" className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[var(--accent)] bg-[var(--accent-dim)] no-underline">
            ▤
          </Link>
          <Link href="/dashboard" title="Proyek" className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[var(--text-dim)] hover:bg-[var(--surface-alt)] no-underline">
            ▦
          </Link>
          <Link href="/dashboard/settings" title="Pengaturan" className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[var(--text-dim)] hover:bg-[var(--surface-alt)] no-underline">
            ⚙
          </Link>
        </nav>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" title="Keluar" className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[var(--text-dim)] hover:bg-[var(--surface-alt)] hover:text-red-400 cursor-pointer">
            ⏻
          </button>
        </form>
      </aside>

      {/* Konten utama */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-[60px] border-b border-[var(--border-soft)] flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="font-[var(--font-manrope)] font-bold text-[15px]">NetSim</h1>
            <span className="text-[13px] text-[var(--text-dim)]">/ {session.user.name}</span>
          </div>
          <Link
            href="/dashboard"
            className="text-[12px] text-[var(--text-dim)] no-underline hover:text-[var(--text-primary)]"
          >
            {session.user.email}
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
