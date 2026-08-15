import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { User } from "../models/User";
import { Donation } from "../models/Donation";
import { auditLog } from "../utils/audit";
import { UserRole } from "../constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function publicUser(u: any): Record<string, unknown> {
  const obj = typeof u === "object" && "toObject" in u ? u.toObject() : u;
  const { password: _pw, ...rest } = obj;
  return rest;
}

export async function listCollectors(req: Request, res: Response): Promise<void> {
  try {
    const users = await User.find({ role: UserRole.COLLECTOR })
      .select("-password")
      .populate("assignedAreas", "name")
      .sort({ name: 1 })
      .lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await User.find().select("-password").populate("assignedAreas", "name").sort({ role: 1, name: 1 }).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, phone, password, role, assignedAreas } = req.body;
    if (req.user?.role === UserRole.COLLECTION_MANAGER && role !== UserRole.COLLECTOR) {
      res.status(403).json({ message: "Collection managers can only create collectors" });
      return;
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ message: "User with this email already exists" });
      return;
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      phone,
      password: hashed,
      role,
      assignedAreas: (assignedAreas || []).map((a: string) => new Types.ObjectId(a)),
    });
    await auditLog({
      user: req.user?._id as never,
      userName: req.user?.name,
      action: "USER_CREATED",
      recordType: "User",
      recordId: String(user._id),
      details: { name, email, role },
      ip: req.ip,
    });
    res.status(201).json(publicUser(user.toObject()));
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const { password, assignedAreas, ...rest } = req.body;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    if (assignedAreas) {
      user.assignedAreas = assignedAreas.map((a: string) => new Types.ObjectId(a));
    }
    Object.assign(user, rest);
    await user.save();
    await auditLog({
      user: req.user?._id as never,
      userName: req.user?.name,
      action: "USER_UPDATED",
      recordType: "User",
      recordId: id,
      ip: req.ip,
    });
    res.json(publicUser(user.toObject()));
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function disableUser(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    user.isActive = req.body.isActive !== false;
    await user.save();
    await auditLog({
      user: req.user?._id as never,
      userName: req.user?.name,
      action: user.isActive ? "USER_ENABLED" : "USER_DISABLED",
      recordType: "User",
      recordId: id,
      ip: req.ip,
    });
    res.json(publicUser(user.toObject()));
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function collectorPerformance(req: Request, res: Response): Promise<void> {
  try {
    const collectors = await User.find({ role: UserRole.COLLECTOR }).select("-password").lean();
    const performance = [];
    for (const c of collectors) {
      const total = await Donation.aggregate([
        { $match: { collector: c._id, isCancelled: false } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$amount" } } },
      ]);
      performance.push({
        _id: c._id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        isActive: c.isActive,
        totalCollections: total[0]?.count || 0,
        totalAmount: total[0]?.total || 0,
      });
    }
    res.json(performance);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}
