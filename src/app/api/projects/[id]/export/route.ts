import { NextResponse } from "next/server";
import mongoose from "mongoose";
import JSZip from "jszip";
import { auth } from "@/lib/auth";
import { connectDB, Project, ActivityLog } from "@/lib/db";
import { scriptExtension } from "@/lib/linters";

/* ============================================================
 * GET /api/projects/[id]/export — ZIP semua config + topology.json
 * Response: application/zip (download)
 * ============================================================ */

export async function GET(
  _req: Request,
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

  await connectDB();
  const project = await Project.findOne({ _id: id, ownerId: session.user.id, deletedAt: null });
  if (!project) {
    return NextResponse.json({ error: "Proyek tidak ditemukan." }, { status: 404 });
  }

  const zip = new JSZip();

  // topology.json
  zip.file(
    "topology.json",
    JSON.stringify(
      {
        name: project.name,
        description: project.description,
        exportedAt: new Date().toISOString(),
        topology: project.topology,
      },
      null,
      2
    )
  );

  // config per node — nama file: <hostname>.<ext>
  const nodeMap = new Map(
    (project.topology?.nodes ?? []).map((n: any) => [n.id, n])
  );
  const usedNames = new Set<string>();
  for (const cfg of project.configs ?? []) {
    const node = nodeMap.get(cfg.nodeId);
    const base = (node?.properties?.hostname ?? cfg.nodeId)
      .replace(/[^a-zA-Z0-9-_]/g, "-");
    let name = `${base}.${scriptExtension(cfg.vendor)}`;
    let i = 2;
    while (usedNames.has(name)) {
      name = `${base}-${i}.${scriptExtension(cfg.vendor)}`;
      i += 1;
    }
    usedNames.add(name);
    zip.file(name, cfg.script || `# (belum ada script untuk ${base})`);
  }

  // README ringkas
  const summary = (project.topology?.nodes ?? [])
    .map((n: any) => `- ${n.properties?.hostname ?? n.id} (${n.vendor}/${n.type})`)
    .join("\n");
  zip.file(
    "README.txt",
    `NetSim Export — ${project.name}\nDibuat: ${new Date().toLocaleString("id-ID")}\n\nPerangkat:\n${summary || "- (kosong)"}\n\nFile config per perangkat + topology.json siap diimpor.`
  );

  await ActivityLog.create({
    userId: session.user.id,
    projectId: project._id,
    action: "config_exported",
    metadata: { format: "zip" },
  });

  const buf = await zip.generateAsync({ type: "nodebuffer" });
  const safeName = (project.name || "netsim-topologi").replace(/[^a-zA-Z0-9-_ ]/g, "");

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeName}.zip"`,
    },
  });
}
