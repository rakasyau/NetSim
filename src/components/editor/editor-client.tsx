"use client";

/* ---------------------------------------------------------
 * EditorClient — layout editor: topbar + toolbelt + canvas
 * + panel kanan (Properti / AI Assistant placeholder).
 * ------------------------------------------------------- */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import { Toolbelt } from "@/components/editor/toolbelt";
import { TopologyCanvas } from "@/components/editor/topology-canvas";
import { PropertyPanel } from "@/components/editor/property-panel";
import { useEditorStore } from "@/components/editor/editor-store";
import { toFlow, type FlowEdge, type FlowNode } from "@/lib/topology-types";

type ProjectData = {
  id: string;
  name: string;
  topology?: { nodes?: unknown[]; edges?: unknown[] } | null;
};

export function EditorClient({ project }: { project: ProjectData }) {
  const init = useEditorStore((s) => s.init);
  const saveState = useEditorStore((s) => s.saveState);
  const [tab, setTab] = useState<"props" | "ai">("props");
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load topology sekali saat mount
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const { nodes, edges } = toFlow(
      project.topology as Parameters<typeof toFlow>[0]
    );
    init(project.id, nodes as FlowNode[], edges as FlowEdge[]);
  }, [init, project]);

  async function exportPng() {
    const el = canvasRef.current?.querySelector(".react-flow") as HTMLElement | null;
    if (!el) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(el, {
        backgroundColor: "#14161C",
        pixelRatio: 2,
        filter: (node) =>
          !node.classList?.contains("react-flow__minimap") &&
          !node.classList?.contains("react-flow__controls"),
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${project.name || "topologi"}.png`;
      a.click();
    } catch (e) {
      console.error("Export PNG gagal:", e);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#14161C] text-[var(--text-primary)]">
      {/* ---------- Topbar ---------- */}
      <header className="h-[52px] shrink-0 border-b border-[var(--border-soft)] bg-[var(--surface)] flex items-center gap-3 px-4">
        <Link
          href="/dashboard"
          className="text-[var(--text-dim)] hover:text-[var(--text-primary)] text-lg leading-none no-underline"
          title="Kembali ke dashboard"
        >
          ←
        </Link>
        <div className="min-w-0">
          <h1 className="text-[14px] font-semibold truncate leading-tight">{project.name}</h1>
          <p className="text-[10px] text-[var(--text-dim)]">Topology Builder</p>
        </div>

        <div className="flex-1" />

        {saveState === "saving" && (
          <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            Menyimpan...
          </span>
        )}
        {saveState === "saved" && (
          <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            ✓ Tersimpan otomatis
          </span>
        )}
        {saveState === "error" && (
          <span className="text-[11px] text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
            ⚠ Gagal menyimpan
          </span>
        )}

        <button
          onClick={exportPng}
          disabled={exporting}
          className="btn-dark text-[12px] !py-1.5"
        >
          {exporting ? "Mengekspor..." : "⬇ Export PNG"}
        </button>
        <button className="btn-accent text-[12px] !py-1.5">✨ Generate Config</button>
      </header>

      {/* ---------- Body ---------- */}
      <div className="flex-1 flex min-h-0">
        <Toolbelt />

        {/* Canvas wrapper (ref untuk export) */}
        <div ref={canvasRef} className="flex-1 min-w-0 relative h-full">
          <TopologyCanvas />
        </div>

        {/* Panel kanan */}
        <aside className="w-[300px] shrink-0 border-l border-[var(--border-soft)] bg-[var(--surface)] flex flex-col">
          <div className="flex border-b border-[var(--border-soft)] shrink-0">
            <button
              onClick={() => setTab("props")}
              className={`flex-1 py-2.5 text-[12px] font-semibold cursor-pointer transition-colors ${
                tab === "props"
                  ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
                  : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
              }`}
            >
              Properti
            </button>
            <button
              onClick={() => setTab("ai")}
              className={`flex-1 py-2.5 text-[12px] font-semibold cursor-pointer transition-colors ${
                tab === "ai"
                  ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
                  : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
              }`}
            >
              AI Assistant
            </button>
          </div>

          {tab === "props" ? (
            <PropertyPanel />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-dim)] text-[var(--accent)] flex items-center justify-center mb-3 text-lg">
                ✦
              </div>
              <p className="text-[13px] font-semibold text-[var(--text-muted)]">
                AI Assistant
              </p>
              <p className="text-[11px] text-[var(--text-dim)] mt-1 leading-relaxed">
                Generate topologi & konfigurasi dengan
                <br />
                Gemini — hadir di Fase 4.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
