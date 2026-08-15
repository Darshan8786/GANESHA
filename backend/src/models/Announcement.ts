import mongoose, { Schema, model, Types } from "mongoose";

export interface IAnnouncement {
  _id?: Types.ObjectId;
  title: string;
  message: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

announcementSchema.index({ isActive: 1, createdAt: -1 });

export const Announcement = model<IAnnouncement>("Announcement", announcementSchema);
