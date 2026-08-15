import { Request, Response } from "express";
import mongoose from "mongoose";
import { Donation } from "../models/Donation";
import { Expense } from "../models/Expense";
import { House } from "../models/House";
import { Shop } from "../models/Shop";
import { User } from "../models/User";
import { Receipt } from "../models/Receipt";
import { UserRole } from "../constants";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export async function dashboard(req: Request, res: Response): Promise<void> {
  try {
    const today = startOfToday();
    const year = Number(req.query.year) || new Date().getFullYear();
    const yearRange = { collectedAt: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) } };

    const [collectionAgg, expenseAgg, pendingAgg, paymentModeAgg] = await Promise.all([
      Donation.aggregate([
        { $match: { isCancelled: false, paymentStatus: "PAID", ...yearRange } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        {
          $match: {
            isDeleted: false,
            status: { $ne: "REJECTED" },
            date: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) },
          },
        },
        { $group: { _id: "$category", cost: { $max: "$amount" }, given: { $sum: { $ifNull: ["$advance", 0] } } } },
        { $group: { _id: null, cost: { $sum: "$cost" }, given: { $sum: "$given" }, count: { $sum: 1 } } },
      ]),
      Donation.aggregate([
        { $match: { isCancelled: false, paymentStatus: "PENDING", ...yearRange } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Donation.aggregate([
        { $match: { isCancelled: false, paymentStatus: "PAID", ...yearRange } },
        { $group: { _id: "$paymentMode", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

    const [todayColl, todayExp, dailyAgg] = await Promise.all([
      Donation.aggregate([
        { $match: { isCancelled: false, paymentStatus: "PAID", collectedAt: { $gte: today, ...(yearRange.collectedAt as Record<string, unknown>) } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        {
          $match: {
            isDeleted: false,
            status: { $ne: "REJECTED" },
            date: { $gte: today, $lt: new Date(year + 1, 0, 1) },
          },
        },
        { $group: { _id: null, given: { $sum: { $ifNull: ["$advance", 0] } } } },
      ]),
      Donation.aggregate([
        {
          $match: {
            isCancelled: false,
            paymentStatus: "PAID",
            collectedAt: {
              $gte: new Date(today.getTime() - 6 * 86400000),
              $lt: new Date(year + 1, 0, 1),
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$collectedAt" } },
            cash: { $sum: { $cond: [{ $eq: ["$paymentMode", "CASH"] }, "$amount", 0] } },
            upi: { $sum: { $cond: [{ $eq: ["$paymentMode", "UPI"] }, "$amount", 0] } },
            bank: { $sum: { $cond: [{ $eq: ["$paymentMode", "BANK_TRANSFER"] }, "$amount", 0] } },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const dailyMap = new Map(dailyAgg.map((d) => [d._id as string, d]));
    const dailyCollection: { date: string; cash: number; upi: number; bank: number; total: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const p = (n: number) => String(n).padStart(2, "0");
      const key = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
      const row = dailyMap.get(key);
      dailyCollection.push({
        date: key,
        cash: row?.cash || 0,
        upi: row?.upi || 0,
        bank: row?.bank || 0,
        total: row?.total || 0,
        count: row?.count || 0,
      });
    }

    const [totalHouses, totalShops, totalReceipts, totalDonors, totalCollectors, houseVsShop] = await Promise.all([
      House.countDocuments(),
      Shop.countDocuments(),
      Receipt.countDocuments({ isCancelled: false, issuedAt: yearRange.collectedAt }),
      Donation.countDocuments({ isCancelled: false, paymentStatus: "PAID", ...yearRange }),
      User.countDocuments({ role: UserRole.COLLECTOR, isActive: true }),
      Donation.aggregate([
        { $match: { isCancelled: false, paymentStatus: "PAID", ...yearRange } },
        { $group: { _id: "$donorType", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

    const pendingHouses = await House.countDocuments({ status: { $ne: "COLLECTED" } });
    const pendingShops = await Shop.countDocuments({ status: { $ne: "COLLECTED" } });
    const collectedHouses = await House.countDocuments({ status: "COLLECTED" });
    const collectedShops = await Shop.countDocuments({ status: "COLLECTED" });

    const totalCollection = collectionAgg[0]?.total || 0;
    const givenOut = expenseAgg[0]?.given || 0;
    const expenseCost = expenseAgg[0]?.cost || 0;
    const expensePending = Math.max(0, expenseCost - givenOut);
    const donorTypeTotals: Record<string, { total: number; count: number }> = {};
    for (const row of houseVsShop) {
      donorTypeTotals[row._id] = { total: row.total, count: row.count };
    }
    const paymentModeTotals: Record<string, number> = {};
    for (const row of paymentModeAgg) {
      paymentModeTotals[row._id] = row.total;
    }

    res.json({
      year,
      totalCollection,
      totalDonations: collectionAgg[0]?.count || 0,
      cashCollection: paymentModeTotals["CASH"] || 0,
      upiCollection: paymentModeTotals["UPI"] || 0,
      bankCollection: paymentModeTotals["BANK_TRANSFER"] || 0,
      pendingCollection: pendingAgg[0]?.total || 0,
      pendingCount: pendingAgg[0]?.count || 0,
      totalExpenses: givenOut,
      givenOut,
      expenseCost,
      expensePending,
      balance: totalCollection - givenOut,
      todayCollection: todayColl[0]?.total || 0,
      todayCollectionsCount: todayColl[0]?.count || 0,
      todayExpenses: todayExp[0]?.given || 0,
      dailyCollection,
      totalDonors,
      totalReceipts,
      totalHouses,
      totalShops,
      totalCollectors,
      houseCollection: donorTypeTotals["HOUSE"]?.total || 0,
      shopCollection: donorTypeTotals["SHOP"]?.total || 0,
      individualCollection: donorTypeTotals["INDIVIDUAL"]?.total || 0,
      pendingHouses,
      pendingShops,
      totalPending: pendingHouses + pendingShops,
      totalTargets: totalHouses + totalShops,
      collectedTargets: collectedHouses + collectedShops,
      collectionPercentage: totalHouses + totalShops > 0 ? Math.round(((collectedHouses + collectedShops) / (totalHouses + totalShops)) * 100) : 0,
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function collectorDashboard(req: Request, res: Response): Promise<void> {
  try {
    const collectorId = new mongoose.Types.ObjectId(req.user?._id as string);
    const today = startOfToday();

    const [todayColl, totalColl] = await Promise.all([
      Donation.aggregate([
        { $match: { collector: collectorId, isCancelled: false, collectedAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Donation.aggregate([
        { $match: { collector: collectorId, isCancelled: false } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

    const [assignedHouses, assignedShops, visitedHouses, visitedShops, collectedHouses, collectedShops] = await Promise.all([
      House.countDocuments({ assignedCollector: collectorId }),
      Shop.countDocuments({ assignedCollector: collectorId }),
      House.countDocuments({ assignedCollector: collectorId, status: { $ne: "NOT_VISITED" } }),
      Shop.countDocuments({ assignedCollector: collectorId, status: { $ne: "NOT_VISITED" } }),
      House.countDocuments({ assignedCollector: collectorId, status: "COLLECTED" }),
      Shop.countDocuments({ assignedCollector: collectorId, status: "COLLECTED" }),
    ]);

    const assigned = assignedHouses + assignedShops;
    const visited = visitedHouses + visitedShops;
    const collected = collectedHouses + collectedShops;

    // Cash expected today (cash donations collected today)
    const [cashToday] = await Donation.aggregate([
      { $match: { collector: collectorId, isCancelled: false, collectedAt: { $gte: today }, paymentMode: "CASH" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      todayCollection: todayColl[0]?.total || 0,
      todayCollectionsCount: todayColl[0]?.count || 0,
      totalCollection: totalColl[0]?.total || 0,
      totalCollectionsCount: totalColl[0]?.count || 0,
      assignedHouses,
      assignedShops,
      assignedTargets: assigned,
      visited,
      collected,
      pending: assigned - collected,
      visitedPercentage: assigned > 0 ? Math.round((visited / assigned) * 100) : 0,
      collectionPercentage: assigned > 0 ? Math.round((collected / assigned) * 100) : 0,
      expectedCashToday: cashToday?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

/**
 * Assigned houses + shops for the collector's mobile collection flow.
 */
export async function collectorAssignments(req: Request, res: Response): Promise<void> {
  try {
    const collectorId = new mongoose.Types.ObjectId(req.user?._id as string);
    const { status, search } = req.query as { status?: string; search?: string };
    const base = { assignedCollector: collectorId };
    const query: Record<string, unknown> = { ...base };
    if (status && status !== "ALL") query.status = status;
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ ownerName: re }, { phone: re }, { houseNumber: re }, { houseId: re }, { shopName: re }, { address: re }];
    }

    const houses = await House.find(query)
      .populate("area", "name")
      .sort({ houseId: 1 })
      .lean();

    const shopQuery = { ...query };
    delete shopQuery.$or;
    const shopSearch: Record<string, unknown>[] = [];
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      shopSearch.push({ shopName: re }, { ownerName: re }, { phone: re }, { shopId: re }, { address: re });
    }
    const shops = await Shop.find({
      assignedCollector: collectorId,
      status: status && status !== "ALL" ? status : undefined,
      ...(shopSearch.length ? { $or: shopSearch } : {}),
    })
      .populate("area", "name")
      .sort({ shopId: 1 })
      .lean();

    const list = [
      ...houses.map((h) => ({ type: "HOUSE" as const, ...h })),
      ...shops.map((s) => ({ type: "SHOP" as const, ...s })),
    ];
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

/**
 * Full search across ALL houses + shops for the single-admin fast collection
 * flow (not scoped to any collector).
 */
export async function collectionSearch(req: Request, res: Response): Promise<void> {
  try {
    const { status, search } = req.query as { status?: string; search?: string };

    const houseQuery: Record<string, unknown> = {};
    if (status && status !== "ALL") houseQuery.status = status;
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      houseQuery.$or = [{ ownerName: re }, { phone: re }, { houseNumber: re }, { houseId: re }, { address: re }];
    }
    const houses = await House.find(houseQuery)
      .populate("area", "name")
      .sort({ houseId: 1 })
      .limit(100)
      .lean();

    const shopQuery: Record<string, unknown> = {};
    if (status && status !== "ALL") shopQuery.status = status;
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      shopQuery.$or = [{ shopName: re }, { ownerName: re }, { phone: re }, { shopId: re }, { address: re }];
    }
    const shops = await Shop.find(shopQuery)
      .populate("area", "name")
      .sort({ shopId: 1 })
      .limit(100)
      .lean();

    const list = [
      ...houses.map((h) => ({ type: "HOUSE" as const, ...h })),
      ...shops.map((s) => ({ type: "SHOP" as const, ...s })),
    ];
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}
