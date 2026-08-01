import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, Project, ActivityLog } from "@/lib/db";

/* ---------------------------------------------------------
 * POST /api/projects/[id]/duplicate — clone proyek
 * ------------------------------------------------------- */
type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();

  const project = await Project.findOne({
    _id: id,
    ownerId: session.user.id,
    deletedAt: null,
  });

  if (!project) {
    return NextResponse.json({ error: "Proyek tidak ditemukan" }, { status: 404 });
  }

  const cloneData = project.duplicate();
  const clone = await Project.create(cloneData);

  await ActivityLog.create({
    userId: session.user.id,
    projectId: clone._id,
    action: "project_duplicated",
    metadata: { sourceId: String(project._id) },
  });

  return NextResponse.json({ project: { id: String(clone._id), name: clone.name } }, { status: 201 });
}
