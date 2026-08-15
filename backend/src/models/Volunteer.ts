import mongoose, { Schema, model, Types } from "mongoose";
import { VolunteerRole } from "../constants";

export interface IVolunteer {
  _id?: Types.ObjectId;
  name: string;
  phone: string;
  role: string;
  area?: string;
  availability?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

const volunteerSchema = new Schema<IVolunteer>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    role: { type: String, required: true },
    area: { type: String, trim: true },
    availability: { type: String, trim: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  },
  { timestamps: true }
);

volunteerSchema.index({ role: 1 });
volunteerSchema.index({ phone: 1 });

export const Volunteer = model<IVolunteer>("Volunteer", volunteerSchema);
