import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB, Project } from "@/lib/db";
import Link from "next/link";

/* ---------------------------------------------------------
 * Editor — Fase 3 (React Flow). Placeholder sementara agar
 * alur "Buat Proyek → Buka Editor" tidak 404.
 * ------------------------------------------------------- */
export const dynamic = "force-dynamic";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const project = await Project.findOne({
    _id: id,
    ownerId: session.user.id,
    deletedAt: null,
  });

  if (!project) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="card-dark p-10 max-w-[440px] text-center">
        <div className="w-12 h-12 rounded-xl bg-[var(--accent-dim)] text-[var(--accent)] flex items-center justify-center mx-auto mb-4 text-xl">
          ◧
        </div>
        <h1 className="font-[var(--font-manrope)] font-bold text-lg mb-1.5">
          Editor belum aktif
        </h1>
        <p className="text-[13px] text-[var(--text-muted)] mb-6">
          Topology Builder (drag &amp; drop, kabel, property panel) dibangun di
          Fase 3. Proyek <b className="text-[var(--text-primary)]">{project.name}</b>{" "}
          sudah tersimpan dan menunggu editor.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="btn-dark no-underline text-[13px]">
            ← Kembali
          </Link>
        </div>
      </div>
    </div>
  );
}
