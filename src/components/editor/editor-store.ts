"use client";

/* ---------------------------------------------------------
 * Editor store (zustand) — state nodes/edges/selected +
 * undo-redo stack + auto-save ke /api/projects/[id].
 * ------------------------------------------------------- */
import { create } from "zustand";
import { applyNodeChanges, applyEdgeChanges, type NodeChange, type EdgeChange } from "@xyflow/react";
import { toStored, type FlowEdge, type FlowNode } from "@/lib/topology-types";

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

type Snapshot = { nodes: FlowNode[]; edges: FlowEdge[] };

type EditorStore = {
  projectId: string | null;
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNodeId: string | null;
  saveState: SaveState;
  history: Snapshot[];
  future: Snapshot[];
  error: string | null;

  init: (projectId: string, nodes: FlowNode[], edges: FlowEdge[]) => void;
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
  addNode: (node: FlowNode) => void;
  addEdge: (edge: FlowEdge) => void;
  applyTopology: (nodes: FlowNode[], edges: FlowEdge[]) => void;
  removeSelected: () => void;
  updateNodeData: (nodeId: string, patch: Partial<FlowNode["data"]>) => void;
  selectNode: (nodeId: string | null) => void;
  markDirty: () => void;
  setSaveState: (s: SaveState, error?: string) => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  save: () => Promise<boolean>;
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  projectId: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  saveState: "idle",
  history: [],
  future: [],
  error: null,

  init: (projectId, nodes, edges) =>
    set({ projectId, nodes, edges, selectedNodeId: null, saveState: "idle", history: [], future: [], error: null }),

  onNodesChange: (changes) => {
    const isDragEnd = changes.some((c) => c.type === "position" && c.dragging === false);
    if (isDragEnd) get().pushHistory();
    set({ nodes: applyNodeChanges(changes, get().nodes) });
    // select sync
    const selectChange = changes.find((c) => c.type === "select");
    if (selectChange && "selected" in selectChange) {
      get().selectNode(selectChange.selected ? selectChange.id : null);
    }
    if (changes.some((c) => c.type === "remove")) get().pushHistory();
  },

  onEdgesChange: (changes) => {
    if (changes.some((c) => c.type === "remove")) get().pushHistory();
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  addNode: (node) => {
    get().pushHistory();
    set((s) => ({ nodes: [...s.nodes, node], selectedNodeId: node.id, saveState: "dirty" }));
  },

  addEdge: (edge) => {
    get().pushHistory();
    set((s) => ({ edges: [...s.edges, edge], saveState: "dirty" }));
  },

  /* Terapkan hasil AI (topologi) — satu langkah undo, replace seluruh nodes/edges */
  applyTopology: (nodes, edges) => {
    get().pushHistory();
    set({ nodes, edges, selectedNodeId: null, saveState: "dirty" });
  },

  removeSelected: () => {
    const { selectedNodeId, nodes } = get();
    if (!selectedNodeId) return;
    get().pushHistory();
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== selectedNodeId),
      edges: s.edges.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId),
      selectedNodeId: null,
      saveState: "dirty",
    }));
    void nodes; // keep tsc quiet
  },

  updateNodeData: (nodeId, patch) => {
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n)),
      saveState: "dirty",
    }));
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  markDirty: () => set({ saveState: "dirty" }),
  setSaveState: (s, error) => set({ saveState: s, error: error ?? null }),

  pushHistory: () => {
    const { nodes, edges, history } = get();
    // jangan simpan snapshot identik berturut-turut
    const last = history[history.length - 1];
    if (last && last.nodes.length === nodes.length && last.edges.length === edges.length) return;
    set({ history: [...history.slice(-49), { nodes, edges }], future: [] });
  },

  undo: () => {
    const { history, nodes, edges } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    set({
      history: history.slice(0, -1),
      future: [...get().future, { nodes, edges }],
      nodes: prev.nodes,
      edges: prev.edges,
      selectedNodeId: null,
      saveState: "dirty",
    });
  },

  redo: () => {
    const { future, nodes, edges } = get();
    if (future.length === 0) return;
    const next = future[future.length - 1];
    set({
      future: future.slice(0, -1),
      history: [...get().history, { nodes, edges }],
      nodes: next.nodes,
      edges: next.edges,
      selectedNodeId: null,
      saveState: "dirty",
    });
  },

  save: async () => {
    const { projectId, nodes, edges } = get();
    if (!projectId) return false;
    set({ saveState: "saving" });
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topology: toStored(nodes, edges) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      set({ saveState: "saved", error: null });
      return true;
    } catch (e) {
      set({ saveState: "error", error: e instanceof Error ? e.message : "Gagal menyimpan" });
      return false;
    }
  },
}));

/* === END editor-store === */
