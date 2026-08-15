import mongoose, { Schema, model, Types } from "mongoose";
import { PaymentMode, SponsorPackage } from "../constants";

export interface ISponsor {
  _id?: Types.ObjectId;
  businessName: string;
  owner?: string;
  phone?: string;
  amount: number;
  package: string;
  paymentMode: PaymentMode;
  logo?: string;
  advertisement?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

const sponsorSchema = new Schema<ISponsor>(
  {
    businessName: { type: String, required: true, trim: true },
    owner: { type: String, trim: true },
    phone: { type: String, trim: true },
    amount: { type: Number, default: 0, min: 0 },
    package: { type: String, enum: Object.values(SponsorPackage), default: SponsorPackage.BRONZE },
    paymentMode: { type: String, enum: Object.values(PaymentMode), default: PaymentMode.CASH },
    logo: { type: String },
    advertisement: { type: String, trim: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  },
  { timestamps: true }
);

export const Sponsor = model<ISponsor>("Sponsor", sponsorSchema);
