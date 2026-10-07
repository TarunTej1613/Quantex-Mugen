import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
  adminId: string;
  adminUsername?: string;
  adminEmail?: string;
  adminRole: string;
  action: string;
  targetRecord?: string;
  details?: Record<string, any>;
  ip?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    adminId: { type: String, required: true },
    adminUsername: { type: String, index: true },
    adminEmail: { type: String, index: true },
    adminRole: { type: String, required: true },
    action: { type: String, required: true, index: true },
    targetRecord: { type: String },
    details: { type: Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ActivityLog =
  mongoose.models.ActivityLog || mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
