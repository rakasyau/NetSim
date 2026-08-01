import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB, Project } from "@/lib/db";
import { EditorClient } from "@/components/editor/editor-client";

/* ---------------------------------------------------------
 * /editor/[id] — halaman editor topologi.
 * Server component: cek auth + ownership, ambil project,
 * kirim data ke EditorClient (client).
 * ------------------------------------------------------- */
export const dynamic = "force-dynamic";

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  await connectDB();

  const project = await Project.findOne({
    _id: id,
    ownerId: session.user.id,
    deletedAt: null,
  }).lean();

  if (!project) redirect("/dashboard");

  const serialized = {
    id: String(project._id),
    name: project.name,
    description: project.description ?? "",
    topology: (project.topology ?? { nodes: [], edges: [] }) as {
      nodes: unknown[];
      edges: unknown[];
    },
  };

  return <EditorClient project={serialized} />;
}
