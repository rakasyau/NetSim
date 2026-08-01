import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB, Project, ActivityLog } from "@/lib/db";

/* ---------------------------------------------------------
 * GET  /api/projects — daftar proyek milik user (aktif)
 * POST /api/projects — buat proyek baru
 * (CRUD lengkap: GET one / PUT / DELETE / duplicate → Fase 2)
 * ------------------------------------------------------- */
const createSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(150),
  description: z.string().trim().max(1000).optional().default(""),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const projects = await Project.find({
    ownerId: session.user.id,
    deletedAt: null,
  })
    .sort({ updatedAt: -1 })
    .select("name description status tags topology.nodes updatedAt createdAt");

  return NextResponse.json({
    projects: projects.map((p) => ({
      id: String(p._id),
      name: p.name,
      description: p.description,
      status: p.status,
      tags: p.tags,
      nodeCount: p.topology?.nodes?.length ?? 0,
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  await connectDB();
  const project = await Project.create({
    ownerId: session.user.id,
    name: parsed.data.name,
    description: parsed.data.description,
    topology: { nodes: [], edges: [] },
    configs: [],
    aiChatHistory: [],
    versions: [],
  });

  await ActivityLog.create({
    userId: session.user.id,
    projectId: project._id,
    action: "project_created",
    metadata: { name: parsed.data.name },
  });

  return NextResponse.json({ project: { id: String(project._id) } }, { status: 201 });
}
