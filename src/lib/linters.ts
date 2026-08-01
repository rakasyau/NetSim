/* ============================================================
 * linters.ts — linting sintaks dasar per vendor (bahan §6).
 * Dipakai di generate-config route & Config Editor (Ctrl+Enter).
 * ============================================================ */

export type LintResult = { isValid: boolean; issues: string[] };

/** Node yang tidak butuh config CLI */
const NO_CONFIG_TYPES = new Set(["pc", "laptop", "ap", "cloud", "printer"]);

export function lintConfig(
  node: { type: string; vendor: string } | undefined,
  script: string
): LintResult {
  const issues: string[] = [];
  if (!node) {
    return { isValid: false, issues: ["Node tidak ditemukan."] };
  }
  if (NO_CONFIG_TYPES.has(node.type)) {
    return { isValid: true, issues: [] };
  }
  if (!script || script.trim().length === 0) {
    return { isValid: false, issues: ["Script kosong."] };
  }

  const lines = script
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("!"));

  switch (node.vendor) {
    case "mikrotik": {
      const hasMenu = lines.some((l) => l.startsWith("/"));
      if (!hasMenu) issues.push("Tidak ada baris perintah RouterOS (diawali '/').");
      break;
    }
    case "cisco": {
      const opens = lines.filter(
        (l) => l.startsWith("interface ") || l.startsWith("router ") || l.startsWith("vlan ")
      ).length;
      const hasExit = lines.some((l) => l === "exit" || l === "end");
      if (opens > 0 && !hasExit) issues.push("Mode interface/router tidak ditutup dengan 'exit'.");
      break;
    }
    case "linux": {
      const hasYamlKey = lines.some((l) => /^[a-z]+:/i.test(l) || l.startsWith("network:"));
      if (!hasYamlKey) issues.push("Output tidak terlihat seperti netplan YAML.");
      break;
    }
    default:
      break;
  }

  return { isValid: issues.length === 0, issues };
}

/** Ekstensi file export per vendor */
export function scriptExtension(vendor: string): string {
  switch (vendor) {
    case "mikrotik":
      return "rsc";
    case "cisco":
      return "cfg";
    case "linux":
      return "yaml";
    default:
      return "txt";
  }
}
