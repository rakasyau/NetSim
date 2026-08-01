/* ---------------------------------------------------------
 * Validasi topologi — berjalan otomatis di editor.
 * Output: daftar warning ber-Bahasa Indonesia.
 * ------------------------------------------------------- */
import type { FlowEdge, FlowNode } from "@/lib/topology-types";

export type ValidationWarning = {
  level: "error" | "warning" | "info";
  message: string;
};

/** Scan IP duplikat di semua interface semua node */
export function findDuplicateIPs(nodes: FlowNode[]) {
  const seen = new Map<string, string[]>();
  for (const node of nodes) {
    for (const iface of node.data.interfaces) {
      const ip = iface.ip.trim();
      if (!ip) continue;
      const hosts = seen.get(ip) ?? [];
      hosts.push(`${node.data.hostname}:${iface.name}`);
      seen.set(ip, hosts);
    }
  }
  return [...seen.entries()].filter(([, hosts]) => hosts.length > 1);
}

export function validateTopology(nodes: FlowNode[], edges: FlowEdge[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const nodeIds = new Set(nodes.map((n) => n.id));

  // 1. IP duplikat
  for (const [ip, hosts] of findDuplicateIPs(nodes)) {
    warnings.push({
      level: "error",
      message: `IP konflik: ${ip} dipakai ${hosts.join(" & ")}`,
    });
  }

  // 2. Interface kosong pada perangkat ber-CLI (router/switch/server/firewall)
  for (const node of nodes) {
    const hasCli = ["router", "switch", "server", "firewall"].includes(node.data.type);
    if (!hasCli) continue;
    const empty = node.data.interfaces.filter((i) => !i.ip.trim());
    if (empty.length > 0) {
      warnings.push({
        level: "warning",
        message: `${node.data.hostname}: interface ${empty
          .map((i) => i.name)
          .join(", ")} belum punya IP`,
      });
    }
  }

  // 3. Edge yang menunjuk node hilang
  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      warnings.push({
        level: "error",
        message: `Kabel ${edge.id} terhubung ke perangkat yang sudah dihapus`,
      });
    }
  }

  // 4. Node terisolasi (tanpa kabel) — hanya info untuk node ber-CLI
  const connected = new Set<string>();
  for (const edge of edges) {
    connected.add(edge.source);
    connected.add(edge.target);
  }
  for (const node of nodes) {
    if (!connected.has(node.id) && ["router", "switch", "server", "firewall"].includes(node.data.type)) {
      warnings.push({
        level: "info",
        message: `${node.data.hostname} belum terhubung kabel apa pun`,
      });
    }
  }

  return warnings;
}
