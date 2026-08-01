/* Status badge — pill CyberNet dengan dot */
const STYLES: Record<string, { text: string; dot: string; label: string }> = {
  draft: { text: "text-secondary", dot: "bg-secondary", label: "Draft" },
  completed: { text: "text-neon", dot: "bg-neon", label: "Selesai" },
  shared: { text: "text-emerald", dot: "bg-emerald", label: "Dibagikan" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STYLES[status] ?? STYLES.draft;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-container border border-border-muted text-[11px] font-semibold ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
