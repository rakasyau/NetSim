import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

/* ---------------------------------------------------------
 * Sub-schema: Interface pada sebuah node (port fisik/virtual)
 * ------------------------------------------------------- */
const InterfaceSchema = new Schema(
  {
    name: { type: String, required: true }, // contoh: ether1, Gi0/1, eth0
    ip: { type: String, default: '' }, // contoh: 10.10.0.1/24
    vlan: { type: Number, default: null },
    description: { type: String, default: '' },
  },
  { _id: false }
);

/* ---------------------------------------------------------
 * Sub-schema: Node (perangkat) dalam topologi
 * Format: PRD §7.2 — properties nested (hostname + interfaces)
 * ------------------------------------------------------- */
const NodeSchema = new Schema(
  {
    id: { type: String, required: true }, // id lokal dalam canvas (uuid client-side)
    type: {
      type: String,
      required: true,
      enum: ['router', 'switch', 'server', 'pc', 'laptop', 'ap', 'firewall', 'cloud', 'printer'],
    },
    vendor: {
      type: String,
      required: true,
      enum: ['mikrotik', 'cisco', 'linux', 'generic'],
    },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    properties: {
      hostname: { type: String, required: true, trim: true },
      interfaces: { type: [InterfaceSchema], default: [] },
    },
  },
  { _id: false }
);

/* ---------------------------------------------------------
 * Sub-schema: Edge (koneksi kabel antar node)
 * ------------------------------------------------------- */
const EdgeSchema = new Schema(
  {
    id: { type: String, required: true },
    source: { type: String, required: true }, // ref ke Node.id
    target: { type: String, required: true }, // ref ke Node.id
    sourceInterface: { type: String, default: '' },
    targetInterface: { type: String, default: '' },
    linkType: {
      type: String,
      enum: ['ethernet', 'fiber', 'wireless'],
      default: 'ethernet',
    },
  },
  { _id: false }
);

/* ---------------------------------------------------------
 * Sub-schema: Konfigurasi hasil generate per node
 * ------------------------------------------------------- */
const ConfigSchema = new Schema(
  {
    nodeId: { type: String, required: true }, // ref ke Node.id
    vendor: { type: String, enum: ['mikrotik', 'cisco', 'linux', 'generic'], required: true },
    script: { type: String, default: '' },
    generatedBy: { type: String, enum: ['user', 'ai'], default: 'user' },
    lastValidatedAt: { type: Date, default: null },
    isValid: { type: Boolean, default: null }, // hasil linting sederhana
  },
  { _id: false, timestamps: true }
);

/* ---------------------------------------------------------
 * Sub-schema: Riwayat chat AI per proyek
 * ------------------------------------------------------- */
const AiChatMessageSchema = new Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    message: { type: String, required: true },
    // jika pesan AI menghasilkan perubahan topologi/config, simpan snapshot ringkas
    actionType: {
      type: String,
      enum: ['none', 'generate_topology', 'generate_config', 'explain'],
      default: 'none',
    },
    applied: { type: Boolean, default: false }, // apakah user menekan "Terapkan"
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* ---------------------------------------------------------
 * Sub-schema: Snapshot versi (manual save point)
 * ------------------------------------------------------- */
