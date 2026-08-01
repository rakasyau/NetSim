"use client";

/* ---------------------------------------------------------
 * PropertyPanel — panel kanan editor (tab Properti).
 * Klik node → form nama/hostname + interfaces (name/IP/VLAN).
 * Semua perubahan langsung ke store → auto-save.
 * ------------------------------------------------------- */
import { useState } from "react";
import { deviceInfo } from "@/lib/device-catalog";
import { useEditorStore } from "@/components/editor/editor-store";
import type { FlowNode, StoredInterface } from "@/lib/topology-types";

export function PropertyPanel() {
  const nodes = useEditorStore((s) => s.nodes);
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const updateNodeData = useEditorStore((s) => s.updateNodeData);
  const removeSelected = useEditorStore((s) => s.removeSelected);

  const node = nodes.find((n) => n.id === selectedNodeId) ?? null;

  if (!node) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-xl border border-dashed border-[var(--border-strong)] flex items-center justify-center text-[var(--text-dim)] mb-3 text-lg">
          ⬚
        </div>
        <p className="text-[13px] font-semibold text-[var(--text-muted)]">Belum ada perangkat dipilih</p>
        <p className="text-[11px] text-[var(--text-dim)] mt-1 leading-relaxed">
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
      onUpdate={(patch) => updateNodeData(node.id, patch)}
      onDelete={removeSelected}
    />
  );
}

/* Form editor perangkat — komponen terpisah agar TS narrow tipe node */
function NodeEditorForm({
  node,
  onUpdate,
  onDelete,
}: {
  node: FlowNode;
  onUpdate: (patch: Partial<FlowNode["data"]>) => void;
  onDelete: () => void;
}) {
  const info = deviceInfo(node.data.type);

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
      interfaces: [
        ...node.data.interfaces,
        { name: `${prefix}${n}`, ip: "", vlan: undefined },
      ],
    });
  }

  function removeInterface(index: number) {
    if (node.data.interfaces.length <= 1) return;
    onUpdate({
      interfaces: node.data.interfaces.filter((_, idx) => idx !== index),
    });
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-3 border-b border-[var(--border-soft)] flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold"
          style={{ background: `${info.color}24`, color: info.color }}
        >
          {info.icon}
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold truncate">{info.label}</p>
          <p className="text-[10px] text-[var(--text-dim)] font-mono">{info.model}</p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Nama perangkat */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider font-bold text-[var(--text-dim)] mb-1.5">
            Nama Perangkat
          </label>
          <input
            className="input-dark"
            value={node.data.hostname}
            onChange={(e) => setHostname(e.target.value)}
          />
        </div>

        {/* Interfaces */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-dim)]">
              Interfaces ({node.data.interfaces.length})
            </label>
            <button
              onClick={addInterface}
              className="text-[10px] font-semibold text-[var(--accent)] hover:underline cursor-pointer"
            >
              + Tambah
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {node.data.interfaces.map((iface, i) => (
              <div
                key={`${iface.name}-${i}`}
                className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-alt)]/40 p-2.5"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <input
                    className="input-dark !py-1 !text-[11px] font-mono flex-1"
                    value={iface.name}
                    onChange={(e) => setInterface(i, { name: e.target.value })}
                    placeholder="eth0"
                  />
                  <button
                    onClick={() => removeInterface(i)}
                    disabled={node.data.interfaces.length <= 1}
                    className="w-6 h-6 rounded flex items-center justify-center text-[11px] text-red-400/70 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30 cursor-pointer"
                    title="Hapus interface"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    className="input-dark !py-1 !text-[11px] font-mono flex-1"
                    value={iface.ip}
                    onChange={(e) => setInterface(i, { ip: e.target.value })}
                    placeholder="IP (mis. 10.0.0.1/24)"
                  />
                  <input
                    className="input-dark !py-1 !text-[11px] font-mono w-[72px]"
                    value={iface.vlan ?? ""}
                    onChange={(e) =>
                      setInterface(i, {
                        vlan: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                    placeholder="VLAN"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aksi */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onDelete}
            className="flex-1 text-[12px] px-3 py-2 rounded-lg border border-red-500/25 text-red-400 hover:bg-red-500/10 cursor-pointer"
          >
            Hapus Perangkat
          </button>
        </div>
      </div>
    </div>
  );
}
