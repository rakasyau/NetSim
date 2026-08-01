"use client";

/* ---------------------------------------------------------
 * EditorClient — layout editor CyberNet (mockup):
 * topbar + mini rail + toolbar editor + canvas + panel kanan.
 * ------------------------------------------------------- */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import { Toolbelt } from "@/components/editor/toolbelt";
import { TopologyCanvas } from "@/components/editor/topology-canvas";
import { PropertyPanel } from "@/components/editor/property-panel";
import { AiPanel } from "@/components/editor/ai-panel";
import { useEditorStore } from "@/components/editor/editor-store";
import { toFlow, type FlowEdge, type FlowNode } from "@/lib/topology-types";
import { Icon } from "@/components/icons";

type ProjectData = {
  id: string;
  name: string;
  topology?: { nodes?: unknown[]; edges?: unknown[] } | null;
};

export function EditorClient({ project }: { project: ProjectData }) {
  const init = useEditorStore((s) => s.init);
  const saveState = useEditorStore((s) => s.saveState);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const [exporting, setExporting] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMode, setAiMode] = useState<"chat" | "topology" | "config">("chat");
  const [zoomPct, setZoomPct] = useState(100);
  const canvasRef = useRef<HTMLDivElement>(null);

  const openAi = (mode: "chat" | "topology" | "config") => {
    setAiMode(mode);
    setAiOpen(true);
  };

  // Load topology sekali saat mount
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const { nodes, edges } = toFlow(project.topology as Parameters<typeof toFlow>[0]);
    init(project.id, nodes as FlowNode[], edges as FlowEdge[]);
  }, [init, project]);

  // Zoom % dari React Flow (TopologyCanvas dispatch event)
  useEffect(() => {
    const onZoom = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      if (typeof detail === "number") setZoomPct(Math.round(detail * 100));
    };
    const onZoomBtn = (e: Event) => {
      const delta = (e as CustomEvent<number>).detail;
      if (typeof delta === "number") setZoomPct((z) => Math.max(20, Math.min(400, z + delta)));
    };
    window.addEventListener("netsim:zoomchange", onZoom);
    window.addEventListener("netsim:zoom", onZoomBtn);
    return () => {
      window.removeEventListener("netsim:zoomchange", onZoom);
      window.removeEventListener("netsim:zoom", onZoomBtn);
    };
  }, []);

  async function exportPng() {
    const el = canvasRef.current?.querySelector(".react-flow") as HTMLElement | null;
    if (!el) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(el, {
        backgroundColor: "#0B0E11",
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
    <div className="h-screen flex flex-col bg-bg text-primary overflow-hidden">
      {/* ---------- TopAppBar ---------- */}
      <header className="h-16 shrink-0 bg-container border-b border-border-muted flex items-center justify-between px-6 relative z-30">
        <div className="flex items-center gap-5">
          <Link href="/dashboard" className="flex items-center gap-2.5 no-underline">
            <span className="text-neon">
              <Icon name="lan" size={24} />
            </span>
            <span className="text-[20px] font-black text-neon leading-none">NetSim</span>
          </Link>
          <div className="w-px h-5 bg-border-muted" />
          <div>
            <div className="text-[14px] font-semibold text-primary leading-tight truncate max-w-[260px]">
              {project.name}
            </div>
            <div className="text-[11px] text-secondary flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
              Topology Builder
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Save state pill */}
          {saveState === "saving" && (
            <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              Menyimpan...
            </span>
          )}
          {saveState === "saved" && (
            <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <Icon name="check" size={12} /> Tersimpan otomatis
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
            className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-surface-2 border border-border-muted text-[12px] text-primary hover:border-neon transition-colors cursor-pointer disabled:opacity-50"
          >
            <Icon name="download" size={15} />
            {exporting ? "Mengekspor..." : "Export PNG"}
          </button>
          <button
            title="Bantuan"
            className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:text-neon hover:bg-high transition-colors cursor-pointer"
          >
            <Icon name="help" size={19} />
          </button>
          <button
            title="Notifikasi"
            className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:text-neon hover:bg-high transition-colors cursor-pointer"
          >
            <Icon name="bell" size={19} />
          </button>
          <div className="w-8 h-8 rounded-full bg-surface-2 border border-border-muted flex items-center justify-center text-[12px] font-bold text-neon cursor-pointer">
            {project.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* ---------- Mini rail (w-16) ---------- */}
        <aside className="w-16 bg-surface border-r border-border-muted flex flex-col items-center py-4 gap-5 z-10 shrink-0">
          <Link
            href="/dashboard"
            title="Dashboard"
            className="text-secondary hover:text-neon hover:bg-high p-2 rounded-lg transition-colors no-underline"
          >
            <Icon name="dashboard" size={20} />
          </Link>
          <Link
            href="/dashboard/projects"
            title="Proyek Saya"
            className="text-secondary hover:text-neon hover:bg-high p-2 rounded-lg transition-colors no-underline"
          >
            <Icon name="folder" size={20} />
          </Link>
          <span
            title="Editor Topologi (aktif)"
            className="bg-neon text-on-neon p-2 rounded-lg"
          >
            <Icon name="schema" size={20} />
          </span>
          <button
            onClick={() => openAi("chat")}
            title="AI Assistant"
            className="text-secondary hover:text-neon hover:bg-high p-2 rounded-lg transition-colors cursor-pointer"
          >
            <Icon name="smartToy" size={20} />
          </button>
          <div className="mt-auto">
            <Link
              href="/dashboard/settings"
              title="Pengaturan"
              className="text-secondary hover:text-neon hover:bg-high p-2 rounded-lg transition-colors no-underline"
            >
              <Icon name="settings" size={20} />
            </Link>
          </div>
        </aside>

        {/* ---------- Main workspace ---------- */}
        <main className="flex-1 flex flex-col min-w-0 relative">
          {/* Editor Toolbar */}
          <div className="h-12 bg-surface border-b border-border-muted flex items-center justify-between px-3 z-10 shrink-0 shadow-sm">
            <div className="flex items-center gap-1">
              <button
                title="Pilih"
                className="p-1.5 text-neon bg-surface-2 rounded transition-colors cursor-pointer"
              >
                <Icon name="cursor" size={16} />
              </button>
              <button
                title="Geser"
                className="p-1.5 text-secondary hover:text-neon hover:bg-surface-2 rounded transition-colors cursor-pointer"
              >
                <Icon name="pan" size={16} />
              </button>
              <div className="w-px h-4 bg-border-muted mx-2" />
              <button
                title="Perkecil"
                onClick={() => window.dispatchEvent(new CustomEvent("netsim:zoom", { detail: -10 }))}
                className="p-1.5 text-secondary hover:text-neon hover:bg-surface-2 rounded transition-colors cursor-pointer"
              >
                <Icon name="zoomOut" size={16} />
              </button>
              <span className="font-mono text-[12px] text-secondary w-11 text-center">
                {zoomPct}%
              </span>
              <button
                title="Perbesar"
                onClick={() => window.dispatchEvent(new CustomEvent("netsim:zoom", { detail: 10 }))}
                className="p-1.5 text-secondary hover:text-neon hover:bg-surface-2 rounded transition-colors cursor-pointer"
              >
                <Icon name="zoomIn" size={16} />
              </button>
              <div className="w-px h-4 bg-border-muted mx-2" />
              <button
                title="Urungkan (Ctrl+Z)"
                onClick={() => undo()}
                className="p-1.5 text-secondary hover:text-neon hover:bg-surface-2 rounded transition-colors cursor-pointer"
              >
                <Icon name="undo" size={16} />
              </button>
              <button
                title="Ulangi (Ctrl+Y)"
                onClick={() => redo()}
                className="p-1.5 text-secondary hover:text-neon hover:bg-surface-2 rounded transition-colors cursor-pointer"
              >
                <Icon name="redo" size={16} />
              </button>
            </div>

            <button
              onClick={() => openAi("config")}
              className="flex items-center gap-2 bg-surface-2 border border-neon text-neon px-3.5 py-1.5 rounded-lg text-[13px] font-semibold hover:bg-neon hover:text-on-neon transition-colors cursor-pointer"
            >
              <Icon name="sparkle" size={15} />
              Generate dengan AI
            </button>
          </div>

          {/* Canvas Area */}
          <div
            ref={canvasRef}
            className="flex-1 min-h-0 relative bg-surface-container-lowest"
          >
            <TopologyCanvas />
            <Toolbelt />
          </div>
        </main>

        {/* ---------- Properties panel (kanan) ---------- */}
        <aside className="w-[330px] shrink-0 bg-surface border-l border-border-muted flex flex-col z-20 shadow-[-4px_0_15px_rgba(0,0,0,0.2)]">
          <div className="h-12 border-b border-border-muted flex items-center justify-between px-4 flex-shrink-0">
            <span className="text-[20px] font-semibold text-primary">Properties</span>
            <button
              onClick={() => openAi("chat")}
              title="Buka AI Assistant"
              className="text-secondary hover:text-neon transition-colors cursor-pointer"
            >
              <Icon name="smartToy" size={20} />
            </button>
          </div>
          <PropertyPanel />
        </aside>
      </div>

      {/* ---------- AI Assistant overlay (mockup preview) ---------- */}
      {aiOpen && (
        <AiPanel
          projectId={project.id}
          projectName={project.name}
          initialMode={aiMode}
          onClose={() => setAiOpen(false)}
        />
      )}
    </div>
  );
}
