import { Request, Response } from "express";
import { House } from "../models/House";
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

export async function listHouses(req: Request<never, never, never, ListQuery>, res: Response): Promise<void> {
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
      query.$or = [{ ownerName: re }, { phone: re }, { houseNumber: re }, { houseId: re }, { address: re }];
    }
    const total = await House.countDocuments(query);
    const docs = await House.find(query)
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

export async function getHouse(req: Request, res: Response): Promise<void> {
  try {
    const house = await House.findById(req.params.id).populate("area", "name").populate("assignedCollector", "name").lean();
    if (!house) {
      res.status(404).json({ message: "House not found" });
      return;
    }
    const history = await Donation.find({ house: house._id, isCancelled: false })
      .populate("collector", "name")
      .sort({ collectedAt: -1 })
      .lean();
    res.json({ ...house, history });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function createHouse(req: Request, res: Response): Promise<void> {
  try {
    const house = await House.create(req.body);
    await auditLog({
      user: req.user?._id as never,
      userName: req.user?.name,
      action: "HOUSE_CREATED",
      recordType: "House",
      recordId: String(house._id),
      details: { houseId: house.houseId, ownerName: house.ownerName },
      ip: req.ip,
    });
    res.status(201).json(house);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function updateHouse(req: Request, res: Response): Promise<void> {
  try {
    const house = await House.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!house) {
      res.status(404).json({ message: "House not found" });
      return;
    }
    await auditLog({
      user: req.user?._id as never,
      userName: req.user?.name,
      action: "HOUSE_UPDATED",
      recordType: "House",
      recordId: String(house._id),
      ip: req.ip,
    });
    res.json(house);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function assignCollector(req: Request, res: Response): Promise<void> {
  try {
    const house = await House.findById(req.params.id);
    if (!house) {
      res.status(404).json({ message: "House not found" });
      return;
    }
    house.assignedCollector = req.body.collectorId || null;
    await house.save();
    res.json(house);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function changeStatus(req: Request, res: Response): Promise<void> {
  try {
    const house = await House.findById(req.params.id);
    if (!house) {
      res.status(404).json({ message: "House not found" });
      return;
    }
    house.status = req.body.status;
    house.notes = req.body.note ?? house.notes;
    house.lastVisitedAt = new Date();
    await house.save();
    res.json(house);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}
