import { Request, Response } from "express";
import { Expense } from "../models/Expense";
import { ExpenseStatus } from "../constants";
import { auditLog } from "../utils/audit";

interface ListQuery {
  search?: string;
  category?: string;
  status?: string;
  paymentMode?: string;
  from?: string;
  to?: string;
  year?: string;
  page?: string;
  limit?: string;
}

export async function listExpenses(req: Request<never, never, never, ListQuery>, res: Response): Promise<void> {
  try {
    const { search, category, status, paymentMode, from, to, year, page = "1", limit = "20" } = req.query;
    const query: Record<string, unknown> = { isDeleted: false };
    if (category) query.category = category;
    if (status) query.status = status;
    if (paymentMode) query.paymentMode = paymentMode;
    if (year) {
      const y = Number(year);
      query.date = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) };
    } else if (from || to) {
      query.date = {};
      if (from) (query.date as Record<string, unknown>).$gte = new Date(from);
      if (to) (query.date as Record<string, unknown>).$lte = new Date(new Date(to).getTime() + 86400000);
    }
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ description: re }, { vendor: re }, { billNumber: re }];
    }
    const total = await Expense.countDocuments(query);
    const docs = await Expense.find(query)
      .populate("addedBy", "name")
      .populate("approvedBy", "name")
      .sort({ date: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();
    const totals = await Expense.aggregate([
      { $match: { ...query, status: { $ne: ExpenseStatus.REJECTED } } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          advanceAmount: { $sum: { $cond: ["$advance", "$amount", 0] } },
        },
      },
    ]);
    res.json({
      data: docs,
      total,
      page: Number(page),
      limit: Number(limit),
      totals: { totalAmount: totals[0]?.totalAmount || 0, advanceAmount: totals[0]?.advanceAmount || 0 },
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function getExpense(req: Request, res: Response): Promise<void> {
  try {
    const expense = await Expense.findById(req.params.id).populate("addedBy", "name").populate("approvedBy", "name").lean();
    if (!expense) {
      res.status(404).json({ message: "Expense not found" });
      return;
    }
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function createExpense(req: Request, res: Response): Promise<void> {
  try {
    const expense = await Expense.create({
      ...req.body,
      addedBy: req.user?._id as never,
      status: ExpenseStatus.PENDING,
    });
    await auditLog({
      user: req.user?._id as never,
      userName: req.user?.name,
      action: "EXPENSE_CREATED",
      recordType: "Expense",
      recordId: String(expense._id),
      details: { amount: expense.amount, category: expense.category },
      ip: req.ip,
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function updateExpense(req: Request, res: Response): Promise<void> {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      res.status(404).json({ message: "Expense not found" });
      return;
    }
    if (expense.status !== ExpenseStatus.PENDING) {
      res.status(400).json({ message: "Approved/rejected expenses cannot be edited" });
      return;
    }
    Object.assign(expense, req.body);
    await expense.save();
    await auditLog({
      user: req.user?._id as never,
      userName: req.user?.name,
      action: "EXPENSE_UPDATED",
      recordType: "Expense",
      recordId: String(expense._id),
      ip: req.ip,
    });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function reviewExpense(req: Request, res: Response): Promise<void> {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      res.status(404).json({ message: "Expense not found" });
      return;
    }
    expense.status = req.body.status;
    expense.approvedBy = req.user?._id as never;
    await expense.save();
    await auditLog({
      user: req.user?._id as never,
      userName: req.user?.name,
      action: req.body.status === ExpenseStatus.APPROVED ? "EXPENSE_APPROVED" : "EXPENSE_REJECTED",
      recordType: "Expense",
      recordId: String(expense._id),
      details: { amount: expense.amount },
      ip: req.ip,
    });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function softDeleteExpense(req: Request, res: Response): Promise<void> {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      res.status(404).json({ message: "Expense not found" });
      return;
    }
    expense.isDeleted = true;
    expense.deletedAt = new Date();
    expense.deletedBy = req.user?._id as never;
    await expense.save();
    await auditLog({
      user: req.user?._id as never,
      userName: req.user?.name,
      action: "EXPENSE_DELETED",
      recordType: "Expense",
      recordId: String(expense._id),
      ip: req.ip,
    });
    res.json({ message: "Expense removed" });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}
