import { Request, Response } from "express";
import { CashSettlement } from "../models/CashSettlement";
import { SettlementStatus } from "../constants";
import { auditLog } from "../utils/audit";

interface ListQuery {
  status?: string;
  collector?: string;
  from?: string;
  to?: string;
  page?: string;
  limit?: string;
}

export async function listSettlements(req: Request<never, never, never, ListQuery>, res: Response): Promise<void> {
  try {
    const { status, collector, from, to, page = "1", limit = "20" } = req.query;
    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (collector) query.collector = collector;
    if (from || to) {
      query.date = {};
      if (from) (query.date as Record<string, unknown>).$gte = new Date(from);
      if (to) (query.date as Record<string, unknown>).$lte = new Date(new Date(to).getTime() + 86400000);
    }
    const total = await CashSettlement.countDocuments(query);
    const docs = await CashSettlement.find(query)
      .populate("collector", "name")
      .populate("reviewedBy", "name")
      .populate("area", "name")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();
    res.json({ data: docs, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

/**
 * Collectors can only see their own settlements.
 */
export async function listMySettlements(req: Request, res: Response): Promise<void> {
  try {
    const docs = await CashSettlement.find({ collector: req.user?._id })
      .populate("area", "name")
      .sort({ createdAt: -1 })
      .lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function createSettlement(req: Request, res: Response): Promise<void> {
  try {
    const { date, morningCash = 0, items = [], expectedCash, submittedCash } = req.body;
    const settlement = await CashSettlement.create({
      collector: req.user?._id as never,
      date: date ? new Date(date) : new Date(),
      morningCash,
      items,
      expectedCash,
      submittedCash,
      difference: expectedCash - submittedCash,
      status: Math.abs(expectedCash - submittedCash) < 0.01 ? SettlementStatus.VERIFIED : SettlementStatus.PENDING,
    });
    await auditLog({
      user: req.user?._id as never,
      userName: req.user?.name,
      action: "CASH_SETTLEMENT_SUBMITTED",
      recordType: "CashSettlement",
      recordId: String(settlement._id),
      details: { expected: expectedCash, submitted: submittedCash },
      ip: req.ip,
    });
    res.status(201).json(settlement);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function reviewSettlement(req: Request, res: Response): Promise<void> {
  try {
    const settlement = await CashSettlement.findById(req.params.id);
    if (!settlement) {
      res.status(404).json({ message: "Settlement not found" });
      return;
    }
    settlement.status = req.body.status;
    settlement.reviewedBy = req.user?._id as never;
    settlement.reviewedAt = new Date();
    settlement.reviewNote = req.body.note || "";
    await settlement.save();
    await auditLog({
      user: req.user?._id as never,
      userName: req.user?.name,
      action: req.body.status === SettlementStatus.REJECTED ? "CASH_SETTLEMENT_REJECTED" : "CASH_SETTLEMENT_APPROVED",
      recordType: "CashSettlement",
      recordId: String(settlement._id),
      ip: req.ip,
    });
    res.json(settlement);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}
