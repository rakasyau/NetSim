"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

/* ============================================================
 * ProjectsTable — tabel My Projects CyberNet (dari mockup)
 * Filter & search client-side (dataset kecil)
 * ============================================================ */

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  tags: string[];
  nodes: { type: string }[];
  updatedAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  completed: "Selesai",
  shared: "Dibagikan",
};

const STATUS_STYLE: Record<string, { text: string; dot: string }> = {
  draft: { text: "text-secondary", dot: "bg-secondary" },
  completed: { text: "text-neon", dot: "bg-neon" },
  shared: { text: "text-emerald", dot: "bg-emerald" },
};

const TYPE_ICON: Record<string, string> = {
  router: "router",
  switch: "hub",
  server: "dns",
  pc: "computer",
  laptop: "computer",
  ap: "lan",
  firewall: "router",
  cloud: "cloud",
  printer: "print",
};

function countByType(nodes: { type: string }[]): [string, number][] {
  const map = new Map<string, number>();
  for (const n of nodes) map.set(n.type, (map.get(n.type) ?? 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

const TYPE_SHORT: Record<string, string> = {
  router: "R",
  switch: "S",
  server: "SRV",
  firewall: "FW",
  pc: "PC",
  laptop: "LT",
  ap: "AP",
  cloud: "CLD",
  printer: "PR",
};

function formatAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} mnt lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function ProjectsTable({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [search, setSearch] = useState("");
  const [vendor, setVendor] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();

  const filtered = useMemo(() => {
    let list = projects;
    if (vendor !== "all") {
      list = list.filter((p) => p.tags.includes(vendor) || p.nodes.some((n) => n.type === vendor));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [projects, search, vendor]);

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(filtered.map((p) => p.id)) : new Set());
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  async function duplicate(id: string) {
    if (busy) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/projects/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("gagal duplikasi");
      router.refresh();
    } catch {
      alert("Gagal menduplikasi proyek.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (busy) return;
    if (!confirm("Hapus proyek ini? Tindakan ini tidak bisa dibatalkan.")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("gagal hapus");
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch {
      alert("Gagal menghapus proyek.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {/* Header + Filter */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h2 className="text-[32px] font-semibold tracking-tight text-primary mb-1">
            Proyek Saya
          </h2>
          <p className="text-[14px] text-secondary">
            Kelola dan organisasikan topologi simulasi jaringanmu.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px] pointer-events-none">
              <Icon name="search" size={18} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari proyek..."
              className="w-[220px] bg-bg border border-border-muted rounded-lg pl-10 pr-4 py-2 text-[14px] text-primary placeholder:text-dim focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-colors"
            />
          </div>
          {/* Filter vendor */}
          <div className="flex bg-surface border border-border-muted rounded-lg p-1">
            {[
              { v: "all", label: "Semua" },
              { v: "switch", label: "Cisco" },
              { v: "router", label: "Mikrotik" },
              { v: "server", label: "Linux" },
            ].map((f) => (
              <button
                key={f.v}
                onClick={() => setVendor(f.v)}
                className={`px-4 py-1.5 rounded-md text-[14px] cursor-pointer transition-colors ${
                  vendor === f.v
                    ? "bg-surface-2 text-primary"
                    : "text-secondary hover:text-primary hover:bg-high"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {/* Bulk actions */}
          {selected.size > 0 && (
            <div className="flex items-center gap-2 border-l border-border-muted pl-3 ml-2">
              <button
                title="Duplikat terpilih"
                onClick={() => selected.forEach((id) => void duplicate(id))}
                className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-high transition-colors cursor-pointer"
              >
                <Icon name="copy" size={20} />
              </button>
              <button
                title="Hapus terpilih"
                onClick={() => selected.forEach((id) => void remove(id))}
                className="p-2 rounded-lg text-danger hover:bg-high transition-colors cursor-pointer"
              >
                <Icon name="trash" size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-2 border-b border-border-muted label-caps text-secondary">
              <th className="py-4 px-6 w-12 text-center">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="w-[18px] h-[18px] rounded-[4px] accent-[#c3f400] cursor-pointer"
                />
              </th>
              <th className="py-4 px-6">Nama Proyek</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">Infrastruktur</th>
              <th className="py-4 px-6 hidden sm:table-cell">Terakhir Diedit</th>
              <th className="py-4 px-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-[14px]">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-secondary">
                  {search || vendor !== "all"
                    ? "Tidak ada hasil yang cocok."
                    : "Belum ada proyek. Buat proyek pertamamu!"}
                </td>
              </tr>
            )}
            {filtered.map((p) => {
              const st = STATUS_STYLE[p.status] ?? STATUS_STYLE.draft;
              const chips = countByType(p.nodes);
              return (
                <tr
                  key={p.id}
                  className="border-b border-border-muted hover:bg-high transition-colors group"
                >
                  <td className="py-4 px-6 text-center">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={(e) => toggleOne(p.id, e.target.checked)}
                      className="w-[18px] h-[18px] rounded-[4px] accent-[#c3f400] cursor-pointer"
                    />
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-container flex items-center justify-center border border-border-muted text-secondary">
                        <Icon name="schema" size={16} />
                      </div>
                      <div>
                        <Link
                          href={`/editor/${p.id}`}
                          className="font-semibold text-primary hover:text-neon transition-colors no-underline"
                        >
                          {p.name}
                        </Link>
                        <div className="text-[12px] text-secondary mt-0.5">
                          ID: {p.id.slice(-6).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-container border border-border-muted text-[12px] font-semibold ${st.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {STATUS_LABEL[p.status] ?? "Draft"}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2 flex-wrap">
                      {chips.length === 0 && (
                        <span className="text-[12px] text-dim">kosong</span>
                      )}
                      {chips.map(([type, count]) => (
                        <span
                          key={type}
                          title={type}
                          className="px-2 py-0.5 rounded bg-container border border-border-muted text-[12px] text-secondary inline-flex items-center gap-1"
                        >
                          <Icon name={TYPE_ICON[type] ?? "dns"} size={12} />
                          {count} {TYPE_SHORT[type] ?? type}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-secondary hidden sm:table-cell">
                    {formatAgo(p.updatedAt)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-end items-center gap-1">
                      <Link
                        href={`/editor/${p.id}`}
                        title="Buka Editor"
                        className="text-secondary hover:text-neon p-1.5 transition-colors no-underline"
                      >
                        <Icon name="cursor" size={17} />
                      </Link>
                      <button
                        title="Duplikat"
                        onClick={() => void duplicate(p.id)}
                        disabled={busy === p.id}
                        className="text-secondary hover:text-neon p-1.5 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <Icon name="copy" size={17} />
                      </button>
                      <button
                        title="Hapus"
                        onClick={() => void remove(p.id)}
                        disabled={busy === p.id}
                        className="text-secondary hover:text-danger p-1.5 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <Icon name="trash" size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {/* Pagination footer */}
        <div className="bg-surface-2 border-t border-border-muted p-4 flex items-center justify-between">
          <span className="text-[14px] text-secondary">
            Menampilkan {filtered.length} dari {projects.length} proyek
          </span>
          <div className="flex gap-1">
            <button className="p-1 rounded bg-container border border-border-muted text-secondary hover:text-primary transition-colors cursor-pointer disabled:opacity-40">
              <Icon name="chevL" size={20} />
            </button>
            <button className="p-1 rounded bg-container border border-border-muted text-secondary hover:text-primary transition-colors cursor-pointer">
              <Icon name="chevR" size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
