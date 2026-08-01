import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB, Project } from "@/lib/db";

/* ============================================================
 * PUT /api/projects/[id]/configs — simpan config per node
 * Body: { nodeId, script }
 * ============================================================ */

const bodySchema = z.object({
  nodeId: z.string().min(1).max(60),
  script: z.string().max(20000),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "ID proyek tidak valid." }, { status: 400 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Body tidak valid (nodeId + script)." }, { status: 400 });
  }

  await connectDB();
  const project = await Project.findOne({ _id: id, ownerId: session.user.id, deletedAt: null });
  if (!project) {
    return NextResponse.json({ error: "Proyek tidak ditemukan." }, { status: 404 });
  }

  const node = (project.topology?.nodes ?? []).find((n: any) => n.id === body.nodeId);
  if (!node) {
    return NextResponse.json({ error: "Node tidak ditemukan di topologi." }, { status: 404 });
  }

  // Upsert config untuk node ini
  const existing = project.configs.find((c: any) => c.nodeId === body.nodeId);
  if (existing) {
    existing.script = body.script;
    existing.generatedBy = "user";
    existing.lastValidatedAt = null;
    existing.isValid = null;
  } else {
    project.configs.push({
      nodeId: body.nodeId,
      vendor: node.vendor,
      script: body.script,
      generatedBy: "user",
      isValid: null,
      lastValidatedAt: null,
    });
  }
  await project.save();

  return NextResponse.json({ ok: true, configs: project.configs });
}
