import { Request, Response } from "express";
import { Donation } from "../models/Donation";
import { Event } from "../models/Event";
import { Announcement } from "../models/Announcement";
import { Sponsor } from "../models/Sponsor";
import { env } from "../config/env";

export async function publicHome(req: Request, res: Response): Promise<void> {
  try {
    const [coll, events, announcements, sponsors] = await Promise.all([
      Donation.aggregate([{ $match: { isCancelled: false } }, { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
      Event.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(6).lean(),
      Announcement.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).lean(),
      Sponsor.find({ status: "ACTIVE" }).sort({ amount: -1 }).limit(10).lean(),
    ]);
    res.json({
      organization: {
        name: env.org.name,
        fullName: env.org.fullName,
        tagline: env.org.tagline,
        festival: env.org.festivalName,
      },
      totalCollection: coll[0]?.total || 0,
      totalDonations: coll[0]?.count || 0,
      festivalDate: "2026-09-19",
      upcomingEvents: events,
      announcements,
      sponsors,
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}
