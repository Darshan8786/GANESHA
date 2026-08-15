import mongoose, { Schema, model, Types } from "mongoose";
import { UserRole } from "../constants";

export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  assignedAreas: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.COLLECTOR },
    isActive: { type: Boolean, default: true },
    assignedAreas: [{ type: Schema.Types.ObjectId, ref: "Area" }],
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

export const User = model<IUser>("User", userSchema);
