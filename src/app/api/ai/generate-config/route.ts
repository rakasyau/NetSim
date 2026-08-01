import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB, Project, ActivityLog } from "@/lib/db";
import { geminiGenerate } from "@/lib/gemini";
import { SYSTEM_PROMPT_GENERATE_CONFIG } from "@/lib/prompts/config";
import { consumeDailyQuota, getCached, setCached } from "@/lib/rate-limit";
import { lintConfig } from "@/lib/linters";

/* ============================================================
 * POST /api/ai/generate-config — Mode 2: topologi → config per node
 * Body: { projectId: string }
 * Response: { configs: [{nodeId, vendor, script, isValid, issues[]}], remaining }
 * ============================================================ */

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { projectId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }
  if (!body.projectId || !mongoose.isValidObjectId(body.projectId)) {
    return NextResponse.json({ error: "projectId tidak valid." }, { status: 400 });
  }

  await connectDB();
  const project = await Project.findOne({ _id: body.projectId, ownerId: session.user.id, deletedAt: null });
  if (!project) {
    return NextResponse.json({ error: "Proyek tidak ditemukan." }, { status: 404 });
  }

  let remaining: number | null = null;
  try {
    remaining = (await consumeDailyQuota(session.user.id)).remaining;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, code: "rate_limited" }, { status: 429 });
  }

  const nodes = (project.topology?.nodes ?? []).map((n: any) => ({
    id: n.id,
    type: n.type,
    vendor: n.vendor,
    hostname: n.properties?.hostname ?? n.id,
    interfaces: n.properties?.interfaces ?? [],
  }));
  const edges = (project.topology?.edges ?? []).map((e: any) => ({
    source: e.source,
    target: e.target,
    sourceInterface: e.sourceInterface,
    targetInterface: e.targetInterface,
  }));

  if (nodes.length === 0) {
    return NextResponse.json(
      { error: "Topologi masih kosong — tambahkan perangkat dulu." },
      { status: 400 }
    );
  }

  const promptPayload = JSON.stringify({ nodes, edges });
  const cacheKey = promptPayload.slice(0, 4000);

  try {
    const cached = await getCached("config", cacheKey);
    let configs: { nodeId: string; vendor: string; script: string }[] = [];
    if (cached && Array.isArray((cached as { configs?: unknown[] }).configs)) {
      configs = (cached as { configs: { nodeId: string; vendor: string; script: string }[] }).configs;
    } else {
      const res = await geminiGenerate({
        mode: "config",
        systemPrompt: SYSTEM_PROMPT_GENERATE_CONFIG,
        userPrompt: "Generate konfigurasi untuk semua node pada topologi berikut:",
        extra: promptPayload,
      });
      const parsed = res.json as { configs?: { nodeId: string; vendor: string; script: string }[] };
      configs = Array.isArray(parsed?.configs) ? parsed.configs : [];
      await setCached("config", cacheKey, { configs });
    }

    // Linting + validasi nodeId
    const validIds = new Set(nodes.map((n: any) => n.id));
    const nodeMap = new Map(nodes.map((n: any) => [n.id, n]));
    const results = configs
      .filter((c) => validIds.has(c.nodeId))
      .map((c) => {
        const node = nodeMap.get(c.nodeId);
        const { isValid, issues } = lintConfig(node, c.script);
        return { nodeId: c.nodeId, vendor: c.vendor, script: c.script, isValid, issues };
      });

    // Simpan ke project.configs + riwayat chat + ActivityLog
    project.set(
      "configs",
      results.map((r) => ({
        nodeId: r.nodeId,
        vendor: r.vendor,
        script: r.script,
        generatedBy: "ai",
        isValid: r.isValid,
        lastValidatedAt: new Date(),
      }))
    );
    project.aiChatHistory.push({
      role: "assistant",
      message: `✅ Config berhasil di-generate untuk ${results.length} perangkat.`,
      actionType: "generate_config",
      applied: false,
    });
    await project.save();

    await ActivityLog.create({
      userId: session.user.id,
      projectId: project._id,
      action: "ai_generated_config",
      metadata: { configs: results.length, remaining },
    });

    return NextResponse.json({ configs: results, remaining });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 502;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
