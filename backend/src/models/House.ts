import mongoose, { Schema, model, Types } from "mongoose";
import { HouseStatus } from "../constants";

export interface IHouse {
  _id?: Types.ObjectId;
  houseId: string;
  ownerName: string;
  phone?: string;
  address: string;
  area: Types.ObjectId;
  street?: string;
  houseNumber?: string;
  previousYearDonation?: number;
  currentYearDonation?: number;
  status: HouseStatus;
  assignedCollector?: Types.ObjectId | null;
  notes?: string;
  latitude?: number;
  longitude?: number;
  lastVisitedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const houseSchema = new Schema<IHouse>(
  {
    houseId: { type: String, required: true, unique: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, required: true, trim: true },
    area: { type: Schema.Types.ObjectId, ref: "Area", required: true },
    street: { type: String, trim: true },
    houseNumber: { type: String, trim: true },
    previousYearDonation: { type: Number, default: 0, min: 0 },
    currentYearDonation: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: Object.values(HouseStatus), default: HouseStatus.NOT_VISITED },
    assignedCollector: { type: Schema.Types.ObjectId, ref: "User", default: null },
    notes: { type: String, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
    lastVisitedAt: { type: Date },
  },
  { timestamps: true }
);

houseSchema.index({ phone: 1 });
houseSchema.index({ area: 1 });
houseSchema.index({ assignedCollector: 1 });
houseSchema.index({ status: 1 });
houseSchema.index({ ownerName: "text", houseNumber: "text" });

export const House = model<IHouse>("House", houseSchema);
