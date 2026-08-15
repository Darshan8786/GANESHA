import mongoose, { Schema, model, Types } from "mongoose";

export interface IInventory {
  _id?: Types.ObjectId;
  item: string;
  category?: string;
  quantity: number;
  purchased: number;
  used: number;
  remaining: number;
  vendor?: string;
  cost?: number;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<IInventory>(
  {
    item: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    quantity: { type: Number, default: 0, min: 0 },
    purchased: { type: Number, default: 0, min: 0 },
    used: { type: Number, default: 0, min: 0 },
    remaining: { type: Number, default: 0, min: 0 },
    vendor: { type: String, trim: true },
    cost: { type: Number, min: 0 },
  },
  { timestamps: true }
);

export const Inventory = model<IInventory>("Inventory", inventorySchema);
