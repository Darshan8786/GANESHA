import { Request, Response } from "express";
import { Receipt } from "../models/Receipt";
import { Donation } from "../models/Donation";
import { buildReceiptPdf, buildReceiptsPdf, ReceiptPdfData } from "../services/pdf";
import { buildVerifyUrl } from "../services/qr";
import { auditLog } from "../utils/audit";
import { env } from "../config/env";

interface ListQuery {
  search?: string;
  page?: string;
  limit?: string;
  from?: string;
  to?: string;
  collector?: string;
  paymentMode?: string;
  status?: string;
  year?: string;
}

export async function listReceipts(req: Request<never, never, never, ListQuery>, res: Response): Promise<void> {
  try {
    const { search, page = "1", limit = "20", from, to, collector, paymentMode, status, year } = req.query;
    const query: Record<string, unknown> = {};
    if (collector) query.collector = collector;
    if (paymentMode) query.paymentMode = paymentMode;
    if (status === "cancelled") query.isCancelled = true;
    else if (status === "valid") query.isCancelled = false;
    if (year) {
      const y = Number(year);
      query.issuedAt = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) };
    } else if (from || to) {
      query.issuedAt = {};
      if (from) (query.issuedAt as Record<string, unknown>).$gte = new Date(from);
      if (to) (query.issuedAt as Record<string, unknown>).$lte = new Date(new Date(to).getTime() + 86400000);
    }
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ receiptNumber: re }, { devoteeName: re }, { phone: re }];
    }
    const total = await Receipt.countDocuments(query);
    const docs = await Receipt.find(query)
      .populate("collector", "name")
      .sort({ issuedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();
    res.json({ data: docs, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function receiptYears(req: Request, res: Response): Promise<void> {
  try {
    const docs = await Receipt.aggregate([
      { $group: { _id: { $year: "$issuedAt" } } },
      { $sort: { _id: -1 } },
    ]);
    const fallback = new Date().getFullYear();
    const years = docs.length ? docs.map((d) => d._id) : [fallback];
    res.json({ years });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function getReceipt(req: Request, res: Response): Promise<void> {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate("collector", "name")
      .populate("donation")
      .populate("house")
      .populate("shop")
      .lean();
    if (!receipt) {
      res.status(404).json({ message: "Receipt not found" });
      return;
    }
    res.json({ ...receipt, verifyUrl: buildVerifyUrl(receipt.receiptNumber) });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function getReceiptByNumber(req: Request, res: Response): Promise<void> {
  try {
    const receipt = await Receipt.findOne({ receiptNumber: req.params.receiptNumber })
      .populate("collector", "name")
      .populate("donation")
      .populate("house")
      .populate("shop")
      .lean();
    if (!receipt) {
      res.status(404).json({ message: "Receipt not found" });
      return;
    }
    res.json({ ...receipt, verifyUrl: buildVerifyUrl(receipt.receiptNumber) });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

/**
 * Public verification endpoint - returns only non-sensitive data.
 */
export async function verifyReceiptPublic(req: Request, res: Response): Promise<void> {
  try {
    const receipt = await Receipt.findOne({ receiptNumber: req.params.receiptNumber }).lean();
    if (!receipt) {
      res.status(404).json({ valid: false, message: "Receipt not found" });
      return;
    }
    if (receipt.isCancelled) {
      res.json({
        valid: false,
        status: "CANCELLED",
        receiptNumber: receipt.receiptNumber,
        devoteeName: receipt.devoteeName,
        amount: receipt.amount,
        date: receipt.issuedAt,
        paymentMode: receipt.paymentMode,
        organization: env.org.name,
      });
      return;
    }
    res.json({
      valid: true,
      status: "VALID",
      receiptNumber: receipt.receiptNumber,
      devoteeName: receipt.devoteeName,
      amount: receipt.amount,
      date: receipt.issuedAt,
      paymentMode: receipt.paymentMode,
      organization: env.org.name,
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function downloadReceiptPdf(req: Request, res: Response): Promise<void> {
  try {
    const receipt = await Receipt.findById(req.params.id).populate("collector", "name").populate("donation").lean();
    if (!receipt) {
      res.status(404).json({ message: "Receipt not found" });
      return;
    }
    if (receipt.isCancelled) {
      res.status(400).json({ message: "This receipt has been cancelled" });
      return;
    }
    const d = new Date(receipt.issuedAt);
    const doc = buildReceiptPdf(toReceiptPdfData(receipt, d));
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${receipt.receiptNumber}.pdf"`);
    doc.pipe(res);
    doc.end();
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

interface ReceiptRow {
  receiptNumber?: string;
  devoteeName?: string;
  amount?: number;
  issuedAt?: string | Date;
  paymentMode?: string;
  phone?: string;
  address?: string;
  donorType?: string;
  collector?: { name?: string } | unknown;
  qrDataUrl?: string;
}

function toReceiptPdfData(receipt: ReceiptRow, d: Date): ReceiptPdfData {
  return {
    receiptNumber: String(receipt.receiptNumber || ""),
    date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    devoteeName: String(receipt.devoteeName || ""),
    phone: receipt.phone,
    address: receipt.address,
    donorType: String(receipt.donorType || ""),
    collectorName: typeof receipt.collector === "object" && receipt.collector !== null ? (receipt.collector as { name?: string }).name || "" : "",
    paymentMode: receipt.paymentMode || "CASH",
    amount: Number(receipt.amount || 0),
    qrDataUrl: receipt.qrDataUrl,
  };
}

export async function batchReceiptPdf(req: Request, res: Response): Promise<void> {
  try {
    const ids: string[] = (req.body?.ids || []).filter((id: unknown): id is string => typeof id === "string");
    if (!ids.length) {
      res.status(400).json({ message: "No receipts selected" });
      return;
    }
    const receipts = await Receipt.find({ _id: { $in: ids }, isCancelled: false })
      .populate("collector", "name")
      .lean();
    if (!receipts.length) {
      res.status(404).json({ message: "No valid receipts found" });
      return;
    }
    const items = receipts.map((r) => toReceiptPdfData(r, new Date(r.issuedAt)));
    const doc = buildReceiptsPdf(items);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="SVGB_Receipts_${Date.now()}.pdf"`);
    doc.pipe(res);
    doc.end();
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function cancelReceipt(req: Request, res: Response): Promise<void> {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      res.status(404).json({ message: "Receipt not found" });
      return;
    }
    if (receipt.isCancelled) {
      res.status(400).json({ message: "Receipt already cancelled" });
      return;
    }
    receipt.isCancelled = true;
    receipt.cancelledAt = new Date();
    receipt.cancelledBy = req.user?._id as never;
    await receipt.save();

    await Donation.findByIdAndUpdate(receipt.donation, { isCancelled: true, cancelledAt: new Date() });

    await auditLog({
      user: req.user?._id as never,
      userName: req.user?.name,
      action: "RECEIPT_CANCELLED",
      recordType: "Receipt",
      recordId: String(receipt._id),
      details: { receiptNumber: receipt.receiptNumber },
      ip: req.ip,
    });
    res.json(receipt);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}
