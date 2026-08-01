"use client";

/* Error boundary global (CyberNet) */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col items-center justify-center px-4 bg-bg text-primary">
        <div className="w-14 h-14 rounded-full bg-surface-2 border border-border-muted flex items-center justify-center text-danger mb-5 text-2xl">
          !
        </div>
        <h1 className="text-[24px] font-semibold">Terjadi kesalahan</h1>
        <p className="text-[14px] text-secondary mt-2 mb-6 max-w-[420px] text-center">
          {error.message || "Kesalahan tak terduga. Coba muat ulang halaman."}
        </p>
        <button onClick={reset} className="btn-accent">
          Muat Ulang
        </button>
      </body>
    </html>
  );
}
