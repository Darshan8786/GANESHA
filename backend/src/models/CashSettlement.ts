import mongoose, { Schema, model, Types } from "mongoose";
import { SettlementStatus } from "../constants";

export interface ISettlementItem {
  label: string;
  amount: number;
}

export interface ICashSettlement {
  _id?: Types.ObjectId;
  collector: Types.ObjectId;
  area?: Types.ObjectId | null;
  date: Date;
  morningCash: number;
  items: ISettlementItem[];
  expectedCash: number;
  submittedCash: number;
  difference: number;
  status: (typeof SettlementStatus)[keyof typeof SettlementStatus];
  submittedAt: Date;
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date;
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const settlementSchema = new Schema<ICashSettlement>(
  {
    collector: { type: Schema.Types.ObjectId, ref: "User", required: true },
    area: { type: Schema.Types.ObjectId, ref: "Area", default: null },
    date: { type: Date, default: Date.now },
    morningCash: { type: Number, default: 0, min: 0 },
    items: [
      {
        label: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
      },
    ],
    expectedCash: { type: Number, required: true, min: 0 },
    submittedCash: { type: Number, required: true, min: 0 },
    difference: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(SettlementStatus), default: SettlementStatus.PENDING },
    submittedAt: { type: Date, default: Date.now },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date },
    reviewNote: { type: String, trim: true },
  },
  { timestamps: true }
);

settlementSchema.index({ collector: 1 });
settlementSchema.index({ date: 1 });
settlementSchema.index({ status: 1 });

export const CashSettlement = model<ICashSettlement>("CashSettlement", settlementSchema);
