import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-10 flex items-center gap-3 no-underline">
        <div className="w-10 h-10 rounded-[10px] bg-accent flex items-center justify-center font-[var(--font-manrope)] font-extrabold text-[#0A0B0D] text-lg">
          N
        </div>
        <span className="font-[var(--font-manrope)] font-bold text-xl text-[var(--text-primary)]">
          NetSim
        </span>
      </Link>
      {children}
    </div>
  );
}
