/* ---------------------------------------------------------
 * Katalog perangkat NetSim — sumber tunggal tipe/vendor/
 * warna/ikon/interfaces default untuk toolbelt & node card.
 * Warna mengikuti mockup editor (#E8734A mikrotik, #4AA8E8
 * cisco, #B08CFF linux, #F2F3F5 generic).
 * ------------------------------------------------------- */

export type DeviceType =
  | "router"
  | "switch"
  | "server"
  | "pc"
  | "laptop"
  | "ap"
  | "firewall"
  | "cloud"
  | "printer";

export type DeviceVendor = "mikrotik" | "cisco" | "linux" | "generic";

export type DeviceInfo = {
  /** Kategori perangkat (disimpan di node.type) */
  type: DeviceType;
  /** Vendor (disimpan di node.vendor) */
  vendor: DeviceVendor;
  /** Label Bahasa Indonesia untuk toolbelt */
  label: string;
  /** Nama model default (mis. "RB4011") */
  model: string;
  /** Icon 2 huruf di node card (MK/CS/LX/PC/...) */
  icon: string;
  /** Warna aksen vendor */
  color: string;
  /** Prefix hostname otomatis (mis. "RB-", "SW-") */
  prefix: string;
  /** Interface default saat node baru dibuat */
  defaultInterfaces: string[];
  /** Punya CLI config (router/switch/server) */
  hasCli: boolean;
};

export const VENDOR_COLORS: Record<DeviceVendor, string> = {
  mikrotik: "#E8734A",
  cisco: "#4AA8E8",
  linux: "#B08CFF",
  generic: "#F2F3F5",
};

export const DEVICE_CATALOG: Record<DeviceType, DeviceInfo> = {
  router: {
    type: "router",
    vendor: "mikrotik",
    label: "Router Mikrotik",
    model: "RB4011",
    icon: "MK",
    color: VENDOR_COLORS.mikrotik,
    prefix: "RB-",
    defaultInterfaces: ["ether1", "ether2", "ether3"],
    hasCli: true,
  },
  switch: {
    type: "switch",
    vendor: "cisco",
    label: "Switch Cisco",
    model: "2960",
    icon: "CS",
    color: VENDOR_COLORS.cisco,
    prefix: "SW-",
    defaultInterfaces: ["Gi0/1", "Gi0/2", "Gi0/3"],
    hasCli: true,
  },
  server: {
    type: "server",
    vendor: "linux",
    label: "Server Linux",
    model: "Ubuntu 24.04",
    icon: "LX",
    color: VENDOR_COLORS.linux,
    prefix: "SRV-",
    defaultInterfaces: ["eth0", "eth1"],
    hasCli: true,
  },
  pc: {
    type: "pc",
    vendor: "generic",
    label: "PC",
    model: "Workstation",
    icon: "PC",
    color: VENDOR_COLORS.generic,
    prefix: "PC-",
    defaultInterfaces: ["eth0"],
    hasCli: false,
  },
  laptop: {
    type: "laptop",
    vendor: "generic",
    label: "Laptop",
    model: "Notebook",
    icon: "LT",
    color: VENDOR_COLORS.generic,
    prefix: "LT-",
    defaultInterfaces: ["wlan0"],
    hasCli: false,
  },
  ap: {
    type: "ap",
    vendor: "generic",
    label: "Access Point",
    model: "AP",
    icon: "AP",
    color: "#F5C542",
    prefix: "AP-",
    defaultInterfaces: ["wlan0", "eth0"],
    hasCli: false,
  },
  firewall: {
    type: "firewall",
    vendor: "mikrotik",
    label: "Firewall",
    model: "CCR2004",
    icon: "FW",
    color: "#FF5C5C",
    prefix: "FW-",
    defaultInterfaces: ["ether1", "ether2"],
    hasCli: true,
  },
  cloud: {
    type: "cloud",
    vendor: "generic",
    label: "Cloud / Internet",
    model: "Cloud",
    icon: "☁",
    color: "#8AB4F8",
    prefix: "CLD-",
    defaultInterfaces: ["eth0"],
    hasCli: false,
  },
  printer: {
    type: "printer",
    vendor: "generic",
    label: "Printer",
    model: "Printer",
    icon: "PR",
    color: "#C0C5D0",
    prefix: "PR-",
    defaultInterfaces: ["eth0"],
    hasCli: false,
  },
};

/** Urutan tampilan di toolbelt (dari PRD §5.1) */
export const TOOLBELT_ORDER: DeviceType[] = [
  "router",
  "switch",
  "server",
  "pc",
  "laptop",
  "ap",
  "firewall",
  "cloud",
  "printer",
];

export function deviceInfo(type: DeviceType): DeviceInfo {
  return DEVICE_CATALOG[type];
}

/** Buat node baru (format penyimpanan PRD) dengan hostname unik */
export function createDefaultNode(
  type: DeviceType,
  position: { x: number; y: number },
  existingNames: Set<string>
) {
  const info = DEVICE_CATALOG[type];
  let idx = 1;
  let hostname = `${info.prefix}${idx}`;
  while (existingNames.has(hostname)) {
    idx += 1;
    hostname = `${info.prefix}${idx}`;
  }
  return {
    id: `node-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    vendor: info.vendor,
    position,
    properties: {
      hostname,
      interfaces: info.defaultInterfaces.map((name) => ({
        name,
        ip: "",
        vlan: undefined as number | undefined,
      })),
    },
  };
}
