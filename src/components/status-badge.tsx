/* ---------------------------------------------------------
 * StatusBadge — badge status proyek (draft/completed/shared)
 * ------------------------------------------------------- */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    draft: {
      label: "Draft",
      className: "bg-[var(--accent-dim)] text-[var(--accent)]",
    },
    completed: {
      label: "Selesai",
      className: "bg-sky-500/10 text-sky-400",
    },
    shared: {
      label: "Dibagikan",
      className: "bg-purple-500/10 text-purple-400",
    },
  };

  const s = map[status] ?? map.draft;

  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${s.className}`}
    >
      {s.label}
    </span>
  );
}
