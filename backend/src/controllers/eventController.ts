import { Request, Response } from "express";
import { Event } from "../models/Event";
import { Announcement } from "../models/Announcement";
import { auditLog } from "../utils/audit";

// ----- Events -----
export async function listEvents(req: Request, res: Response): Promise<void> {
  try {
    const events = await Event.find().sort({ date: 1 }).lean();
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function createEvent(req: Request, res: Response): Promise<void> {
  try {
    const event = await Event.create({ ...req.body, date: new Date(req.body.date) });
    await auditLog({
      user: req.user?._id as never,
      userName: req.user?.name,
      action: "EVENT_CREATED",
      recordType: "Event",
      recordId: String(event._id),
      ip: req.ip,
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function updateEvent(req: Request, res: Response): Promise<void> {
  try {
    const body = { ...req.body };
    if (body.date) body.date = new Date(body.date);
    const event = await Event.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function deleteEvent(req: Request, res: Response): Promise<void> {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

// ----- Announcements -----
export async function listAnnouncements(req: Request, res: Response): Promise<void> {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 }).lean();
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function createAnnouncement(req: Request, res: Response): Promise<void> {
  try {
    const announcement = await Announcement.create(req.body);
    await auditLog({
      user: req.user?._id as never,
      userName: req.user?.name,
      action: "ANNOUNCEMENT_CREATED",
      recordType: "Announcement",
      recordId: String(announcement._id),
      ip: req.ip,
    });
    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function updateAnnouncement(req: Request, res: Response): Promise<void> {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!announcement) {
      res.status(404).json({ message: "Announcement not found" });
      return;
    }
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function deleteAnnouncement(req: Request, res: Response): Promise<void> {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      res.status(404).json({ message: "Announcement not found" });
      return;
    }
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}
