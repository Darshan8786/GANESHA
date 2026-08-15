import mongoose, { Schema, model, Types } from "mongoose";

export interface IEvent {
  _id?: Types.ObjectId;
  name: string;
  date: Date;
  startTime: string;
  endTime?: string;
  location?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String },
    location: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

eventSchema.index({ date: 1 });

export const Event = model<IEvent>("Event", eventSchema);
