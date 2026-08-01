"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

/* ---------------------------------------------------------
 * Halaman "Buat Proyek" — CRUD lengkap datang di Fase 2.
 * Sekadar form dasar agar tombol dashboard berfungsi.
 * ------------------------------------------------------- */
export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    const data = await res.json().catch(() => ({}));

    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Gagal membuat proyek.");
      return;
    }
    router.push(`/editor/${data.project.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-[520px]">
      <h2 className="font-[var(--font-manrope)] font-bold text-xl mb-1.5">Buat Proyek Baru</h2>
      <p className="text-[13px] text-[var(--text-muted)] mb-6">
        Mulai rancang topologi jaringan dari kanvas kosong.
      </p>

      {error && (
        <div className="mb-4 text-[13px] bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2.5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card-dark p-6 flex flex-col gap-4">
        <div>
          <label className="block text-[12px] text-[var(--text-dim)] uppercase tracking-wide font-semibold mb-1.5">
            Nama Proyek
          </label>
          <input
            type="text"
            required
            className="input-dark"
            placeholder="Kantor Cabang — VLAN & OSPF"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[12px] text-[var(--text-dim)] uppercase tracking-wide font-semibold mb-1.5">
            Deskripsi <span className="normal-case text-[var(--text-dim)] font-normal">(opsional)</span>
          </label>
          <textarea
            className="input-dark min-h-[90px] resize-y"
            placeholder="Topologi 3 lantai: HR, IT, Finance..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex gap-3 mt-1">
          <button type="submit" disabled={loading} className="btn-accent flex-1">
            {loading ? "Membuat..." : "Buat & Buka Editor"}
          </button>
          <button
            type="button"
            className="btn-dark"
            onClick={() => router.push("/dashboard")}
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
