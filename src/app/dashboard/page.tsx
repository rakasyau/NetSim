import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB, Project } from "@/lib/db";
import { ProjectList } from "@/components/project-list";

/* ---------------------------------------------------------
 * Dashboard — stat cards (server) + list proyek (client)
 * ------------------------------------------------------- */
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await connectDB();
  const [projects, totalProjects, completedCount, draftCount] = await Promise.all([
    Project.find({ ownerId: session.user.id, deletedAt: null })
      .sort({ updatedAt: -1 })
      .limit(50)
      .select("name description status tags topology.nodes updatedAt createdAt"),
    Project.countDocuments({ ownerId: session.user.id, deletedAt: null }),
    Project.countDocuments({
      ownerId: session.user.id,
      deletedAt: null,
      status: "completed",
    }),
    Project.countDocuments({
      ownerId: session.user.id,
      deletedAt: null,
      status: "draft",
    }),
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

  const lastEdited = projects[0]?.updatedAt
    ? new Date(projects[0].updatedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      })
    : "—";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-[var(--font-manrope)] font-bold text-xl">
            Halo, {session.user.name?.split(" ")[0] ?? "Pengguna"} 👋
          </h2>
          <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
            Kelola topologi jaringanmu di sini.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card-dark p-5">
          <p className="text-[11px] text-[var(--text-dim)] uppercase tracking-wide font-semibold">
            Total Proyek
          </p>
          <p className="font-[var(--font-manrope)] font-extrabold text-3xl mt-1.5 text-[var(--accent)]">
            {totalProjects}
          </p>
        </div>
        <div className="card-dark p-5">
          <p className="text-[11px] text-[var(--text-dim)] uppercase tracking-wide font-semibold">
            Draft
          </p>
          <p className="font-[var(--font-manrope)] font-extrabold text-3xl mt-1.5">{draftCount}</p>
        </div>
        <div className="card-dark p-5">
          <p className="text-[11px] text-[var(--text-dim)] uppercase tracking-wide font-semibold">
            Selesai
          </p>
          <p className="font-[var(--font-manrope)] font-extrabold text-3xl mt-1.5">
            {completedCount}
          </p>
        </div>
      </div>

      <h3 className="font-[var(--font-manrope)] font-bold text-[15px] mb-3">
        Proyek <span className="text-[var(--text-dim)] font-normal text-[12px]">({totalProjects})</span>
      </h3>

      <ProjectList initialProjects={serialized} />
    </div>
  );
}
