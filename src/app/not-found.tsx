import Link from "next/link";
import { Icon } from "@/components/icons";

/* 404 — halaman tidak ditemukan (CyberNet) */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-bg">
      <div className="w-14 h-14 rounded-full bg-surface-2 border border-border-muted flex items-center justify-center text-neon mb-5">
        <Icon name="lan" size={28} />
      </div>
      <h1 className="text-[64px] font-black text-primary leading-none tracking-tight">404</h1>
      <p className="text-[15px] text-secondary mt-3 mb-6">Halaman yang kamu cari tidak ditemukan.</p>
      <Link
        href="/dashboard"
        className="btn-accent no-underline"
      >
        <Icon name="dashboard" size={16} />
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
