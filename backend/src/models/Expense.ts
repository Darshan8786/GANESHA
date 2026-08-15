import mongoose, { Schema, model, Types } from "mongoose";
import { ExpenseCategory, ExpenseStatus, PaymentMode } from "../constants";

export interface IExpense {
  _id?: Types.ObjectId;
  category: string;
  description: string;
  amount: number;
  date: Date;
  paymentMode: PaymentMode;
  advance?: boolean;
  vendor?: string;
  billNumber?: string;
  billAttachment?: string;
  addedBy: Types.ObjectId;
  approvedBy?: Types.ObjectId | null;
  status: (typeof ExpenseStatus)[keyof typeof ExpenseStatus];
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    category: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    paymentMode: { type: String, enum: Object.values(PaymentMode), default: PaymentMode.CASH },
    advance: { type: Boolean, default: false },
    vendor: { type: String, trim: true },
    billNumber: { type: String, trim: true },
    billAttachment: { type: String },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: Object.values(ExpenseStatus), default: ExpenseStatus.PENDING },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

expenseSchema.index({ category: 1 });
expenseSchema.index({ date: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ addedBy: 1 });

export const Expense = model<IExpense>("Expense", expenseSchema);
