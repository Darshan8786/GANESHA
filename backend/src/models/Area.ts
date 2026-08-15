import mongoose, { Schema, model, Types } from "mongoose";

export interface IArea {
  _id?: Types.ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const areaSchema = new Schema<IArea>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

areaSchema.index({ name: 1 }, { unique: true });

export const Area = model<IArea>("Area", areaSchema);
