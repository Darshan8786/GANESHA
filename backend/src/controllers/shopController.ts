import { Request, Response } from "express";
import { Shop } from "../models/Shop";
import { Donation } from "../models/Donation";
import { auditLog } from "../utils/audit";

interface ListQuery {
  search?: string;
  area?: string;
  status?: string;
  collector?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
  assigned?: string;
}

export async function listShops(req: Request<never, never, never, ListQuery>, res: Response): Promise<void> {
  try {
    const { search, area, status, collector, page = "1", limit = "20", sortBy = "createdAt", sortOrder = "desc", assigned } = req.query;
    const query: Record<string, unknown> = {};
    if (area) query.area = area;
    if (status) query.status = status;
    if (collector) query.assignedCollector = collector;
    if (assigned === "yes") query.assignedCollector = { $ne: null };
    if (assigned === "no") query.assignedCollector = null;
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ shopName: re }, { ownerName: re }, { phone: re }, { shopId: re }, { address: re }];
    }
    const total = await Shop.countDocuments(query);
    const docs = await Shop.find(query)
      .populate("area", "name")
      .populate("assignedCollector", "name")
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();
    res.json({ data: docs, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function getShop(req: Request, res: Response): Promise<void> {
  try {
    const shop = await Shop.findById(req.params.id).populate("area", "name").populate("assignedCollector", "name").lean();
    if (!shop) {
      res.status(404).json({ message: "Shop not found" });
      return;
    }
    const history = await Donation.find({ shop: shop._id, isCancelled: false })
      .populate("collector", "name")
      .sort({ collectedAt: -1 })
      .lean();
    res.json({ ...shop, history });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function createShop(req: Request, res: Response): Promise<void> {
  try {
    const shop = await Shop.create(req.body);
    await auditLog({
      user: req.user?._id as never,
      userName: req.user?.name,
      action: "SHOP_CREATED",
      recordType: "Shop",
      recordId: String(shop._id),
      details: { shopId: shop.shopId, shopName: shop.shopName },
      ip: req.ip,
    });
    res.status(201).json(shop);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function updateShop(req: Request, res: Response): Promise<void> {
  try {
    const shop = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!shop) {
      res.status(404).json({ message: "Shop not found" });
      return;
    }
    await auditLog({
      user: req.user?._id as never,
      userName: req.user?.name,
      action: "SHOP_UPDATED",
      recordType: "Shop",
      recordId: String(shop._id),
      ip: req.ip,
    });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function assignCollector(req: Request, res: Response): Promise<void> {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      res.status(404).json({ message: "Shop not found" });
      return;
    }
    shop.assignedCollector = req.body.collectorId || null;
    await shop.save();
    res.json(shop);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function changeStatus(req: Request, res: Response): Promise<void> {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      res.status(404).json({ message: "Shop not found" });
      return;
    }
    shop.status = req.body.status;
    shop.notes = req.body.note ?? shop.notes;
    shop.lastVisitedAt = new Date();
    await shop.save();
    res.json(shop);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}
