import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { Icon } from "@/components/icons";

/* ============================================================
 * AppShell — shell dashboard CyberNet Modern (dari mockup)
 * Sidebar 320px + TopAppBar + konten
 * ============================================================ */

type NavKey = "dashboard" | "projects" | "template" | "ai" | "settings";

const NAV: { key: NavKey; label: string; icon: string; href: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard", href: "/dashboard" },
  { key: "projects", label: "Proyek Saya", icon: "folder", href: "/dashboard/projects" },
  { key: "template", label: "Buat Proyek", icon: "schema", href: "/dashboard/new" },
  { key: "ai", label: "AI Assistant", icon: "smartToy", href: "/dashboard" },
  { key: "settings", label: "Pengaturan", icon: "settings", href: "/dashboard/settings" },
];

export default async function AppShell({
  children,
  active,
  title,
}: Readonly<{ children: React.ReactNode; active: NavKey; title?: string }>) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const name = session.user.name ?? "Pengguna";
  const initial = name.trim().charAt(0).toUpperCase() || "N";

  return (
    <div className="h-screen flex overflow-hidden bg-bg">
      {/* ============ Sidebar 320px ============ */}
      <aside className="w-[320px] bg-surface border-r border-border-muted flex flex-col p-4 flex-shrink-0 hidden md:flex">
        {/* Brand */}
        <div className="mb-8 mt-2 flex items-center px-3 gap-3">
          <span className="w-10 h-10 rounded-full bg-surface-2 border border-border-muted flex items-center justify-center text-neon">
            <Icon name="lan" size={22} />
          </span>
          <div>
            <h1 className="text-[20px] font-bold text-neon leading-tight tracking-tight">
              NetSim Pro
            </h1>
            <p className="text-[13px] text-secondary">Network Engineer</p>
          </div>
        </div>

        {/* Navigasi */}
        <nav className="flex-1 space-y-1.5">
          {NAV.map((item) => {
            const isActive = item.key === active;
            const isDisabled = item.key === "ai";
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-disabled={isDisabled}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-[14px] no-underline transition-colors ${
                  isActive
                    ? "bg-neon text-on-neon font-semibold shadow-[0_4px_12px_rgba(195,244,0,0.3)]"
                    : isDisabled
                      ? "text-dim cursor-not-allowed"
                      : "text-secondary hover:text-primary hover:bg-high"
                }`}
              >
                <Icon
                  name={item.icon}
                  size={19}
                  className={isActive ? "text-on-neon" : isDisabled ? "text-neon/60" : ""}
                />
                <span className="flex-1">{item.label}</span>
                {isDisabled && (
                  <span className="text-[10px] text-dim uppercase tracking-wider">Segera</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* CTA + Logout */}
        <div className="mt-auto space-y-3">
          <Link
            href="/dashboard/new"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-neon text-on-neon text-[14px] font-bold no-underline hover:bg-neon-2 transition-colors shadow-[0_8px_16px_rgba(195,244,0,0.2)]"
          >
            <Icon name="add" size={18} />
            Simulasi Baru
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-[14px] text-dim hover:text-danger hover:bg-high cursor-pointer transition-colors"
            >
              <Icon name="logout" size={19} />
              Keluar
            </button>
          </form>
        </div>
      </aside>

      {/* ============ Konten utama ============ */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* TopAppBar */}
        <header className="h-16 bg-container border-b border-border-muted flex items-center justify-between px-6 flex-shrink-0 relative z-20">
          <div className="flex items-center gap-2">
            <span className="md:hidden text-neon">
              <Icon name="lan" size={22} />
            </span>
            <h2 className="text-[16px] font-semibold text-primary">
              {title ?? "NetSim"}
            </h2>
            <span className="text-[12px] text-dim">/ {name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/new"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-2 border border-border-muted text-[13px] text-primary hover:border-neon transition-colors no-underline"
            >
              <Icon name="add" size={16} />
              Buat Proyek
            </Link>
            <button
              title="Notifikasi"
              className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:text-neon hover:bg-high transition-colors cursor-pointer"
            >
              <Icon name="bell" size={20} />
            </button>
            <button
              title="Bantuan"
              className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:text-neon hover:bg-high transition-colors cursor-pointer"
            >
              <Icon name="help" size={20} />
            </button>
            <div
              title={session.user.email ?? name}
              className="w-8 h-8 rounded-full bg-surface-2 border border-border-muted flex items-center justify-center text-[13px] font-bold text-neon cursor-pointer"
            >
              {initial}
            </div>
          </div>
        </header>

        {/* Konten */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
