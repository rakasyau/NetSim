"use client";

/* ---------------------------------------------------------
 * NodeCard — custom node React Flow, porting gaya mockup:
 * head (icon 2-huruf + hostname + vendor) + baris interface.
 * Handle kiri/kanan disejajarkan PER BARIS interface agar
 * kabel menempel di interface yang benar (bukan di head).
 * ------------------------------------------------------- */
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { deviceInfo } from "@/lib/device-catalog";
import type { FlowNode } from "@/lib/topology-types";

/* HEAD_H + i*ROW_H + ROW_H/2 - 3.5 → titik tengah baris interface ke-i */
const HEAD_H = 44;
const ROW_H = 21;
function handleTop(i: number) {
  return `${HEAD_H + i * ROW_H + ROW_H / 2 - 3.5}px`;
}

function NodeCardInner({ data, selected }: NodeProps<FlowNode>) {
  const info = deviceInfo(data.type);

  return (
    <div
      className={[
        "netsim-node",
        selected ? "netsim-node-selected" : "",
      ].join(" ")}
      style={{ borderColor: selected ? info.color : undefined }}
    >
      {/* Handle kiri: target (masuk) — satu per interface */}
      {data.interfaces.map((iface, i) => (
        <Handle
          key={`t-${iface.name}`}
          type="target"
          position={Position.Left}
          id={`target-${iface.name}`}
          className="!w-[7px] !h-[7px] !bg-border-muted !border !border-surface !left-[-8px]"
          style={{ top: handleTop(i) }}
        />
      ))}

      {/* Handle kanan: source (keluar) */}
      {data.interfaces.map((iface, i) => (
        <Handle
          key={`s-${iface.name}`}
          type="source"
          position={Position.Right}
          id={`source-${iface.name}`}
          className="!w-[7px] !h-[7px] !bg-border-muted !border !border-surface !right-[-8px]"
          style={{ top: handleTop(i) }}
        />
      ))}

      <div className="node-head">
        <div
          className="node-ic"
          style={{ background: `${info.color}24`, color: info.color }}
        >
          {info.icon}
        </div>
        <div className="min-w-0">
          <div className="node-name">{data.hostname}</div>
          <div className="node-vendor">
            {info.label}
            {data.model ? ` · ${data.model}` : ""}
          </div>
        </div>
      </div>

      {/* Baris interface — kabel menempel di baris ini */}
      <div className="node-iface-list">
        {data.interfaces.map((iface, i) => (
          <div
            key={iface.name}
            className="node-iface"
            style={{
              top: HEAD_H + i * ROW_H,
              height: ROW_H,
            }}
          >
            <span className="font-mono text-[10px] text-secondary">
              {iface.name}
            </span>
            <span className="font-mono text-[10px] text-dim truncate">
              {iface.ip || "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const NodeCard = memo(NodeCardInner);
