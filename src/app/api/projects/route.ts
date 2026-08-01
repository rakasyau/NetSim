import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB, Project, ActivityLog } from "@/lib/db";

/* ---------------------------------------------------------
 * GET  /api/projects — daftar proyek milik user (aktif)
 *      Query: ?search=&status=&tag=&sort=&limit=&offset=
 * POST /api/projects — buat proyek baru
 * ------------------------------------------------------- */
const createSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(150),
  description: z.string().trim().max(1000).optional().default(""),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";
  const tag = searchParams.get("tag")?.trim() ?? "";
  const sort = searchParams.get("sort") ?? "updatedAt";
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  await connectDB();

  // Filter dasar: milik user & tidak terhapus
  const filter: Record<string, unknown> = {
    ownerId: session.user.id,
    deletedAt: null,
  };

  if (status && ["draft", "completed", "shared"].includes(status)) {
    filter.status = status;
  }
  if (tag) {
    filter.tags = tag;
  }
  if (search) {
    // text index: name & description
    filter.$text = { $search: search };
  }

  const sortField: Record<string, 1 | -1> =
    sort === "name" ? { name: 1 } : sort === "createdAt" ? { createdAt: -1 } : { updatedAt: -1 };

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .sort(sortField)
      .skip(offset)
      .limit(limit)
      .select("name description status tags topology.nodes updatedAt createdAt"),
    Project.countDocuments(filter),
  ]);

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
    total,
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
