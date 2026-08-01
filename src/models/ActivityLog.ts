import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

/* ---------------------------------------------------------
 * Skema ActivityLog — port dari bahan/skema mongoose/ActivityLog.js
 * ------------------------------------------------------- */
const ActivityLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },

    action: {
      type: String,
      required: true,
      enum: [
        'project_created',
        'project_updated',
        'project_deleted',
        'project_duplicated',
        'project_shared',
        'ai_generated_topology',
        'ai_generated_config',
        'config_exported',
        'version_snapshot_created',
        'login',
      ],
    },

    metadata: { type: Schema.Types.Mixed, default: {} }, // detail tambahan bebas, contoh: { nodesAdded: 3 }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Log otomatis kedaluwarsa setelah 180 hari (TTL index) agar koleksi tidak membengkak
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });
ActivityLogSchema.index({ userId: 1, createdAt: -1 });

export type ActivityLogType = InferSchemaType<typeof ActivityLogSchema>;
export type ActivityLogModel = Model<ActivityLogType>;

const ActivityLog =
  (mongoose.models.ActivityLog as ActivityLogModel | undefined) ||
  mongoose.model<ActivityLogType, ActivityLogModel>('ActivityLog', ActivityLogSchema);

export default ActivityLog;
