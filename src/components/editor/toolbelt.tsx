"use client";

/* ---------------------------------------------------------
 * Toolbelt — palet perangkat di sisi kiri editor.
 * Drag chip ke canvas untuk menambah node (drag data
 * transfer "application/netsim-device").
 * ------------------------------------------------------- */
import { DEVICE_CATALOG, TOOLBELT_ORDER } from "@/lib/device-catalog";
import { useEditorStore } from "@/components/editor/editor-store";
import { validateTopology } from "@/lib/topology-validation";

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
    <aside className="w-[176px] shrink-0 border-r border-[var(--border-soft)] bg-[var(--surface)] flex flex-col">
      <div className="px-3.5 py-3 border-b border-[var(--border-soft)]">
        <h3 className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-dim)]">
          Perangkat
        </h3>
        <p className="text-[10px] text-[var(--text-dim)] mt-0.5">
          Seret ke kanvas
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1.5">
        {TOOLBELT_ORDER.map((t) => {
          const info = DEVICE_CATALOG[t];
          return (
            <div
              key={t}
              draggable
              onDragStart={(e) => onDragStart(e, t)}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-alt)]/50 cursor-grab active:cursor-grabbing hover:border-[var(--border-strong)] hover:bg-[var(--surface-alt)] transition-colors select-none"
              title={`${info.label} (${info.model})`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: info.color, boxShadow: `0 0 6px ${info.color}66` }}
              />
              <span className="text-[11.5px] font-medium text-[var(--text-primary)]">
                {info.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Validasi summary */}
      <div className="border-t border-[var(--border-soft)] px-3.5 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-dim)]">
            Validasi
          </span>
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
          <ul className="mt-2 space-y-1">
            {warnings.slice(0, 4).map((w, i) => (
              <li
                key={i}
                className={`text-[10px] leading-snug ${
                  w.level === "error"
                    ? "text-red-400"
                    : w.level === "warning"
                      ? "text-amber-400"
                      : "text-[var(--text-dim)]"
                }`}
              >
                {w.level === "error" ? "●" : w.level === "warning" ? "▲" : "○"} {w.message}
              </li>
            ))}
            {warnings.length > 4 && (
              <li className="text-[10px] text-[var(--text-dim)]">+{warnings.length - 4} lainnya...</li>
            )}
          </ul>
        )}
      </div>
    </aside>
  );
}
