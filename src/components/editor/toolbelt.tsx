"use client";

/* ---------------------------------------------------------
 * Toolbelt — floating "Library" perangkat (mockup editor).
 * Drag chip ke canvas untuk menambah node (drag data
 * transfer "application/netsim-device").
 * ------------------------------------------------------- */
import { DEVICE_CATALOG, TOOLBELT_ORDER } from "@/lib/device-catalog";
import { useEditorStore } from "@/components/editor/editor-store";
import { validateTopology } from "@/lib/topology-validation";
import { Icon } from "@/components/icons";

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

export function Toolbelt() {
  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);

  const warnings = validateTopology(nodes, edges);
  const errors = warnings.filter((w) => w.level === "error").length;

  function onDragStart(e: React.DragEvent, deviceType: string) {
    e.dataTransfer.setData("application/netsim-device", deviceType);
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <div className="absolute left-4 top-4 z-20 bg-surface/90 backdrop-blur-md border border-border-muted rounded-lg shadow-lg w-52 flex flex-col">
      {/* Header */}
      <div className="p-2 border-b border-border-muted label-caps text-secondary">
        Library
      </div>

      {/* Devices */}
      <div className="p-2 flex flex-col gap-0.5 max-h-[420px] overflow-y-auto">
        {TOOLBELT_ORDER.map((t) => {
          const info = DEVICE_CATALOG[t];
          return (
            <div
              key={t}
              draggable
              onDragStart={(e) => onDragStart(e, t)}
              className="flex items-center gap-3 p-2 hover:bg-surface-2 rounded cursor-grab active:cursor-grabbing text-secondary hover:text-neon transition-colors select-none"
              title={`${info.label} (${info.model})`}
            >
              <span
                className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[13px] font-bold shrink-0"
                style={{ background: `${info.color}22`, color: info.color }}
              >
                <Icon name={TYPE_ICON[t] ?? "dns"} size={16} />
              </span>
              <span className="text-[13px] font-medium">{info.label}</span>
            </div>
          );
        })}
      </div>

      {/* Validasi summary */}
      <div className="border-t border-border-muted px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="label-caps text-dim text-[10px]">Validasi</span>
          {errors > 0 && (
            <span className="text-[10px] font-bold bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded">
              {errors} error
            </span>
          )}
          {errors === 0 && warnings.length > 0 && (
            <span className="text-[10px] font-bold bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded">
              {warnings.length - errors} catatan
            </span>
          )}
          {warnings.length === 0 && (
            <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded">
              OK
            </span>
          )}
        </div>
        {warnings.length > 0 && (
          <ul className="mt-1.5 space-y-1">
            {warnings.slice(0, 4).map((w, i) => (
              <li
                key={i}
                className={`text-[10px] leading-snug ${
                  w.level === "error"
                    ? "text-red-400"
                    : w.level === "warning"
                      ? "text-amber-400"
                      : "text-dim"
                }`}
              >
                {w.level === "error" ? "●" : w.level === "warning" ? "▲" : "○"} {w.message}
              </li>
            ))}
            {warnings.length > 4 && (
              <li className="text-[10px] text-dim">+{warnings.length - 4} lainnya...</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
