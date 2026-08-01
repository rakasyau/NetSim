import Link from "next/link";
import { Icon } from "@/components/icons";

/* Layout auth — CyberNet: brand + card di tengah */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[radial-gradient(ellipse_at_top,rgba(30,35,41,0.6),transparent_60%)]">
      <Link href="/" className="mb-8 flex items-center gap-3 no-underline">
        <span className="w-10 h-10 rounded-full bg-surface-2 border border-border-muted flex items-center justify-center text-neon">
          <Icon name="lan" size={22} />
        </span>
        <span className="text-[24px] font-bold text-neon tracking-tight">NetSim Pro</span>
      </Link>
      {children}
    </div>
  );
}
