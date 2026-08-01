"use client";

/* ---------------------------------------------------------
 * TopologyCanvas — kanvas React Flow:
 * drag-drop node dari toolbelt, kabel antar interface,
 * zoom/pan, snap grid, minimap, undo/redo (Ctrl+Z/Y),
 * hapus (Del), auto-save debounce 2 detik.
 * ------------------------------------------------------- */
import { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { NodeCard } from "@/components/editor/node-card";
import { useEditorStore } from "@/components/editor/editor-store";
import { createDefaultNode } from "@/lib/device-catalog";
import type { FlowNode } from "@/lib/topology-types";

const nodeTypes = { device: NodeCard };

function CanvasInner() {
  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);
  const saveState = useEditorStore((s) => s.saveState);
  const onNodesChange = useEditorStore((s) => s.onNodesChange);
  const onEdgesChange = useEditorStore((s) => s.onEdgesChange);
  const addNode = useEditorStore((s) => s.addNode);
  const addEdge = useEditorStore((s) => s.addEdge);
  const removeSelected = useEditorStore((s) => s.removeSelected);
  const selectNode = useEditorStore((s) => s.selectNode);
  const pushHistory = useEditorStore((s) => s.pushHistory);
  const save = useEditorStore((s) => s.save);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const { screenToFlowPosition, fitView, zoomIn, zoomOut } = useReactFlow();

  /* Zoom dari toolbar editor (event netsim:zoom) */
  useEffect(() => {
    const onZoom = (e: Event) => {
      const delta = (e as CustomEvent<number>).detail;
      if (typeof delta === "number") {
        if (delta > 0) void zoomIn({ duration: 120 });
        else void zoomOut({ duration: 120 });
      }
    };
    window.addEventListener("netsim:zoom", onZoom);
    return () => window.removeEventListener("netsim:zoom", onZoom);
  }, [zoomIn, zoomOut]);

  /* fitView SEKALI hanya saat LOAD dgn node tersimpan; editor kosong → viewport tetap (drop akurat) */
  const fittedOnce = useRef(false);
  const initialCount = useRef(nodes.length);
  useEffect(() => {
    if (initialCount.current > 0 && !fittedOnce.current) {
      fittedOnce.current = true;
      void fitView({ padding: 0.25, maxZoom: 1, duration: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const existingNames = useRef(new Set<string>());
  useEffect(() => {
    existingNames.current = new Set(nodes.map((n) => n.data.hostname));
  }, [nodes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Drag & drop dari toolbelt ---------- */
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const deviceType = e.dataTransfer.getData("application/netsim-device");
      if (!deviceType) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const node = createDefaultNode(
        deviceType as FlowNode["data"]["type"],
        { x: position.x - 80, y: position.y - 30 },
        existingNames.current
      );
      existingNames.current.add(node.properties.hostname);
      addNode({
        id: node.id,
        type: "device",
        position: node.position,
        data: {
          type: node.type,
          vendor: node.vendor,
          hostname: node.properties.hostname,
          model: "",
          interfaces: node.properties.interfaces,
        },
      } as FlowNode);
    },
    [screenToFlowPosition, addNode]
  );

  /* ---------- Kabel baru ---------- */
  const onConnect = useCallback(
    (conn: Connection) => {
      const edge: Edge = {
        id: `edge-${Date.now().toString(36)}`,
        source: conn.source,
        target: conn.target,
        sourceHandle: conn.sourceHandle,
        targetHandle: conn.targetHandle,
        style: { stroke: "#4A5468", strokeWidth: 2 },
      };
      addEdge(edge);
    },
    [addEdge]
  );

  /* ---------- Auto-save (debounce 2s) ---------- */
  const firstRender = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (saveState !== "dirty") return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void save();
    }, 2000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [nodes, edges, saveState, save]);

  /* ---------- Keyboard: undo/redo ---------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  /* ---------- Save state pill ---------- */
  const pill =
    saveState === "saving"
      ? { text: "Menyimpan...", cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" }
      : saveState === "error"
        ? { text: "Gagal menyimpan", cls: "text-red-400 bg-red-500/10 border-red-500/20" }
        : saveState === "dirty"
          ? { text: "Belum disimpan", cls: "text-secondary bg-surface/80 border-border-muted" }
          : { text: "✓ Tersimpan otomatis", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };

  return (
    <div className="relative flex-1 min-w-0 h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onSelectionChange={({ nodes: sel }) =>
          selectNode(sel.length === 1 ? sel[0].id : null)
        }
        onNodeDoubleClick={(_e, node) => selectNode(node.id)}
        nodeTypes={nodeTypes}
        deleteKeyCode={["Delete", "Backspace"]}
        onBeforeDelete={async ({ nodes: delNodes }) => {
          if (delNodes.length > 0) pushHistory();
          return true;
        }}
        snapToGrid
        snapGrid={[16, 16]}
        defaultViewport={{ x: 0, y: 0, zoom: 0.9 }}
        minZoom={0.2}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        colorMode="dark"
        onMoveEnd={(e) => {
          const zoom = (e as unknown as { zoom?: number }).zoom ?? 1;
          window.dispatchEvent(new CustomEvent("netsim:zoomchange", { detail: zoom }));
        }}
        className="grid-bg bg-bg"
      >
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeStrokeWidth={2}
          nodeColor={(n: Node) => {
            const d = n.data as { vendor?: string };
            const colors: Record<string, string> = {
              mikrotik: "#E8734A",
              cisco: "#4AA8E8",
              linux: "#B08CFF",
              generic: "#F2F3F5",
            };
            return colors[d.vendor ?? "generic"] ?? "#F2F3F5";
          }}
        />
      </ReactFlow>

      {/* Status pill */}
      <div
        className={`absolute top-4 left-1/2 -translate-x-1/2 z-10 text-[11px] font-semibold px-3 py-1.5 rounded-full border backdrop-blur ${pill.cls}`}
      >
        {pill.text}
      </div>

      {/* Hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 text-[10px] text-dim bg-surface/80 backdrop-blur px-3 py-1 rounded-full border border-border-muted pointer-events-none">
        Ctrl+Z undo · Ctrl+Y redo · Del hapus · seret dari Library untuk tambah perangkat
      </div>
    </div>
  );
}

export function TopologyCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
