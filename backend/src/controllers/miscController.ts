import { Request, Response } from "express";
import { Volunteer } from "../models/Volunteer";
import { Sponsor } from "../models/Sponsor";
import { Inventory } from "../models/Inventory";

// ----- Volunteers -----
export async function listVolunteers(req: Request, res: Response): Promise<void> {
  try {
    const volunteers = await Volunteer.find().sort({ name: 1 }).lean();
    res.json(volunteers);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function createVolunteer(req: Request, res: Response): Promise<void> {
  try {
    const volunteer = await Volunteer.create(req.body);
    res.status(201).json(volunteer);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function updateVolunteer(req: Request, res: Response): Promise<void> {
  try {
    const volunteer = await Volunteer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!volunteer) {
      res.status(404).json({ message: "Volunteer not found" });
      return;
    }
    res.json(volunteer);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function deleteVolunteer(req: Request, res: Response): Promise<void> {
  try {
    const volunteer = await Volunteer.findByIdAndDelete(req.params.id);
    if (!volunteer) {
      res.status(404).json({ message: "Volunteer not found" });
      return;
    }
    res.json({ message: "Volunteer deleted" });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

// ----- Sponsors -----
export async function listSponsors(req: Request, res: Response): Promise<void> {
  try {
    const sponsors = await Sponsor.find().sort({ amount: -1 }).lean();
    res.json(sponsors);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function createSponsor(req: Request, res: Response): Promise<void> {
  try {
    const sponsor = await Sponsor.create(req.body);
    res.status(201).json(sponsor);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function updateSponsor(req: Request, res: Response): Promise<void> {
  try {
    const sponsor = await Sponsor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!sponsor) {
      res.status(404).json({ message: "Sponsor not found" });
      return;
    }
    res.json(sponsor);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function deleteSponsor(req: Request, res: Response): Promise<void> {
  try {
    const sponsor = await Sponsor.findByIdAndDelete(req.params.id);
    if (!sponsor) {
      res.status(404).json({ message: "Sponsor not found" });
      return;
    }
    res.json({ message: "Sponsor deleted" });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

// ----- Inventory -----
export async function listInventory(req: Request, res: Response): Promise<void> {
  try {
    const items = await Inventory.find().sort({ item: 1 }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function createInventory(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body;
    const remaining = body.purchased - body.used;
    const item = await Inventory.create({ ...body, remaining });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function updateInventory(req: Request, res: Response): Promise<void> {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      res.status(404).json({ message: "Inventory item not found" });
      return;
    }
    const body = req.body;
    item.item = body.item ?? item.item;
    item.category = body.category ?? item.category;
    item.vendor = body.vendor ?? item.vendor;
    item.cost = body.cost ?? item.cost;
    if (body.purchased !== undefined) item.purchased = body.purchased;
    if (body.used !== undefined) item.used = body.used;
    if (body.quantity !== undefined) item.quantity = body.quantity;
    item.remaining = item.purchased - item.used;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function deleteInventory(req: Request, res: Response): Promise<void> {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) {
      res.status(404).json({ message: "Inventory item not found" });
      return;
    }
    res.json({ message: "Inventory item deleted" });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}
