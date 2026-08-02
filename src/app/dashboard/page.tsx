import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB, Project } from "@/lib/db";
import { ProjectList } from "@/components/project-list";
import AppShell from "@/components/app-shell";
import { Icon } from "@/components/icons";

/* ---------------------------------------------------------
 * Dashboard — Overview: metric bento CyberNet (dari mockup)
 * ------------------------------------------------------- */
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await connectDB();
  const [projects, totalProjects, completedCount, draftCount, nodeTotal] = await Promise.all([
    Project.find({ ownerId: session.user.id, deletedAt: null })
      .sort({ updatedAt: -1 })
      .limit(50)
      .select("name description status tags topology.nodes updatedAt"),
    Project.countDocuments({ ownerId: session.user.id, deletedAt: null }),
    Project.countDocuments({
      ownerId: session.user.id,
      deletedAt: null,
      status: "completed",
    }),
    Project.countDocuments({ ownerId: session.user.id, deletedAt: null, status: "draft" }),
    Project.aggregate([
      { $match: { ownerId: session.user.id, deletedAt: null } },
      { $project: { n: { $size: { $ifNull: ["$topology.nodes", []] } } } },
      { $group: { _id: null, total: { $sum: "$n" } } },
    ]),
  ]);

  const serialized = projects.map((p) => ({
    id: String(p._id),
    name: p.name,
    description: p.description,
    status: p.status,
    tags: p.tags,
    nodeCount: p.topology?.nodes?.length ?? 0,
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
  }));

  const nodeSum = nodeTotal[0]?.total ?? 0;
  const storagePct = Math.min(100, Math.round((totalProjects / 24) * 65));

  const recent = projects.slice(0, 3).map((p) => ({
    name: p.name,
    nodes: p.topology?.nodes?.length ?? 0,
    ago: formatAgo(p.updatedAt),
  }));

  return (
    <AppShell active="dashboard" title="Ringkasan">
      <div className="p-8 bg-[radial-gradient(ellipse_at_top_right,rgba(30,35,41,0.5),transparent_60%)]">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-[32px] font-semibold tracking-tight text-primary mb-1">
            Halo, {session.user.name?.split(" ")[0] ?? "Pengguna"} 👋
          </h2>
          <p className="text-[16px] text-secondary">
            Pantau topologi aktif dan sumber daya sistemmu.
          </p>
        </div>

        {/* Metrics Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Metric 1: Total Proyek */}
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-neon/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Icon name="folder" size={56} className="text-neon" />
            </div>
            <p className="label-caps text-secondary mb-2">Total Proyek</p>
            <div className="flex items-end">
              <span className="text-[44px] font-bold leading-none text-primary">
                {totalProjects}
              </span>
              <span className="text-[13px] text-neon ml-2 mb-1 flex items-center gap-1">
                <Icon name="trend" size={14} /> {draftCount} draft
              </span>
            </div>
          </div>

          {/* Metric 2: Simulasi Aktif */}
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-neon/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Icon name="memory" size={56} className="text-neon" />
            </div>
            <div className="flex justify-between items-center mb-2">
              <p className="label-caps text-secondary">Simulasi Aktif</p>
              <span className="w-2 h-2 rounded-full bg-neon animate-pulse shadow-[0_0_8px_#c3f400]" />
            </div>
            <div className="flex items-end">
              <span className="text-[44px] font-bold leading-none text-neon text-glow">
                {completedCount}
              </span>
              <span className="text-[13px] text-secondary ml-2 mb-1">selesai</span>
            </div>
          </div>

          {/* Metric 3: Node Tersimpan */}
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-neon/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Icon name="dns" size={56} className="text-neon" />
            </div>
            <p className="label-caps text-secondary mb-2">Perangkat Tersimpan</p>
            <div className="flex items-end mb-3">
              <span className="text-[44px] font-bold leading-none text-primary">{nodeSum}</span>
              <span className="text-[13px] text-secondary ml-2 mb-1">node</span>
            </div>
            <div className="w-full bg-surface-2 rounded-full h-1.5">
              <div
                className="bg-neon h-1.5 rounded-full"
                style={{ width: `${Math.max(8, storagePct)}%` }}
              />
            </div>
          </div>

          {/* Metric 4: Aktivitas Terakhir */}
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-neon/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Icon name="history" size={56} className="text-neon" />
            </div>
            <p className="label-caps text-secondary mb-2">Aktivitas Terakhir</p>
            <div className="flex flex-col gap-3 mt-2 pr-16">
              {recent.length === 0 && (
                <p className="text-[13px] text-dim">Belum ada aktivitas.</p>
              )}
              {recent.map((r) => (
                <div key={r.name} className="flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon mr-2 flex-shrink-0" />
                  <span className="text-[13px] text-primary truncate flex-1">{r.name}</span>
                  <span className="text-[12px] text-dim ml-2">{r.ago}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Proyek Terakhir */}
        <h3 className="text-[18px] font-semibold text-primary mb-4">
          Proyek <span className="text-secondary font-normal text-[13px]">({totalProjects})</span>
        </h3>
        <ProjectList initialProjects={serialized} />
      </div>
    </AppShell>
  );
}

function formatAgo(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} mnt lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}
