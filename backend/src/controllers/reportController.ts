import { Request, Response } from "express";
import ExcelJS from "exceljs";
import { Donation } from "../models/Donation";
import { Expense } from "../models/Expense";
import { CashSettlement } from "../models/CashSettlement";
import { Receipt } from "../models/Receipt";
import { env } from "../config/env";

const pad2 = (n: number) => String(n).padStart(2, "0");
const fmtExcelDate = (d: Date) => `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
const fmtExcelTime = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

export async function exportCollectionLogExcel(req: Request, res: Response): Promise<void> {
  try {
    const donations = await Donation.find({ isCancelled: false })
      .populate("receipt", "receiptNumber")
      .sort({ collectedAt: 1 })
      .lean();

    const wb = new ExcelJS.Workbook();
    wb.creator = env.org.fullName;
    wb.created = new Date();
    const ws = wb.addWorksheet("Collection Log");
    ws.columns = [
      { header: "Receipt No", key: "receipt", width: 18 },
      { header: "Date", key: "date", width: 12 },
      { header: "Time", key: "time", width: 10 },
      { header: "Name", key: "name", width: 26 },
      { header: "Phone", key: "phone", width: 14 },
      { header: "House/Shop", key: "houseShop", width: 12 },
      { header: "Address", key: "address", width: 28 },
      { header: "Amount", key: "amount", width: 12 },
      { header: "Payment", key: "payment", width: 12 },
      { header: "Notes", key: "notes", width: 26 },
    ];
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF14532D" } };
    headerRow.alignment = { vertical: "middle" };

    const labelFor = (t: string) => (t === "HOUSE" ? "House" : t === "SHOP" ? "Shop" : "Individual");

    for (const d of donations) {
      const at = new Date(d.collectedAt);
      const receipt = d.receipt as { receiptNumber?: string } | null | undefined;
      ws.addRow({
        receipt: receipt?.receiptNumber || "",
        date: fmtExcelDate(at),
        time: fmtExcelTime(at),
        name: d.donorName,
        phone: d.phone || "",
        houseShop: d.houseShop || labelFor(d.donorType),
        address: d.address || "",
        amount: d.amount,
        payment: d.paymentMode,
        notes: d.notes || "",
      });
    }

    const total = donations.reduce((s, d) => s + d.amount, 0);
    ws.addRow({ receipt: "TOTAL", amount: total });

    const buffer = await wb.xlsx.writeBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="SVGB_Collection_2026.xlsx"');
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function collectionByDate(req: Request, res: Response): Promise<void> {
  try {
    const { from, to, donorType } = req.query as { from?: string; to?: string; donorType?: string };
    const match: Record<string, unknown> = { isCancelled: false };
    if (donorType && donorType !== "ALL") match.donorType = donorType;
    if (from || to) {
      match.collectedAt = {};
      if (from) (match.collectedAt as Record<string, unknown>).$gte = new Date(from);
      if (to) (match.collectedAt as Record<string, unknown>).$lte = new Date(new Date(to).getTime() + 86400000);
    }
    const rows = await Donation.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$collectedAt" } },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json(rows.map((r) => ({ date: r._id, total: r.total, count: r.count })));
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function collectionByDonorType(req: Request, res: Response): Promise<void> {
  try {
    const rows = await Donation.aggregate([
      { $match: { isCancelled: false } },
      { $group: { _id: "$donorType", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);
    res.json(rows.map((r) => ({ type: r._id, total: r.total, count: r.count })));
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function collectionByPaymentMode(req: Request, res: Response): Promise<void> {
  try {
    const rows = await Donation.aggregate([
      { $match: { isCancelled: false } },
      { $group: { _id: "$paymentMode", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);
    res.json(rows.map((r) => ({ mode: r._id, total: r.total, count: r.count })));
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function collectionByArea(req: Request, res: Response): Promise<void> {
  try {
    const rows = await Donation.aggregate([
      { $match: { isCancelled: false } },
      {
        $lookup: {
          from: "areas",
          localField: "area",
          foreignField: "_id",
          as: "areaInfo",
        },
      },
      { $unwind: { path: "$areaInfo", preserveNullAndEmptyArrays: true } },
      { $group: { _id: "$area", name: { $first: "$areaInfo.name" }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);
    res.json(rows.map((r) => ({ area: r._id, name: r.name || "Unassigned", total: r.total, count: r.count })));
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function collectionByCollector(req: Request, res: Response): Promise<void> {
  try {
    const rows = await Donation.aggregate([
      { $match: { isCancelled: false } },
      {
        $lookup: {
          from: "users",
          localField: "collector",
          foreignField: "_id",
          as: "collectorInfo",
        },
      },
      { $unwind: { path: "$collectorInfo", preserveNullAndEmptyArrays: true } },
      { $group: { _id: "$collector", name: { $first: "$collectorInfo.name" }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);
    res.json(rows.map((r) => ({ collector: r._id, name: r.name || "Unknown", total: r.total, count: r.count })));
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function expensesByCategory(req: Request, res: Response): Promise<void> {
  try {
    const rows = await Expense.aggregate([
      { $match: { isDeleted: false, status: { $ne: "REJECTED" } } },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);
    res.json(rows.map((r) => ({ category: r._id, total: r.total, count: r.count })));
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function incomeVsExpense(req: Request, res: Response): Promise<void> {
  try {
    const from = req.query.from ? new Date(req.query.from as string) : new Date(0);
    const to = req.query.to ? new Date(new Date(req.query.to as string).getTime() + 86400000) : new Date(Date.now() + 86400000);
    const coll = await Donation.aggregate([
      { $match: { isCancelled: false, collectedAt: { $gte: from, $lte: to } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$collectedAt" } }, income: { $sum: "$amount" } } },
    ]);
    const exp = await Expense.aggregate([
      { $match: { isDeleted: false, status: { $ne: "REJECTED" }, date: { $gte: from, $lte: to } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$date" } }, expense: { $sum: "$amount" } } },
    ]);
    const map = new Map<string, { month: string; income: number; expense: number }>();
    for (const c of coll) {
      const entry = map.get(c._id) || { month: c._id, income: 0, expense: 0 };
      entry.income = c.income;
      map.set(c._id, entry);
    }
    for (const e of exp) {
      const entry = map.get(e._id) || { month: e._id, income: 0, expense: 0 };
      entry.expense = e.expense;
      map.set(e._id, entry);
    }
    res.json(Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month)));
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function settlementReport(req: Request, res: Response): Promise<void> {
  try {
    const rows = await CashSettlement.find()
      .populate("collector", "name")
      .sort({ createdAt: -1 })
      .lean();
    const totals = rows.reduce(
      (acc, r) => {
        acc.expected += r.expectedCash;
        acc.submitted += r.submittedCash;
        return acc;
      },
      { expected: 0, submitted: 0 }
    );
    res.json({ data: rows, totals });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function finalReport(req: Request, res: Response): Promise<void> {
  try {
    const [collection, expenses, byArea, byCollector, byMode] = await Promise.all([
      Donation.aggregate([{ $match: { isCancelled: false } }, { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
      Expense.aggregate([{ $match: { isDeleted: false, status: { $ne: "REJECTED" } } }, { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
      collectionByAreaAgg(),
      collectionByCollectorAgg(),
      Donation.aggregate([{ $match: { isCancelled: false } }, { $group: { _id: "$paymentMode", total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
    ]);
    const totalCollection = collection[0]?.total || 0;
    const totalExpenses = expenses[0]?.total || 0;
    res.json({
      festival: "Ganesh Chaturthi 2026",
      totalCollection,
      totalExpenses,
      balance: totalCollection - totalExpenses,
      totalDonations: collection[0]?.count || 0,
      totalExpenseCount: expenses[0]?.count || 0,
      byArea,
      byCollector,
      byMode: byMode.map((r) => ({ mode: r._id, total: r.total, count: r.count })),
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

async function collectionByAreaAgg() {
  const rows = await Donation.aggregate([
    { $match: { isCancelled: false } },
    { $lookup: { from: "areas", localField: "area", foreignField: "_id", as: "areaInfo" } },
    { $unwind: { path: "$areaInfo", preserveNullAndEmptyArrays: true } },
    { $group: { _id: "$area", name: { $first: "$areaInfo.name" }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);
  return rows.map((r) => ({ name: r.name || "Unassigned", total: r.total, count: r.count }));
}

async function collectionByCollectorAgg() {
  const rows = await Donation.aggregate([
    { $match: { isCancelled: false } },
    { $lookup: { from: "users", localField: "collector", foreignField: "_id", as: "collectorInfo" } },
    { $unwind: { path: "$collectorInfo", preserveNullAndEmptyArrays: true } },
    { $group: { _id: "$collector", name: { $first: "$collectorInfo.name" }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);
  return rows.map((r) => ({ name: r.name || "Unknown", total: r.total, count: r.count }));
}

export async function exportCsv(req: Request, res: Response): Promise<void> {
  try {
    const { type } = req.params;
    const rows: string[][] = [];
    let filename = "export.csv";

    if (type === "donations" || type === "donations-house" || type === "donations-shop") {
      filename = "donations.csv";
      rows.push(["Receipt", "Date", "Donor", "Phone", "Type", "Area", "Collector", "Mode", "Amount", "Status"]);
      const match: Record<string, unknown> = { isCancelled: false };
      if (type === "donations-house") match.donorType = "HOUSE";
      if (type === "donations-shop") match.donorType = "SHOP";
      const docs = await Donation.find(match)
        .populate("collector", "name")
        .populate("area", "name")
        .populate("receipt", "receiptNumber")
        .sort({ collectedAt: -1 })
        .lean();
      for (const d of docs) {
        rows.push([
          (d.receipt as { receiptNumber?: string } | null)?.receiptNumber || "",
          d.collectedAt.toISOString().slice(0, 10),
          d.donorName,
          d.phone || "",
          d.donorType,
          (d.area as { name?: string } | null)?.name || "",
          (d.collector as { name?: string } | null)?.name || "",
          d.paymentMode,
          String(d.amount),
          d.isCancelled ? "Cancelled" : "Valid",
        ]);
      }
    } else if (type === "expenses") {
      filename = "expenses.csv";
      rows.push(["Date", "Category", "Description", "Vendor", "Amount", "Mode", "Status"]);
      const docs = await Expense.find({ isDeleted: false }).sort({ date: -1 }).lean();
      for (const e of docs) {
        rows.push([e.date.toISOString().slice(0, 10), e.category, e.description, e.vendor || "", String(e.amount), e.paymentMode, e.status]);
      }
    } else if (type === "receipts") {
      filename = "receipts.csv";
      rows.push(["Receipt Number", "Date", "Devotee", "Phone", "Collector", "Mode", "Amount", "Status"]);
      const docs = await Receipt.find().populate("collector", "name").sort({ issuedAt: -1 }).lean();
      for (const r of docs) {
        rows.push([
          r.receiptNumber,
          r.issuedAt.toISOString().slice(0, 10),
          r.devoteeName,
          r.phone || "",
          (r.collector as { name?: string } | null)?.name || "",
          r.paymentMode,
          String(r.amount),
          r.isCancelled ? "Cancelled" : "Valid",
        ]);
      }
    } else if (type === "settlements") {
      filename = "settlements.csv";
      rows.push(["Date", "Collector", "Expected", "Submitted", "Difference", "Status"]);
      const docs = await CashSettlement.find().populate("collector", "name").sort({ createdAt: -1 }).lean();
      for (const s of docs) {
        rows.push([
          s.date.toISOString().slice(0, 10),
          (s.collector as { name?: string } | null)?.name || "",
          String(s.expectedCash),
          String(s.submittedCash),
          String(s.difference),
          s.status,
        ]);
      }
    } else {
      res.status(400).json({ message: "Unsupported export type" });
      return;
    }

    const csv = rows
      .map((r) =>
        r
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("\uFEFF" + csv);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}
