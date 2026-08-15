import mongoose, { Schema, model, Types } from "mongoose";
import { HouseStatus } from "../constants";

export interface IShop {
  _id?: Types.ObjectId;
  shopId: string;
  shopName: string;
  ownerName?: string;
  phone?: string;
  address: string;
  area: Types.ObjectId;
  street?: string;
  previousDonation?: number;
  currentDonation?: number;
  status: HouseStatus;
  assignedCollector?: Types.ObjectId | null;
  notes?: string;
  lastVisitedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const shopSchema = new Schema<IShop>(
  {
    shopId: { type: String, required: true, unique: true, trim: true },
    shopName: { type: String, required: true, trim: true },
    ownerName: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, required: true, trim: true },
    area: { type: Schema.Types.ObjectId, ref: "Area", required: true },
    street: { type: String, trim: true },
    previousDonation: { type: Number, default: 0, min: 0 },
    currentDonation: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: Object.values(HouseStatus), default: HouseStatus.NOT_VISITED },
    assignedCollector: { type: Schema.Types.ObjectId, ref: "User", default: null },
    notes: { type: String, trim: true },
    lastVisitedAt: { type: Date },
  },
  { timestamps: true }
);

shopSchema.index({ phone: 1 });
shopSchema.index({ area: 1 });
shopSchema.index({ assignedCollector: 1 });
shopSchema.index({ status: 1 });
shopSchema.index({ shopName: "text" });

export const Shop = model<IShop>("Shop", shopSchema);