const VersionSchema = new Schema(
  {
    versionLabel: { type: String, required: true }, // contoh: "v1 - sebelum tambah VLAN"
    snapshot: { type: Schema.Types.Mixed, required: true }, // { nodes, edges, configs }
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

/* ---------------------------------------------------------
 * Sub-schema: Kolaborator proyek (fase 2)
 * ------------------------------------------------------- */
const CollaboratorSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['viewer', 'editor'], default: 'viewer' },
    invitedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* ---------------------------------------------------------
 * Schema utama: Project
 * ------------------------------------------------------- */
const ProjectSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, default: '', maxlength: 1000 },

    status: {
      type: String,
      enum: ['draft', 'completed', 'shared'],
      default: 'draft',
    },

    thumbnailUrl: { type: String, default: '' },

    topology: {
      nodes: { type: [NodeSchema], default: [] },
      edges: { type: [EdgeSchema], default: [] },
    },

    configs: { type: [ConfigSchema], default: [] },

    aiChatHistory: { type: [AiChatMessageSchema], default: [] },

    versions: { type: [VersionSchema], default: [] },

    collaborators: { type: [CollaboratorSchema], default: [] },

    isPublic: { type: Boolean, default: false },
    publicShareToken: { type: String, default: null }, // dipakai untuk link read-only

    tags: { type: [String], default: [] }, // contoh: ["OSPF", "VLAN", "Praktikum"]

    deletedAt: { type: Date, default: null }, // soft delete (trash 30 hari)
  },
  { timestamps: true }
);

/* ---------------------------------------------------------
 * Index
 * ------------------------------------------------------- */
ProjectSchema.index({ ownerId: 1, updatedAt: -1 }); // dashboard: list proyek terbaru milik user
ProjectSchema.index({ name: 'text', description: 'text' }); // pencarian proyek (text)
ProjectSchema.index({ tags: 1 }); // filter tag (array → index biasa, bukan text)
ProjectSchema.index(
  { publicShareToken: 1 },
  { unique: true, partialFilterExpression: { publicShareToken: { $type: 'string' } } }
);

/* ---------------------------------------------------------
 * Method bantu
 * ------------------------------------------------------- */

// Validasi dasar: cek IP duplikat antar node dalam satu proyek
ProjectSchema.methods.findDuplicateIPs = function () {
  const ipMap = new Map<string, string>();
  const duplicates: { ip: string; nodes: string[] }[] = [];

  this.topology.nodes.forEach((node: any) => {
    const interfaces = node.properties?.interfaces ?? [];
    const hostname = node.properties?.hostname ?? node.id;
    interfaces.forEach((iface: any) => {
      if (!iface.ip) return;
      const baseIp = String(iface.ip).split('/')[0];
      if (ipMap.has(baseIp)) {
        duplicates.push({ ip: baseIp, nodes: [ipMap.get(baseIp)!, hostname] });
      } else {
        ipMap.set(baseIp, hostname);
      }
    });
  });

  return duplicates;
};

// Buat snapshot versi baru dari state topologi saat ini
ProjectSchema.methods.createVersionSnapshot = function (label: string, userId: any) {
  this.versions.push({
    versionLabel: label,
    snapshot: {
      nodes: this.topology.nodes,
      edges: this.topology.edges,
      configs: this.configs,
    },
    createdBy: userId,
  });
};

// Soft delete
ProjectSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
};

// Duplikat proyek (tanpa versi & riwayat chat, reset status ke draft)
ProjectSchema.methods.duplicate = function () {
  const clone = {
    ownerId: this.ownerId,
    name: `${this.name} (Salinan)`,
    description: this.description,
    status: 'draft',
    thumbnailUrl: '',
    topology: this.topology,
    configs: this.configs,
    aiChatHistory: [],
    versions: [],
    collaborators: [],
    isPublic: false,
    publicShareToken: null,
    tags: this.tags,
    deletedAt: null,
  };
  return clone;
};

export type ProjectType = InferSchemaType<typeof ProjectSchema>;

// Dokumen hasil query — signature method custom
export interface ProjectDoc extends ProjectType {
  findDuplicateIPs(): { ip: string; nodes: string[] }[];
  createVersionSnapshot(label: string, userId: any): void;
  softDelete(): void;
  duplicate(): Record<string, unknown>;
}

export type ProjectModel = Model<ProjectDoc>;

const Project =
  (mongoose.models.Project as ProjectModel | undefined) ||
  mongoose.model<ProjectDoc, ProjectModel>('Project', ProjectSchema);

export default Project;
