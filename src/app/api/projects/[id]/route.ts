import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB, Project, ActivityLog } from "@/lib/db";

/* ---------------------------------------------------------
 * GET    /api/projects/[id] — detail proyek (ownership check)
 * PUT    /api/projects/[id] — update nama/deskripsi/status/tags
 * DELETE /api/projects/[id] — soft delete (deletedAt)
 * ------------------------------------------------------- */
const updateSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(150).optional(),
  description: z.string().trim().max(1000).optional(),
  status: z.enum(["draft", "completed", "shared"]).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
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

  return NextResponse.json({ project });
}

export async function PUT(req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  await connectDB();

  const project = await Project.findOneAndUpdate(
    { _id: id, ownerId: session.user.id, deletedAt: null },
    { $set: parsed.data },
    { returnDocument: "after" }
  );

  if (!project) {
    return NextResponse.json({ error: "Proyek tidak ditemukan" }, { status: 404 });
  }

  await ActivityLog.create({
    userId: session.user.id,
    projectId: project._id,
    action: "project_updated",
    metadata: { fields: Object.keys(parsed.data) },
  });

  return NextResponse.json({ project });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();

  const project = await Project.findOneAndUpdate(
    { _id: id, ownerId: session.user.id, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { returnDocument: "after" }
  );

  if (!project) {
    return NextResponse.json({ error: "Proyek tidak ditemukan" }, { status: 404 });
  }

  await ActivityLog.create({
    userId: session.user.id,
    projectId: project._id,
    action: "project_deleted",
    metadata: { name: project.name },
  });

  return NextResponse.json({ ok: true, deletedAt: project.deletedAt });
}
