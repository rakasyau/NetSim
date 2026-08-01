import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, ActivityLog } from "@/lib/db";
import { geminiGenerate } from "@/lib/gemini";
import { SYSTEM_PROMPT_GENERATE_TOPOLOGY } from "@/lib/prompts/topology";
import { consumeDailyQuota, getCached, setCached } from "@/lib/rate-limit";

/* ============================================================
 * POST /api/ai/generate-topology — Mode 1: prompt → topologi
 * Body: { prompt: string }
 * Response: { nodes, edges, error? } (format NetSim, siap render)
 * ============================================================ */

const VALID_TYPES = new Set([
  "router", "switch", "server", "pc", "laptop", "ap", "firewall", "cloud", "printer",
]);
const VALID_VENDORS = new Set(["mikrotik", "cisco", "linux", "generic"]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { prompt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }
  const prompt = body.prompt?.trim();
  if (!prompt || prompt.length > 2000) {
    return NextResponse.json({ error: "Prompt wajib diisi (maks 2000 karakter)." }, { status: 400 });
  }

  await connectDB();

  // Rate limit (quota tetap dikonsumsi walau cache hit — murah)
  let remaining: number | null = null;
  try {
    remaining = (await consumeDailyQuota(session.user.id)).remaining;
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message, code: "rate_limited" },
      { status: 429 }
    );
  }

  try {
    const cached = await getCached("topology", prompt);
    let raw: unknown;
    if (cached) {
      raw = cached;
    } else {
      const res = await geminiGenerate({
        mode: "topology",
        systemPrompt: SYSTEM_PROMPT_GENERATE_TOPOLOGY,
        userPrompt: prompt,
      });
      raw = res.json;
      await setCached("topology", prompt, raw);
    }

    const parsed = raw as { nodes?: unknown[]; edges?: unknown[]; error?: string };

    // AI menolak (di luar cakupan)
    if (parsed?.error || !Array.isArray(parsed?.nodes)) {
      return NextResponse.json(
        { nodes: [], edges: [], error: parsed?.error ?? "Gagal mem-parse topologi." },
        { status: 200 }
      );
    }

    // Normalisasi → format NetSim
    const nodes = normalizeNodes(parsed.nodes);
    const edges = normalizeEdges(parsed.edges ?? [], nodes.map((n) => String(n.id)));

    await ActivityLog.create({
      userId: session.user.id,
      projectId: null,
      action: "ai_generated_topology",
      metadata: { nodesAdded: nodes.length, edgesAdded: edges.length, remaining },
    });

    return NextResponse.json({
      nodes,
      edges,
      remaining,
      note: parsed.error ? undefined : undefined,
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 502;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}

/* ---------- Normalisasi ---------- */
type AiNode = {
  id?: string;
  type?: string;
  vendor?: string;
  hostname?: string;
  position?: { x?: number; y?: number };
  interfaces?: { name?: string; ip?: string; vlan?: number | null }[];
};

function normalizeNodes(raw: unknown[]): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = [];
  for (const r of raw.slice(0, 40)) {
    const n = r as AiNode;
    if (!n || !VALID_TYPES.has(n.type ?? "")) continue;
    const interfaces = (Array.isArray(n.interfaces) ? n.interfaces : [])
      .slice(0, 12)
      .map((i) => ({
        name: String(i.name ?? "eth0").slice(0, 30),
        ip: String(i.ip ?? "").slice(0, 40),
        vlan: typeof i.vlan === "number" ? i.vlan : null,
      }));
    const id = `node-${(n.id ?? `ai-${Math.random().toString(36).slice(2, 8)}`).replace(/[^a-zA-Z0-9-]/g, "-")}`;
    nodes.push({
      id,
      type: n.type,
      vendor: VALID_VENDORS.has(n.vendor ?? "") ? n.vendor : inferVendor(n.type ?? ""),
      position: {
        x: typeof n.position?.x === "number" ? Math.round(n.position.x) : 100,
        y: typeof n.position?.y === "number" ? Math.round(n.position.y) : 100,
      },
      properties: {
        hostname: String(n.hostname ?? `Node-${nodes.length + 1}`).slice(0, 60),
        interfaces,
      },
    });
  }
  return nodes;
}

function inferVendor(type: string): string {
  if (type === "server") return "linux";
  if (type === "pc" || type === "laptop") return "generic";
  return "generic";
}

function normalizeEdges(raw: unknown[], validIds: string[]): Record<string, unknown>[] {
  const edges: Record<string, unknown>[] = [];
  for (const r of raw.slice(0, 80)) {
    const e = r as { id?: string; source?: string; target?: string; sourceInterface?: string; targetInterface?: string };
    if (!e) continue;
    const source = `node-${e.source}`;
    const target = `node-${e.target}`;
    if (!validIds.includes(source) || !validIds.includes(target)) continue;
    edges.push({
      id: `edge-${(e.id ?? Math.random().toString(36).slice(2, 8)).replace(/[^a-zA-Z0-9-]/g, "-")}`,
      source,
      target,
      sourceInterface: String(e.sourceInterface ?? "").slice(0, 30),
      targetInterface: String(e.targetInterface ?? "").slice(0, 30),
      linkType: "ethernet",
    });
  }
  return edges;
}
