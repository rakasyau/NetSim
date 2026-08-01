"use client";

/* ============================================================
 * ConfigEditor — edit script config per node (Fase 5).
 * Pilih node → textarea script + template per vendor + lint
 * (Ctrl+Enter) + Simpan (PUT /api/projects/[id]/configs).
 * ============================================================ */
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { useEditorStore } from "@/components/editor/editor-store";
import { lintConfig } from "@/lib/linters";
import { templatesForVendor } from "@/lib/templates";
import type { FlowNode } from "@/lib/topology-types";

const CONFIG_TYPES = new Set(["router", "switch", "server", "firewall"]);

export function ConfigEditor({ projectId }: { projectId: string }) {
  const nodes = useEditorStore((s) => s.nodes);
  const configurable = useMemo(
    () => nodes.filter((n) => CONFIG_TYPES.has(n.data.type)),
    [nodes]
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    configurable[0]?.id ?? null
  );
  const [script, setScript] = useState("");
  const [saved, setSaved] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const node = configurable.find((n) => n.id === selectedId) ?? null;
  const templates = node ? templatesForVendor(node.data.vendor) : [];
  const lint = useMemo(
    () =>
      node
        ? lintConfig({ type: node.data.type, vendor: node.data.vendor }, script)
        : { isValid: true, issues: [] },
    [node, script]
  );

  // Load config tersimpan dari store? Config disimpan di DB (project.configs),
  // tidak di store — fetch dari project via API? Simpan di zustand tidak ada.
  // Untuk kesederhanaan: mulai kosong; user paste dari AI panel / template.
  useEffect(() => {
    if (!node) return;
    setScript("");
    setSaved(null);
    setError(null);
  }, [selectedId, node]);

  if (configurable.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-xl border border-dashed border-border-muted flex items-center justify-center text-dim mb-3">
          <Icon name="terminal" size={20} />
        </div>
        <p className="text-[13px] font-semibold text-secondary">Belum ada perangkat configurable</p>
        <p className="text-[12px] text-dim mt-1 leading-relaxed">
          Tambahkan router/switch/server dulu
          <br />
          untuk mulai menulis konfigurasi.
        </p>
      </div>
    );
  }

  async function save() {
    if (!node || saving) return;
    setSaving(true);
    setError(null);
    setSaved(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/configs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId: node.id, script }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan config.");
      setSaved(true);
      setTimeout(() => setSaved(null), 2500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function applyTemplate(tplId: string) {
    const tpl = templates.find((t) => t.id === tplId);
    if (!tpl) return;
    setScript(tpl.script);
    setSaved(null);
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {/* Pilih node */}
        <div>
          <label className="block label-caps text-secondary mb-1.5">Perangkat</label>
          <select
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full bg-bg border border-border-muted rounded-lg px-3 py-2 text-[13px] text-primary focus:outline-none focus:border-neon cursor-pointer"
          >
            {configurable.map((n) => (
              <option key={n.id} value={n.id}>
                {n.data.hostname} — {n.data.vendor}/{n.data.type}
              </option>
            ))}
          </select>
        </div>

        {/* Template */}
        {templates.length > 0 && (
          <div>
            <label className="block label-caps text-secondary mb-1.5">Template</label>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t.id)}
                  title={t.description}
                  className="px-2.5 py-1 rounded-full bg-surface-2 border border-border-muted text-[11.5px] text-secondary hover:border-neon hover:text-neon transition-colors cursor-pointer"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Editor script */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block label-caps text-secondary">Script</label>
            <span
              className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                lint.isValid
                  ? "text-emerald border-emerald/40 bg-emerald/10"
                  : "text-amber-400 border-amber-500/40 bg-amber-500/10"
              }`}
              title={lint.issues.join("\n")}
            >
              {lint.isValid ? "Sintaks OK" : "Perlu Ditinjau"}
            </span>
          </div>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                void save();
              }
            }}
            spellCheck={false}
            placeholder={`# Script ${node?.data.vendor === "mikrotik" ? "RouterOS" : node?.data.vendor === "cisco" ? "Cisco IOS" : "netplan/Linux"}\n# Ctrl+Enter untuk menyimpan`}
            rows={16}
            className="w-full bg-[#1E2329] border border-border-muted rounded-lg px-3 py-2.5 font-mono text-[12px] text-primary leading-relaxed focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon/50 resize-y placeholder:text-dim"
          />
        </div>

        {lint.issues.length > 0 && (
          <div className="text-[11.5px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            ⚠ {lint.issues.join(" · ")}
          </div>
        )}
        {error && (
          <div className="text-[12px] text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border-muted bg-container flex items-center gap-2">
        {saved && (
          <span className="text-[12px] text-emerald flex items-center gap-1 flex-shrink-0">
            <Icon name="check" size={13} /> Tersimpan
          </span>
        )}
        <button
          onClick={() => void save()}
          disabled={saving}
          className="btn-accent flex-1 !py-2 text-[12.5px]"
        >
          <Icon name="terminal" size={14} />
          {saving ? "Menyimpan..." : "Simpan Config"}
        </button>
      </div>
    </div>
  );
}
