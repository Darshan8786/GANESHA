import mongoose, { Schema, model, Types } from "mongoose";
import { PaymentMode } from "../constants";

export interface IDonation {
  _id?: Types.ObjectId;
  donorType: "HOUSE" | "SHOP" | "INDIVIDUAL";
  house?: Types.ObjectId | null;
  shop?: Types.ObjectId | null;
  donorName: string;
  phone?: string;
  address?: string;
  houseShop?: string;
  amount: number;
  paymentMode: PaymentMode;
  paymentStatus: "PAID" | "PENDING";
  transactionId?: string;
  upiRef?: string;
  notes?: string;
  collector: Types.ObjectId;
  area?: Types.ObjectId | null;
  receipt?: Types.ObjectId | null;
  collectedAt: Date;
  idempotencyKey?: string;
  isCancelled: boolean;
  cancelledAt?: Date;
  cancelledBy?: Types.ObjectId | null;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const donationSchema = new Schema<IDonation>(
  {
    donorType: { type: String, enum: ["HOUSE", "SHOP", "INDIVIDUAL"], default: "INDIVIDUAL" },
    house: { type: Schema.Types.ObjectId, ref: "House", default: null },
    shop: { type: Schema.Types.ObjectId, ref: "Shop", default: null },
    donorName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    houseShop: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMode: { type: String, enum: Object.values(PaymentMode), default: PaymentMode.CASH },
    paymentStatus: { type: String, enum: ["PAID", "PENDING"], default: "PAID" },
    transactionId: { type: String, trim: true },
    upiRef: { type: String, trim: true },
    notes: { type: String, trim: true },
    collector: { type: Schema.Types.ObjectId, ref: "User", required: true },
    area: { type: Schema.Types.ObjectId, ref: "Area", default: null },
    receipt: { type: Schema.Types.ObjectId, ref: "Receipt", default: null },
    collectedAt: { type: Date, default: Date.now },
    idempotencyKey: { type: String },
    isCancelled: { type: Boolean, default: false },
    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    cancelReason: { type: String, trim: true },
  },
  { timestamps: true }
);

donationSchema.index({ receipt: 1 });
donationSchema.index({ phone: 1 });
donationSchema.index({ area: 1 });
donationSchema.index({ collector: 1 });
donationSchema.index({ collectedAt: 1 });
donationSchema.index({ paymentMode: 1 });
donationSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export const Donation = model<IDonation>("Donation", donationSchema);
