import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/User";
import { env } from "../config/env";
import { auditLog } from "../utils/audit";
import { UserRole } from "../constants";

function signToken(id: string): string {
  return jwt.sign({ id }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({ message: "Account disabled. Contact administrator." });
      return;
    }
    // Single-admin system: only the administrator account can sign in.
    if (user.role !== UserRole.SUPER_ADMIN) {
      res.status(403).json({ message: "Only the administrator can sign in." });
      return;
    }
    const token = signToken(String(user._id));
    await auditLog({
      user: user._id,
      userName: user.name,
      action: "LOGIN",
      recordType: "User",
      recordId: String(user._id),
      ip: req.ip,
    });
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        assignedAreas: user.assignedAreas,
      },
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.user?._id).select("-password").populate("assignedAreas", "name").lean();
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      res.status(400).json({ message: "Old and new passwords are required" });
      return;
    }
    if (String(newPassword).length < 6) {
      res.status(400).json({ message: "New password must be at least 6 characters" });
      return;
    }
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) {
      res.status(400).json({ message: "Current password is incorrect" });
      return;
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    await auditLog({
      user: user._id,
      userName: user.name,
      action: "PASSWORD_CHANGED",
      recordType: "User",
      recordId: String(user._id),
      ip: req.ip,
    });
    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function appInfo(req: Request, res: Response): Promise<void> {
  res.json({
    org: {
      name: env.org.name,
      fullName: env.org.fullName,
      tagline: env.org.tagline,
      festivalName: env.org.festivalName,
      festivalYear: env.org.festivalYear,
      receiptPrefix: env.org.receiptPrefix,
    },
    databaseName: mongoose.connection.name || "",
    version: 1,
  });
}
