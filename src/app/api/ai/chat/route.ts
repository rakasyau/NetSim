import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB, Project } from "@/lib/db";
import { geminiGenerate } from "@/lib/gemini";
import { SYSTEM_PROMPT_EXPLAIN } from "@/lib/prompts/explain";
import { consumeDailyQuota, getCached, setCached } from "@/lib/rate-limit";

/* ============================================================
 * POST /api/ai/chat — Mode 3: tanya jawab konsep (markdown)
 * Body: { projectId, prompt, history? }
 * Response: { reply: string, remaining }
 * ============================================================ */

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { projectId?: string; prompt?: string; history?: { role: string; text: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  if (!prompt || prompt.length > 4000) {
    return NextResponse.json({ error: "Pertanyaan wajib diisi (maks 4000 karakter)." }, { status: 400 });
  }
  if (!body.projectId || !mongoose.isValidObjectId(body.projectId)) {
    return NextResponse.json({ error: "projectId tidak valid." }, { status: 400 });
  }

  await connectDB();
  const project = await Project.findOne({
    _id: body.projectId,
    ownerId: session.user.id,
    deletedAt: null,
  }).select("name topology.nodes aiChatHistory");
  if (!project) {
    return NextResponse.json({ error: "Proyek tidak ditemukan." }, { status: 404 });
  }

  let remaining: number | null = null;
  try {
    remaining = (await consumeDailyQuota(session.user.id)).remaining;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, code: "rate_limited" }, { status: 429 });
  }

  // Ringkasan topologi sebagai context (ringkas — hemat token)
  const topoSummary = (project.topology?.nodes ?? [])
    .slice(0, 30)
    .map((n: any) => {
      const ifaces = (n.properties?.interfaces ?? [])
        .map((i: any) => `${i.name}${i.ip ? `=${i.ip}` : ""}${i.vlan ? ` vlan${i.vlan}` : ""}`)
        .join(",");
      return `${n.properties?.hostname ?? n.id} (${n.vendor}/${n.type}): ${ifaces}`;
    })
    .join("\n");
  const context = `Proyek "${project.name}" — ${(project.topology?.nodes ?? []).length} perangkat:\n${topoSummary || "(kosong)"}`;

  const history = (body.history ?? []).slice(-8).map((h) => ({
    role: h.role === "user" ? "user" as const : "model" as const,
    text: h.text,
  }));

  try {
    const cached = await getCached("chat", prompt);
    let reply: string;
    if (typeof cached === "string") {
      reply = cached;
    } else {
      const res = await geminiGenerate({
        mode: "chat",
        systemPrompt: SYSTEM_PROMPT_EXPLAIN,
        userPrompt: prompt,
        history,
        extra: context,
      });
      reply = res.text;
      await setCached("chat", prompt, reply);
    }

    // Simpan ke riwayat chat proyek
    project.aiChatHistory.push({
      role: "user",
      message: prompt,
      actionType: "none",
      applied: false,
    });
    project.aiChatHistory.push({
      role: "assistant",
      message: reply,
      actionType: "explain",
      applied: false,
    });
    if (project.aiChatHistory.length > 100) {
      while (project.aiChatHistory.length > 100) project.aiChatHistory.shift();
    }
    await project.save();

    return NextResponse.json({ reply, remaining });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 502;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
