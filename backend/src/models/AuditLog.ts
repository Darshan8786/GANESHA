import mongoose, { Schema, model, Types } from "mongoose";

export interface IAuditLog {
  _id?: Types.ObjectId;
  user?: Types.ObjectId | null;
  userName?: string;
  action: string;
  recordType?: string;
  recordId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    userName: { type: String, trim: true },
    action: { type: String, required: true },
    recordType: { type: String, trim: true },
    recordId: { type: String, trim: true },
    details: { type: Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: true }
);

auditLogSchema.index({ user: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ recordType: 1, recordId: 1 });

export const AuditLog = model<IAuditLog>("AuditLog", auditLogSchema);
