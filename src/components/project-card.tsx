"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/status-badge";

/* ---------------------------------------------------------
 * ProjectCard — kartu proyek di dashboard
 * Aksi: buka editor, duplicate, hapus (soft delete), ubah status
 * ------------------------------------------------------- */
type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  tags: string[];
  nodeCount: number;
  updatedAt: string;
};

export function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function duplicate() {
    setBusy(true);
    const res = await fetch(`/api/projects/${project.id}/duplicate`, { method: "POST" });
    if (res.ok) {
      router.refresh();
    }
    setBusy(false);
    setMenuOpen(false);
  }

  async function remove() {
    if (!confirm(`Hapus proyek "${project.name}"? (masih bisa dipulihkan selama 30 hari)`)) return;
    setBusy(true);
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    }
    setBusy(false);
    setMenuOpen(false);
  }

  async function setStatus(status: string) {
    setBusy(true);
    await fetch(`/api/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
    setBusy(false);
    setMenuOpen(false);
  }

  const date = new Date(project.updatedAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="card-dark p-5 hover:border-[var(--border)] transition-colors relative">
      <div className="flex items-start justify-between mb-2 gap-2">
        <h4 className="font-semibold text-[14px] truncate">{project.name}</h4>
        <StatusBadge status={project.status} />
      </div>

      <p className="text-[12px] text-[var(--text-muted)] line-clamp-2 mb-3 min-h-[32px]">
        {project.description || "Tanpa deskripsi"}
      </p>

      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {project.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-alt)] border border-[var(--border-soft)] text-[var(--text-muted)]"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-dim)] font-mono">
          {project.nodeCount} perangkat · {date}
        </span>
        <div className="flex items-center gap-1">
          <Link
            href={`/editor/${project.id}`}
            className="text-[12px] text-[var(--accent)] font-semibold no-underline hover:underline"
          >
            Buka →
          </Link>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              disabled={busy}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-dim)] hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)] text-sm cursor-pointer"
              aria-label="Aksi proyek"
            >
              ⋯
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-8 z-20 card-dark w-[170px] p-1.5 shadow-xl"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  onClick={() => setStatus(project.status === "completed" ? "draft" : "completed")}
                  disabled={busy}
                  className="w-full text-left text-[12px] px-3 py-2 rounded-lg hover:bg-[var(--surface-alt)] cursor-pointer"
                >
                  {project.status === "completed" ? "Tandai Draft" : "Tandai Selesai"}
                </button>
                <button
                  onClick={() => setStatus("shared")}
                  disabled={busy}
                  className="w-full text-left text-[12px] px-3 py-2 rounded-lg hover:bg-[var(--surface-alt)] cursor-pointer"
                >
                  Bagikan
                </button>
                <button
                  onClick={duplicate}
                  disabled={busy}
                  className="w-full text-left text-[12px] px-3 py-2 rounded-lg hover:bg-[var(--surface-alt)] cursor-pointer"
                >
                  Duplikat
                </button>
                <div className="h-px bg-[var(--border-soft)] my-1" />
                <button
                  onClick={remove}
                  disabled={busy}
                  className="w-full text-left text-[12px] px-3 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-red-400/90 cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
