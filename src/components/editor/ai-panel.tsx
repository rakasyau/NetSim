"use client";

/* ============================================================
 * AiPanel — AI Assistant NetSim (Fase 4).
 * 3 mode: Buat Topologi (deskripsi → preview → Terapkan),
 *         Generate Config (topologi → script per node),
 *         Chat AI (tanya konsep, markdown).
 * Semua request lewat /api/ai/* (API key tetap di server).
 * ============================================================ */
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { useEditorStore } from "@/components/editor/editor-store";
import { deviceInfo } from "@/lib/device-catalog";
import type { FlowEdge, FlowNode } from "@/lib/topology-types";

type Mode = "chat" | "topology" | "config";

type ChatMsg = { role: "user" | "assistant"; text: string };

type ConfigResult = {
  nodeId: string;
  vendor: string;
  script: string;
  isValid: boolean;
  issues: string[];
};

export function AiPanel({
  projectId,
  projectName,
  onClose,
  initialMode = "chat",
}: {
  projectId: string;
  projectName: string;
  onClose: () => void;
  initialMode?: Mode;
}) {
  const nodes = useEditorStore((s) => s.nodes);
  const [mode, setMode] = useState<Mode>(initialMode);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[2px]">
      <div className="w-[470px] h-full bg-surface/90 glass-panel border-l border-border-muted rounded-l-xl flex flex-col shadow-2xl">
        {/* Header */}
        <div className="h-14 border-b border-border-muted flex items-center justify-between px-4 flex-shrink-0 bg-surface-2/50">
          <div className="flex items-center gap-2">
            <span className="text-neon">
              <Icon name="smartToy" size={20} />
            </span>
            <h2 className="text-[20px] font-semibold text-primary">NetSim AI</h2>
            <span className="text-[11px] text-secondary border border-border-muted rounded-full px-2 py-0.5 truncate max-w-[150px]">
              {projectName}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary transition-colors cursor-pointer"
            title="Tutup"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Mode chips */}
        <div className="px-4 py-2.5 border-b border-border-muted flex gap-1.5 flex-shrink-0">
          {(
            [
              { m: "chat", label: "Chat AI", icon: "smartToy" },
              { m: "topology", label: "Buat Topologi", icon: "schema" },
              { m: "config", label: "Generate Config", icon: "terminal" },
            ] as { m: Mode; label: string; icon: string }[]
          ).map((t) => (
            <button
              key={t.m}
              onClick={() => setMode(t.m)}
              className={`px-3 py-1.5 rounded-full text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border ${
                mode === t.m
                  ? "bg-neon text-on-neon border-neon"
                  : "bg-surface-2 border-border-muted text-secondary hover:text-primary hover:border-neon/60"
              }`}
            >
              <Icon name={t.icon} size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0">
          {mode === "chat" && <ChatMode projectId={projectId} />}
          {mode === "topology" && <TopologyMode projectId={projectId} onClose={onClose} />}
          {mode === "config" && <ConfigMode projectId={projectId} nodes={nodes} />}
        </div>
      </div>
    </div>
  );
}

/* ================= Chat AI (Mode 3) ================= */
function ChatMode({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      text: "Halo! Aku asisten NetSim. Tanya apa saja tentang jaringan — VLAN, subnetting, OSPF, perintah Mikrotik/Cisco, atau minta penjelasan config. Aku juga paham konteks topologi proyek ini.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    const history = messages.slice(-8).map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, prompt: text, history }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Gagal menghubungi AI.");
      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
    } catch (e) {
      setError((e as Error).message);
      setMessages((m) => [...m, { role: "assistant", text: `⚠️ ${(e as Error).message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 mt-1 ${
                m.role === "user"
                  ? "bg-surface-2 border border-border-muted text-secondary"
                  : "bg-surface-2 border border-neon/30 text-neon"
              }`}
            >
              <Icon name={m.role === "user" ? "person" : "smartToy"} size={16} />
            </div>
            <div
              className={`max-w-[85%] p-3 rounded-lg border text-[13.5px] leading-relaxed ${
                m.role === "user"
                  ? "bg-neon text-on-neon border-neon rounded-tr-none"
                  : "bg-surface-2 border-border-muted border-l-neon/50 rounded-tl-none text-primary"
              }`}
            >
              <Markdown text={m.text} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded bg-surface-2 border border-neon/30 flex items-center justify-center text-neon flex-shrink-0">
              <Icon name="smartToy" size={16} />
            </div>
            <div className="bg-surface-2 border border-border-muted rounded-lg rounded-tl-none p-3 text-[13px] text-secondary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neon animate-pulse" />
              NetSim AI sedang berpikir...
            </div>
          </div>
        )}
      </div>

      {error && <div className="px-4 text-[11px] text-danger">{error}</div>}

      <div className="p-4 border-t border-border-muted bg-surface/80 flex-shrink-0">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Tanya konsep jaringan... (Enter kirim)"
            rows={2}
            className="w-full bg-bg border border-border-muted rounded-lg pl-3 pr-12 py-2 text-[14px] text-primary focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon/50 resize-none placeholder:text-dim"
          />
          <button
            onClick={() => void send()}
            disabled={!input.trim() || loading}
            className="absolute right-2 bottom-2 w-8 h-8 rounded bg-neon text-on-neon flex items-center justify-center hover:bg-neon-2 transition-colors disabled:opacity-50 cursor-pointer"
            title="Kirim"
          >
            <Icon name="send" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= Buat Topologi (Mode 1) ================= */
function TopologyMode({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const applyTopology = useEditorStore((s) => s.applyTopology);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    nodes: FlowNode[];
    edges: FlowEdge[];
    note?: string;
  } | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function generate() {
    const text = prompt.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/ai/generate-topology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Gagal generate topologi.");
      setRemaining(data.remaining ?? null);
      if (data.error || data.nodes.length === 0) {
        setError(data.error ?? "AI tidak menghasilkan topologi. Coba deskripsi lebih jelas.");
        return;
      }
      setPreview({
        nodes: data.nodes.map((n: Record<string, unknown>, i: number) => ({
          id: String(n.id),
          type: "device",
          position: n.position as { x: number; y: number },
          data: {
            type: n.type as string,
            vendor: n.vendor as string,
            hostname: (n.properties as { hostname: string }).hostname,
            model: "",
            interfaces: (n.properties as { interfaces: unknown[] }).interfaces as never[],
          },
        })) as FlowNode[],
        edges: (data.edges ?? []).map((e: Record<string, unknown>) => ({
          id: String(e.id),
          source: String(e.source),
          target: String(e.target),
          sourceHandle: `source-${String(e.sourceInterface ?? "")}`,
          targetHandle: `target-${String(e.targetInterface ?? "")}`,
          style: { stroke: "#4A5468", strokeWidth: 2 },
        })) as FlowEdge[],
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function apply() {
    if (!preview) return;
    applyTopology(preview.nodes, preview.edges);
    onClose();
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <div className="bg-surface-2 border border-border-muted rounded-lg p-3 text-[12.5px] text-secondary leading-relaxed">
          Jelaskan kebutuhan jaringanmu dalam bahasa alami. Contoh:{" "}
          <span className="text-primary font-mono text-[12px]">
            "kantor kecil: 1 router Mikrotik gateway, 2 switch Cisco VLAN HR &amp; IT, masing-masing 2 PC, 1 server Linux DHCP"
          </span>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Deskripsikan topologi yang kamu butuhkan..."
          rows={4}
          className="w-full bg-bg border border-border-muted rounded-lg px-3 py-2.5 text-[14px] text-primary focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon/50 resize-none placeholder:text-dim"
        />
        <button
          onClick={() => void generate()}
          disabled={!prompt.trim() || loading}
          className="btn-accent w-full"
        >
          {loading ? "AI sedang mendesain..." : "Generate Topologi"}
          {loading && <span className="w-2 h-2 rounded-full bg-on-neon animate-pulse" />}
        </button>

        {remaining !== null && (
          <p className="text-[11px] text-dim text-center">
            Sisa kuota AI hari ini: {remaining} permintaan
          </p>
        )}

        {error && (
          <div className="text-[12.5px] text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2.5">
            {error}
          </div>
        )}

        {preview && (
          <div className="border border-neon/40 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-neon/10 border-b border-neon/30 flex items-center justify-between">
              <span className="text-[12px] font-bold text-neon">
                Preview — {preview.nodes.length} perangkat, {preview.edges.length} kabel
              </span>
            </div>
            <div className="p-3 flex flex-col gap-1.5 bg-surface">
              {preview.nodes.map((n) => {
                const info = deviceInfo(n.data.type as never);
                return (
                  <div key={n.id} className="flex items-center gap-2.5 text-[12.5px]">
                    <span
                      className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: `${info.color}24`, color: info.color }}
                    >
                      {info.icon}
                    </span>
                    <span className="font-semibold text-primary">{n.data.hostname}</span>
                    <span className="text-dim text-[11px]">{info.label}</span>
                    <span className="ml-auto text-dim font-mono text-[11px]">
                      {n.data.interfaces.filter((i) => (i as { ip?: string }).ip).length} IP
                    </span>
                  </div>
                );
              })}
              {preview.note && (
                <p className="text-[11.5px] text-amber-400 mt-1">{preview.note}</p>
              )}
            </div>
            <div className="p-3 border-t border-border-muted bg-surface-2 flex gap-2">
              <button onClick={apply} className="btn-accent flex-1 !py-2 text-[12.5px]">
                <Icon name="check" size={15} />
                Terapkan ke Canvas
              </button>
              <button
                onClick={() => setPreview(null)}
                className="btn-dark !py-2 text-[12.5px]"
              >
                Tolak
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= Generate Config (Mode 2) ================= */
function ConfigMode({
  projectId,
  nodes,
}: {
  projectId: string;
  nodes: FlowNode[];
}) {
  const [configs, setConfigs] = useState<ConfigResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const hostnameOf = (id: string) => nodes.find((n) => n.id === id)?.data.hostname ?? id;

  async function generate() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Gagal generate config.");
      setConfigs(data.configs ?? []);
      setRemaining(data.remaining ?? null);
      if (data.configs?.length > 0) setExpanded(data.configs[0].nodeId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function copyScript(nodeId: string, script: string) {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(nodeId);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard tidak tersedia */
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <div className="bg-surface-2 border border-border-muted rounded-lg p-3 text-[12.5px] text-secondary leading-relaxed">
          Generate script konfigurasi CLI (RouterOS / Cisco IOS / netplan) untuk{" "}
          <span className="text-primary font-semibold">{nodes.length} perangkat</span> di
          topologi ini — sesuai vendor &amp; IP yang sudah kamu set.
        </div>

        <button
          onClick={() => void generate()}
          disabled={loading || nodes.length === 0}
          className="btn-accent w-full"
        >
          <Icon name="sparkle" size={15} />
          {loading ? "AI sedang menulis config..." : "Generate Config Sekarang"}
        </button>

        {remaining !== null && (
          <p className="text-[11px] text-dim text-center">
            Sisa kuota AI hari ini: {remaining} permintaan
          </p>
        )}

        {error && (
          <div className="text-[12.5px] text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2.5">
            {error}
          </div>
        )}

        {configs && configs.length === 0 && !error && (
          <div className="text-[12.5px] text-secondary text-center py-4">
            Tidak ada config yang dihasilkan.
          </div>
        )}

        {configs?.map((c) => (
          <div
            key={c.nodeId}
            className={`border rounded-lg overflow-hidden ${
              c.isValid ? "border-border-muted" : "border-amber-500/40"
            }`}
          >
            <button
              onClick={() => setExpanded(expanded === c.nodeId ? null : c.nodeId)}
              className="w-full px-3 py-2.5 bg-surface-2 flex items-center gap-2.5 cursor-pointer text-left"
            >
              <Icon name="terminal" size={15} className="text-neon flex-shrink-0" />
              <span className="font-mono text-[12.5px] font-bold text-primary flex-1 truncate">
                {hostnameOf(c.nodeId)}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                  c.isValid
                    ? "text-emerald border-emerald/40 bg-emerald/10"
                    : "text-amber-400 border-amber-500/40 bg-amber-500/10"
                }`}
              >
                {c.isValid ? "Siap" : "Perlu Ditinjau"}
              </span>
              <Icon
                name={expanded === c.nodeId ? "expandL" : "chevR"}
                size={15}
                className="text-dim"
              />
            </button>
            {expanded === c.nodeId && (
              <div className="border-t border-border-muted bg-[#1E2329]">
                {c.issues.length > 0 && (
                  <div className="px-3 py-2 bg-amber-500/10 border-b border-amber-500/20 text-[11px] text-amber-400">
                    ⚠ {c.issues.join(" · ")}
                  </div>
                )}
                <div className="relative">
                  <button
                    onClick={() => void copyScript(c.nodeId, c.script)}
                    className="absolute right-2 top-2 w-7 h-7 rounded bg-surface-2 border border-border-muted text-secondary hover:text-neon hover:border-neon transition-colors flex items-center justify-center cursor-pointer"
                    title="Salin"
                  >
                    <Icon name={copied === c.nodeId ? "check" : "copy"} size={14} />
                  </button>
                  <pre className="p-3 pr-10 overflow-x-auto font-mono text-[11.5px] leading-relaxed text-primary whitespace-pre">
                    {c.script || "(tidak ada script untuk perangkat ini)"}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= Markdown mini renderer ================= */
function Markdown({ text }: { text: string }) {
  const blocks = text.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-1.5">
      {blocks.map((block, i) => {
        if (block.startsWith("```")) {
          const code = block.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
          return (
            <pre
              key={i}
              className="bg-bg border border-border-muted rounded-md p-2.5 overflow-x-auto font-mono text-[11.5px] text-primary leading-relaxed"
            >
              {code}
            </pre>
          );
        }
        return <InlineMd key={i} text={block} />;
      })}
    </div>
  );
}

function InlineMd({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const t = line.trim();
        if (t.startsWith("### ")) {
          return (
            <p key={i} className="font-bold text-[14px] mt-1">
              {t.slice(4)}
            </p>
          );
        }
        if (t.startsWith("## ")) {
          return (
            <p key={i} className="font-bold text-[14.5px] mt-1">
              {t.slice(3)}
            </p>
          );
        }
        if (t.startsWith("- ") || t.startsWith("* ")) {
          return (
            <p key={i} className="flex gap-2">
              <span className="text-neon">•</span>
              <span>
                <InlineSpans text={t.slice(2)} />
              </span>
            </p>
          );
        }
        if (/^\d+\.\s/.test(t)) {
          return (
            <p key={i} className="flex gap-2">
              <span className="text-neon">{t.match(/^\d+/)?.[0]}.</span>
              <span>
                <InlineSpans text={t.replace(/^\d+\.\s/, "")} />
              </span>
            </p>
          );
        }
        return (
          <p key={i}>
            <InlineSpans text={line} />
          </p>
        );
      })}
    </>
  );
}

function InlineSpans({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold">
              {p.slice(2, -2)}
            </strong>
          );
        }
        if (p.startsWith("`") && p.endsWith("`")) {
          return (
            <code key={i} className="bg-bg border border-border-muted rounded px-1 py-px font-mono text-[11.5px]">
              {p.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}
