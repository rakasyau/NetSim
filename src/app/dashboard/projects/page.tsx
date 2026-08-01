import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB, Project } from "@/lib/db";
import AppShell from "@/components/app-shell";
import { ProjectsTable } from "@/components/projects-table";

/* ---------------------------------------------------------
 * My Projects — tabel CyberNet (dari mockup)
 * ------------------------------------------------------- */
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await connectDB();
  const projects = await Project.find({ ownerId: session.user.id, deletedAt: null })
    .sort({ updatedAt: -1 })
    .limit(100)
    .select("name description status tags topology.nodes updatedAt");

  const serialized = projects.map((p) => ({
    id: String(p._id),
    name: p.name,
    description: p.description,
    status: p.status,
    tags: p.tags ?? [],
    nodes: (p.topology?.nodes ?? []).map((n: { type: string }) => ({ type: n.type })),
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
  }));

  return (
    <AppShell active="projects" title="Proyek Saya">
      <div className="p-8">
        <ProjectsTable initialProjects={serialized} />
      </div>
    </AppShell>
  );
}
