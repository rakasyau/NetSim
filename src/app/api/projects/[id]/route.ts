import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB, Project, ActivityLog } from "@/lib/db";

/* ---------------------------------------------------------
 * GET    /api/projects/[id] — detail proyek (ownership check)
 * PUT    /api/projects/[id] — update nama/deskripsi/status/tags
 * DELETE /api/projects/[id] — soft delete (deletedAt)
 * ------------------------------------------------------- */
const interfaceSchema = z.object({
  name: z.string().trim().min(1).max(30),
  ip: z.string().trim().max(40).optional().default(""),
  vlan: z.number().int().min(1).max(4094).nullable().optional(),
});

const topologySchema = z.object({
  nodes: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        type: z.enum(["router", "switch", "server", "pc", "laptop", "ap", "firewall", "cloud", "printer"]),
        vendor: z.enum(["mikrotik", "cisco", "linux", "generic"]),
        position: z.object({ x: z.number(), y: z.number() }),
        properties: z.object({
          hostname: z.string().trim().min(1).max(60),
          interfaces: z.array(interfaceSchema).max(24),
        }),
      })
    )
    .max(200),
  edges: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        source: z.string().min(1).max(60),
        target: z.string().min(1).max(60),
        sourceInterface: z.string().max(30).optional(),
        targetInterface: z.string().max(30).optional(),
        linkType: z.enum(["ethernet", "fiber", "wireless"]).optional(),
      })
    )
    .max(400),
});

const updateSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(150).optional(),
  description: z.string().trim().max(1000).optional(),
  status: z.enum(["draft", "completed", "shared"]).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
  topology: topologySchema.optional(),
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
