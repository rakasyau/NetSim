"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProjectCard } from "@/components/project-card";
import { CreateProjectDialog } from "@/components/create-project-dialog";

/* ---------------------------------------------------------
 * ProjectList — daftar proyek dengan search & filter
 * Fetch dari /api/projects (server-side filtering)
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

export function ProjectList({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProjects = useCallback(async (q: string, st: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    if (st) params.set("status", st);
    const res = await fetch(`/api/projects?${params.toString()}`);
    const data = await res.json().catch(() => ({ projects: [] }));
    setProjects(data.projects ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchProjects(search, status), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, status, fetchProjects]);

  return (
    <>
      {/* Toolbar: search + filter */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-[340px]">
          <input
            type="search"
            className="input-dark pl-9"
            placeholder="Cari proyek..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] text-sm pointer-events-none">
            ⌕
          </span>
        </div>

        <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border-soft)] rounded-[9px] p-1">
          {[
            { v: "", label: "Semua" },
            { v: "draft", label: "Draft" },
            { v: "completed", label: "Selesai" },
            { v: "shared", label: "Dibagikan" },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setStatus(f.v)}
              className={`text-[12px] px-3 py-1.5 rounded-[7px] cursor-pointer transition-colors ${
                status === f.v
                  ? "bg-[var(--accent-dim)] text-[var(--accent)] font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <button className="btn-accent text-[13px]" onClick={() => setDialogOpen(true)}>
          + Buat Proyek
        </button>
      </div>

      {loading && projects.length === 0 && (
        <div className="card-dark p-10 text-center text-[13px] text-[var(--text-muted)]">
          Memuat proyek...
        </div>
      )}

      {!loading && projects.length === 0 && (
        <div className="card-dark p-10 text-center">
          <p className="text-[15px] font-semibold mb-1">
            {search || status ? "Tidak ada hasil" : "Belum ada proyek"}
          </p>
          <p className="text-[13px] text-[var(--text-muted)] mb-5">
            {search || status
              ? "Coba ubah kata kunci atau filter."
              : "Buat proyek pertamamu untuk mulai merancang topologi jaringan."}
          </p>
          {!search && !status && (
            <button className="btn-accent text-[13px]" onClick={() => setDialogOpen(true)}>
              + Buat Proyek Pertama
            </button>
          )}
        </div>
      )}

      {projects.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      <CreateProjectDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
