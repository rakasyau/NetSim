"use client";

/* ---------------------------------------------------------
 * PropertyPanel — panel kanan editor (CyberNet mockup).
 * Device info + Basic Configuration + Interfaces cards.
 * ------------------------------------------------------- */
import { deviceInfo } from "@/lib/device-catalog";
import { useEditorStore } from "@/components/editor/editor-store";
import type { FlowNode, StoredInterface } from "@/lib/topology-types";

const VENDOR_LABEL: Record<string, string> = {
  mikrotik: "Mikrotik",
  cisco: "Cisco",
  linux: "Linux",
  generic: "Generic",
};

export function PropertyPanel() {
  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const updateNodeData = useEditorStore((s) => s.updateNodeData);
  const removeSelected = useEditorStore((s) => s.removeSelected);

  const node = nodes.find((n) => n.id === selectedNodeId) ?? null;

  if (!node) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-xl border border-dashed border-border-muted flex items-center justify-center text-dim mb-3">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18M15 3v18" />
          </svg>
        </div>
        <p className="text-[13px] font-semibold text-secondary">Belum ada perangkat dipilih</p>
        <p className="text-[12px] text-dim mt-1 leading-relaxed">
          Klik perangkat di kanvas untuk
          <br />
          melihat & mengedit propertinya.
        </p>
      </div>
    );
  }

  return (
    <NodeEditorForm
      node={node}
      nodes={nodes}
      edges={edges}
      onUpdate={(patch) => updateNodeData(node.id, patch)}
      onDelete={removeSelected}
    />
  );
}

