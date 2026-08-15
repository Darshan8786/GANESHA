import { Request, Response } from "express";
import { Area } from "../models/Area";
import { House } from "../models/House";
import { Shop } from "../models/Shop";
import { Donation } from "../models/Donation";
import { auditLog } from "../utils/audit";

export async function listAreas(req: Request, res: Response): Promise<void> {
  try {
    const areas = await Area.find().sort({ name: 1 }).lean();
    res.json(areas);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function areaStats(req: Request, res: Response): Promise<void> {
  try {
    const areas = await Area.find().lean();
    const result = [];
    for (const a of areas) {
      const houses = await House.countDocuments({ area: a._id });
      const shops = await Shop.countDocuments({ area: a._id });
      const collectedHouses = await House.countDocuments({ area: a._id, status: "COLLECTED" });
      const collectedShops = await Shop.countDocuments({ area: a._id, status: "COLLECTED" });
      const visitedHouses = await House.countDocuments({ area: a._id, status: { $ne: "NOT_VISITED" } });
      const visitedShops = await Shop.countDocuments({ area: a._id, status: { $ne: "NOT_VISITED" } });
      const totalTargets = houses + shops;
      const collectedTargets = collectedHouses + collectedShops;
      const visitedTargets = visitedHouses + visitedShops;
      const total = await Donation.aggregate([
        { $match: { area: a._id, isCancelled: false } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      result.push({
        _id: a._id,
        name: a.name,
        description: a.description,
        totalHouses: houses,
        totalShops: shops,
        visited: visitedTargets,
        collected: collectedTargets,
        pending: totalTargets - collectedTargets,
        totalAmount: total[0]?.total || 0,
        percentage: totalTargets > 0 ? Math.round((collectedTargets / totalTargets) * 100) : 0,
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function createArea(req: Request, res: Response): Promise<void> {
  try {
    const area = await Area.create(req.body);
    await auditLog({
      user: req.user?._id as never,
      userName: req.user?.name,
      action: "AREA_CREATED",
      recordType: "Area",
      recordId: String(area._id),
      ip: req.ip,
    });
    res.status(201).json(area);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function updateArea(req: Request, res: Response): Promise<void> {
  try {
    const area = await Area.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!area) {
      res.status(404).json({ message: "Area not found" });
      return;
    }
    res.json(area);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function deleteArea(req: Request, res: Response): Promise<void> {
  try {
    const houses = await House.countDocuments({ area: req.params.id });
    const shops = await Shop.countDocuments({ area: req.params.id });
    if (houses + shops > 0) {
      res.status(400).json({ message: "Cannot delete area with houses/shops assigned. Deactivate it instead." });
      return;
    }
    const area = await Area.findByIdAndDelete(req.params.id);
    if (!area) {
      res.status(404).json({ message: "Area not found" });
      return;
    }
    res.json({ message: "Area deleted" });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}
