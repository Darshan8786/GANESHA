import { Request, Response } from "express";
import { AuditLog } from "../models/AuditLog";

interface ListQuery {
  action?: string;
  user?: string;
  page?: string;
  limit?: string;
  from?: string;
  to?: string;
}

export async function listAuditLogs(req: Request<never, never, never, ListQuery>, res: Response): Promise<void> {
  try {
    const { action, user, page = "1", limit = "30", from, to } = req.query;
    const query: Record<string, unknown> = {};
    if (action) query.action = action;
    if (user) query.user = user;
    if (from || to) {
      query.createdAt = {};
      if (from) (query.createdAt as Record<string, unknown>).$gte = new Date(from);
      if (to) (query.createdAt as Record<string, unknown>).$lte = new Date(new Date(to).getTime() + 86400000);
    }
    const total = await AuditLog.countDocuments(query);
    const docs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();
    res.json({ data: docs, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}
