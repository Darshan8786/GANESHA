import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";
import { UserRole } from "../constants";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  assignedAreas: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function protect(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      res.status(401).json({ message: "Not authorized, token missing" });
      return;
    }
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, env.jwtSecret) as { id: string };
    const user = await User.findById(decoded.id).select("-password").lean();
    if (!user) {
      res.status(401).json({ message: "Not authorized, user not found" });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({ message: "Account disabled, contact administrator" });
      return;
    }
    req.user = {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      assignedAreas: (user.assignedAreas || []).map((a) => String(a)),
    };
    next();
  } catch {
    res.status(401).json({ message: "Not authorized, invalid or expired token" });
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden: insufficient permissions" });
      return;
    }
    next();
  };
}
