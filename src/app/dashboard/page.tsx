import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB, Project } from "@/lib/db";
import Link from "next/link";

/* ---------------------------------------------------------
 * Dashboard — stat cards + list proyek (Fase 2 akan lengkapi)
 * ------------------------------------------------------- */
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await connectDB();
  const projects = await Project.find({
    ownerId: session.user.id,
    deletedAt: null,
  })
    .sort({ updatedAt: -1 })
    .limit(10);

  const totalProjects = await Project.countDocuments({
    ownerId: session.user.id,
    deletedAt: null,
  });
  const completedCount = await Project.countDocuments({
    ownerId: session.user.id,
    deletedAt: null,
    status: "completed",
  });

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
        <Link href="/dashboard/new" className="btn-accent no-underline">
          + Buat Proyek
        </Link>
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
            Proyek Selesai
          </p>
          <p className="font-[var(--font-manrope)] font-extrabold text-3xl mt-1.5">
            {completedCount}
          </p>
        </div>
        <div className="card-dark p-5">
          <p className="text-[11px] text-[var(--text-dim)] uppercase tracking-wide font-semibold">
            Terakhir Diedit
          </p>
          <p className="font-[var(--font-manrope)] font-extrabold text-lg mt-2">
            {projects[0]
              ? new Date(projects[0].updatedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                })
              : "—"}
          </p>
        </div>
      </div>

      {/* List proyek */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-[var(--font-manrope)] font-bold text-[15px]">Proyek Terbaru</h3>
        <span className="text-[12px] text-[var(--text-dim)]">{totalProjects} proyek</span>
      </div>

      {projects.length === 0 ? (
        <div className="card-dark p-10 text-center">
          <p className="text-[15px] font-semibold mb-1">Belum ada proyek</p>
          <p className="text-[13px] text-[var(--text-muted)] mb-5">
            Buat proyek pertamamu untuk mulai merancang topologi jaringan.
          </p>
          <Link href="/dashboard/new" className="btn-accent no-underline text-[13px]">
            + Buat Proyek Pertama
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {projects.map((p) => (
            <div key={String(p._id)} className="card-dark p-5 hover:border-[var(--border)] transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-[14px]">{p.name}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-dim)] text-[var(--accent)] font-semibold uppercase">
                  {p.status}
                </span>
              </div>
              <p className="text-[12px] text-[var(--text-muted)] line-clamp-2 mb-3">
                {p.description || "Tanpa deskripsi"}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-dim)] font-mono">
                  {p.topology?.nodes?.length ?? 0} perangkat
                </span>
                <Link
                  href={`/editor/${p._id}`}
                  className="text-[12px] text-[var(--accent)] font-semibold no-underline hover:underline"
                >
                  Buka Editor →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