/* Form editor perangkat — komponen terpisah agar TS narrow tipe node */
function NodeEditorForm({
  node,
  nodes,
  edges,
  onUpdate,
  onDelete,
}: {
  node: FlowNode;
  nodes: FlowNode[];
  edges: { source: string; target: string; sourceInterface?: string | null }[];
  onUpdate: (patch: Partial<FlowNode["data"]>) => void;
  onDelete: () => void;
}) {
  const info = deviceInfo(node.data.type);
  const mgmtIp = node.data.interfaces.find((i) => i.ip)?.ip ?? "";

  function setHostname(hostname: string) {
    onUpdate({ hostname });
  }

  function setInterface(index: number, patch: Partial<StoredInterface>) {
    const interfaces = node.data.interfaces.map((i, idx) =>
      idx === index ? { ...i, ...patch } : i
    );
    onUpdate({ interfaces });
  }

  function addInterface() {
    const n = node.data.interfaces.length + 1;
    const base = node.data.interfaces[0]?.name ?? "eth0";
    const prefix = base.replace(/[\d]+$/, "");
    onUpdate({
      interfaces: [...node.data.interfaces, { name: `${prefix}${n}`, ip: "", vlan: undefined }],
    });
  }

  function removeInterface(index: number) {
    if (node.data.interfaces.length <= 1) return;
    onUpdate({ interfaces: node.data.interfaces.filter((_, idx) => idx !== index) });
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Device Info Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-border-muted">
          <div
            className="w-10 h-10 rounded bg-surface-2 flex items-center justify-center border border-neon"
            style={{ color: info.color }}
          >
            <span className="text-[13px] font-bold">{info.icon}</span>
          </div>
          <div className="min-w-0">
            <div className="font-bold text-primary truncate">{node.data.hostname}</div>
            <div className="text-[12px] text-secondary flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-neon" /> Aktif
            </div>
          </div>
          <div className="ml-auto bg-surface-2 px-2 py-1 rounded text-[11px] text-secondary border border-border-muted shrink-0">
            {VENDOR_LABEL[info.vendor] ?? info.vendor}
          </div>
        </div>

        {/* Basic Configuration */}
        <div className="space-y-3.5">
          <h3 className="label-caps text-secondary">Konfigurasi Dasar</h3>
          <div>
            <label className="block text-[12px] text-secondary mb-1">Hostname</label>
            <input
              className="input-dark font-mono text-[13px]"
              value={node.data.hostname}
              onChange={(e) => setHostname(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[12px] text-secondary mb-1">IP Manajemen</label>
            <input
              className="input-dark font-mono text-[13px]"
              value={mgmtIp}
              onChange={(e) => {
                const idx = node.data.interfaces.findIndex((i) => i.ip);
                const target = idx >= 0 ? idx : 0;
                setInterface(target, { ip: e.target.value });
              }}
              placeholder="192.168.1.1/24"
            />
          </div>
        </div>

        {/* Interfaces */}
        <div className="space-y-2.5 pt-1 border-t border-border-muted">
          <div className="flex items-center justify-between">
            <h3 className="label-caps text-secondary">
              Interfaces ({node.data.interfaces.length})
            </h3>
            <button
              onClick={addInterface}
              className="text-neon hover:text-neon-2 transition-colors cursor-pointer"
              title="Tambah interface"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            {node.data.interfaces.map((iface, i) => (
              <InterfaceCard
                key={`${iface.name}-${i}`}
                iface={iface}
                connectedTo={connectedTo(node, iface.name, edges, nodes)}
                onChange={(patch) => setInterface(i, patch)}
                onRemove={() => removeInterface(i)}
                canRemove={node.data.interfaces.length > 1}
              />
            ))}
          </div>
        </div>

        {/* Aksi */}
        <button
          onClick={onDelete}
          className="w-full text-[12px] px-3 py-2 rounded-lg border border-danger/25 text-danger hover:bg-danger/10 cursor-pointer transition-colors"
        >
          Hapus Perangkat
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border-muted bg-container">
        <button className="w-full bg-surface-2 border border-border-muted text-primary py-2 rounded hover:bg-high transition-colors font-semibold text-[13px] cursor-pointer">
          Buka Terminal CLI
        </button>
      </div>
    </div>
  );
}

function connectedTo(
  node: FlowNode,
  ifaceName: string,
  edges: { source: string; target: string; sourceInterface?: string | null }[],
  nodes: FlowNode[]
): string | null {
  const edge = edges.find(
    (e) =>
      (e.source === node.id && e.sourceInterface === ifaceName) ||
      (e.target === node.id && e.sourceInterface === ifaceName)
  );
  if (!edge) return null;
  const otherId = edge.source === node.id ? edge.target : edge.source;
  const other = nodes.find((n) => n.id === otherId);
  return other?.data.hostname ?? null;
}

function InterfaceCard({
  iface,
  connectedTo,
  onChange,
  onRemove,
  canRemove,
}: {
  iface: StoredInterface;
  connectedTo: string | null;
  onChange: (patch: Partial<StoredInterface>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const up = connectedTo !== null;
  return (
    <div className={`bg-surface-2 border border-border-muted rounded p-2.5 ${up ? "" : "opacity-70"}`}>
      <div className="flex items-center justify-between mb-2 gap-2">
        <input
          className="bg-transparent border-none text-[12px] font-mono font-bold text-primary focus:outline-none focus:ring-1 focus:ring-neon rounded px-1 w-[90px]"
          value={iface.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="eth0"
        />
        <div className="flex items-center gap-1">
          <span
            className={`w-2 h-2 rounded-full ${up ? "bg-neon" : "bg-border-muted"}`}
            title={up ? "Terhubung" : "Tidak terhubung"}
          />
          <button
            onClick={onRemove}
            disabled={!canRemove}
            className="w-5 h-5 rounded flex items-center justify-center text-dim hover:bg-danger/10 hover:text-danger disabled:opacity-30 cursor-pointer"
            title="Hapus interface"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[12px]">
        <div>
          <div className="text-secondary text-[11px]">IP</div>
          <input
            className="bg-bg border border-border-muted rounded px-1.5 py-0.5 font-mono text-[12px] text-primary focus:outline-none focus:border-neon w-full"
            value={iface.ip}
            onChange={(e) => onChange({ ip: e.target.value })}
            placeholder="—"
          />
        </div>
        <div>
          <div className="text-secondary text-[11px]">Terhubung</div>
          <div
            className={`truncate font-mono text-[12px] ${
              connectedTo ? "text-neon" : "text-dim italic"
            }`}
            title={connectedTo ?? undefined}
          >
            {connectedTo ?? "—"}
          </div>
        </div>
      </div>
      <div className="mt-1.5">
        <div className="text-secondary text-[11px]">VLAN</div>
        <input
          className="bg-bg border border-border-muted rounded px-1.5 py-0.5 font-mono text-[12px] text-primary focus:outline-none focus:border-neon w-full"
          value={iface.vlan ?? ""}
          onChange={(e) =>
            onChange({ vlan: e.target.value === "" ? undefined : Number(e.target.value) })
          }
          placeholder="—"
        />
      </div>
    </div>
  );
}
