"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

/* ---------------------------------------------------------
 * CreateProjectDialog — modal buat proyek baru
 * ------------------------------------------------------- */
export function CreateProjectDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

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

    setName("");
    setDescription("");
    onClose();
    router.push(`/editor/${data.project.id}`);
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="card-dark w-full max-w-[420px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-[var(--font-manrope)] font-bold text-lg mb-1">Buat Proyek Baru</h3>
        <p className="text-[13px] text-[var(--text-muted)] mb-5">
          Mulai rancang topologi jaringan dari kanvas kosong.
        </p>

        {error && (
          <div className="mb-4 text-[13px] bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2.5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[12px] text-[var(--text-dim)] uppercase tracking-wide font-semibold mb-1.5">
              Nama Proyek
            </label>
            <input
              type="text"
              required
              autoFocus
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
              className="input-dark min-h-[80px] resize-y"
              placeholder="Topologi 3 lantai: HR, IT, Finance..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-3 mt-1">
            <button type="submit" disabled={loading} className="btn-accent flex-1">
              {loading ? "Membuat..." : "Buat & Buka Editor"}
            </button>
            <button type="button" className="btn-dark" onClick={onClose}>
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
