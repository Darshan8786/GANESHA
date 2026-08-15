import mongoose, { Schema, model, Types } from "mongoose";
import { PaymentMode } from "../constants";

export interface IReceipt {
  _id?: Types.ObjectId;
  receiptNumber: string;
  donation: Types.ObjectId;
  devoteeName: string;
  phone?: string;
  address?: string;
  donorType: "HOUSE" | "SHOP" | "INDIVIDUAL";
  house?: Types.ObjectId | null;
  shop?: Types.ObjectId | null;
  collector: Types.ObjectId;
  collectorName?: string;
  paymentMode: PaymentMode;
  amount: number;
  qrDataUrl?: string;
  isCancelled: boolean;
  cancelledAt?: Date;
  cancelledBy?: Types.ObjectId | null;
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const receiptSchema = new Schema<IReceipt>(
  {
    receiptNumber: { type: String, required: true },
    donation: { type: Schema.Types.ObjectId, ref: "Donation", required: true },
    devoteeName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    donorType: { type: String, enum: ["HOUSE", "SHOP", "INDIVIDUAL"], default: "INDIVIDUAL" },
    house: { type: Schema.Types.ObjectId, ref: "House", default: null },
    shop: { type: Schema.Types.ObjectId, ref: "Shop", default: null },
    collector: { type: Schema.Types.ObjectId, ref: "User", required: true },
    collectorName: { type: String, trim: true },
    paymentMode: { type: String, enum: Object.values(PaymentMode), default: PaymentMode.CASH },
    amount: { type: Number, required: true, min: 0 },
    qrDataUrl: { type: String },
    isCancelled: { type: Boolean, default: false },
    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

receiptSchema.index({ receiptNumber: 1 }, { unique: true });
receiptSchema.index({ donation: 1 });
receiptSchema.index({ phone: 1 });
receiptSchema.index({ collector: 1 });
receiptSchema.index({ issuedAt: 1 });

export const Receipt = model<IReceipt>("Receipt", receiptSchema);
