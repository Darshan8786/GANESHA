import { Types } from "mongoose";
import { AuditLog } from "../models/AuditLog";

export interface AuditPayload {
  user?: Types.ObjectId | null;
  userName?: string;
  action: string;
  recordType?: string;
  recordId?: string;
  details?: Record<string, unknown>;
  ip?: string;
}

export async function auditLog(payload: AuditPayload): Promise<void> {
  try {
    await AuditLog.create(payload);
  } catch (err) {
    console.error("Audit log write failed:", err);
  }
}
