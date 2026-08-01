/* ---------------------------------------------------------
 * Tipe & konversi topology: format penyimpanan (PRD) ↔
 * format React Flow (@xyflow/react).
 * ------------------------------------------------------- */
import type { Edge, Node } from "@xyflow/react";
import type { DeviceType, DeviceVendor } from "@/lib/device-catalog";

/* ---------- Format penyimpanan (PRD §7.2) ---------- */
export type StoredInterface = {
  name: string;
  ip: string;
  vlan?: number;
};

export type StoredNode = {
  id: string;
  type: DeviceType;
  vendor: DeviceVendor;
  position: { x: number; y: number };
  properties: {
    hostname: string;
    interfaces: StoredInterface[];
  };
};

export type StoredEdge = {
  id: string;
  source: string;
  target: string;
  sourceInterface?: string;
  targetInterface?: string;
  linkType?: "ethernet" | "fiber" | "wireless";
};

export type StoredTopology = {
  nodes: StoredNode[];
  edges: StoredEdge[];
};

/* ---------- Format React Flow ---------- */
export type FlowNodeData = {
  type: DeviceType;
  vendor: DeviceVendor;
  hostname: string;
  model: string;
  interfaces: StoredInterface[];
};

export type FlowNode = Node<FlowNodeData>;
export type FlowEdge = Edge;

/** Konversi penyimpanan → React Flow */
export function toFlow(topology: StoredTopology | null | undefined): {
  nodes: FlowNode[];
  edges: FlowEdge[];
} {
  const nodes: FlowNode[] = (topology?.nodes ?? []).map((n) => ({
    id: n.id,
    type: "device",
    position: n.position,
    data: {
      type: n.type,
      vendor: n.vendor,
      hostname: n.properties?.hostname ?? "Tanpa-nama",
      model: "",
      interfaces: n.properties?.interfaces ?? [],
    },
  }));

  const edges: FlowEdge[] = (topology?.edges ?? []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceInterface ? `source-${e.sourceInterface}` : undefined,
    targetHandle: e.targetInterface ? `target-${e.targetInterface}` : undefined,
    label: e.linkType === "wireless" ? "📡" : "",
    style: { stroke: e.linkType === "wireless" ? "#F5C542" : "#3E4451", strokeWidth: 2 },
  }));

  return { nodes, edges };
}

/** Konversi React Flow → penyimpanan */
export function toStored(nodes: FlowNode[], edges: FlowEdge[]): StoredTopology {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.data.type,
      vendor: n.data.vendor,
      position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
      properties: {
        hostname: n.data.hostname,
        interfaces: n.data.interfaces,
      },
    })),
    edges: edges.map((e) => {
      const sIf = e.sourceHandle?.replace(/^source-/, "");
      const tIf = e.targetHandle?.replace(/^target-/, "");
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        sourceInterface: sIf ?? undefined,
        targetInterface: tIf ?? undefined,
        linkType: sIf === "wlan0" || tIf === "wlan0" ? "wireless" : "ethernet",
      };
    }),
  };
}
