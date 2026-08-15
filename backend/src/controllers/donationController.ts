import { Request, Response } from "express";
import mongoose, { HydratedDocument } from "mongoose";
import { Donation } from "../models/Donation";
import { Receipt, IReceipt } from "../models/Receipt";
import { House, IHouse } from "../models/House";
import { Shop, IShop } from "../models/Shop";
import { generateReceiptNumber } from "../services/receiptNumber";
import { generateQRDataUrl, buildVerifyUrl } from "../services/qr";
import { auditLog } from "../utils/audit";
import { AuditLog } from "../models/AuditLog";
import { PaymentMode } from "../constants";

/**
 * Create a donation and its receipt.
 *
 * Note: this intentionally does NOT use a MongoDB multi-document transaction
 * because local standalone deployments (no replica set) don't support them.
 * Duplicate protection is handled by the unique `idempotencyKey` index plus a
 * receipt-number retry loop, which is sufficient for door-to-door collection.
 */
export async function createDonation(req: Request, res: Response): Promise<void> {
  try {
    const {
      donorType,
      houseId,
      shopId,
      donorName,
      phone,
      address,
      houseShop,
      amount,
      paymentMode,
      transactionId,
      upiRef,
      notes,
      idempotencyKey,
      collectedAt,
    } = req.body;

    // Idempotency guard: prevent duplicate donations during offline sync replay
    if (idempotencyKey) {
      const existing = await Donation.findOne({ idempotencyKey }).populate("receipt").lean();
      if (existing) {
        res.status(200).json({ ...existing, receipt: existing.receipt, duplicate: true });
        return;
      }
    }

    const collector = req.user!;
    let areaId: string | null = null;
    let houseDoc: HydratedDocument<IHouse> | null = null;
    let shopDoc: HydratedDocument<IShop> | null = null;

    if (donorType === "HOUSE" && houseId) {
      houseDoc = await House.findById(houseId);
      if (!houseDoc) {
        res.status(404).json({ message: "House not found" });
        return;
      }
      areaId = String(houseDoc.area);
    } else if (donorType === "SHOP" && shopId) {
      shopDoc = await Shop.findById(shopId);
      if (!shopDoc) {
        res.status(404).json({ message: "Shop not found" });
        return;
      }
      areaId = String(shopDoc.area);
    }

    let donation;
    try {
      donation = await Donation.create({
        donorType,
        house: houseId || null,
        shop: shopId || null,
        donorName,
        phone,
        address,
        houseShop,
        amount,
        paymentMode,
        paymentStatus: paymentMode === PaymentMode.LATER ? "PENDING" : "PAID",
        transactionId,
        upiRef,
        notes,
        collector: new mongoose.Types.ObjectId(collector._id),
        area: areaId,
        idempotencyKey,
        collectedAt: collectedAt ? new Date(collectedAt) : new Date(),
      });
    } catch (err) {
      // Duplicate idempotency key (E11000) => concurrent replay -> return existing
      const code = (err as { code?: number }).code;
      if (code === 11000 && idempotencyKey) {
        const existing = await Donation.findOne({ idempotencyKey }).populate("receipt").lean();
        if (existing) {
          res.status(200).json({ ...existing, receipt: existing.receipt, duplicate: true });
          return;
        }
      }
      throw err;
    }

    // Build receipt with retry loop for receipt number uniqueness
    let receipt: HydratedDocument<IReceipt> | undefined;
    for (let attempt = 0; attempt < 5; attempt++) {
      const receiptNumber = await generateReceiptNumber();
      const verifyUrl = buildVerifyUrl(receiptNumber);
      const qrDataUrl = await generateQRDataUrl(verifyUrl);
      try {
        receipt = await Receipt.create({
          receiptNumber,
          donation: donation._id,
          devoteeName: donorName,
          phone,
          address,
          donorType,
          house: houseId || null,
          shop: shopId || null,
          collector: new mongoose.Types.ObjectId(collector._id),
          collectorName: collector.name,
          paymentMode,
          amount,
          qrDataUrl,
          issuedAt: collectedAt ? new Date(collectedAt) : new Date(),
        });
        donation.receipt = receipt._id;
        await donation.save();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (receipt as any).verifyUrl = verifyUrl;
        break;
      } catch (err) {
        const code = (err as { code?: number }).code;
        if (code !== 11000 || attempt === 4) {
          throw err;
        }
      }
    }
    if (!receipt) {
      throw new Error("Failed to generate receipt after retries");
    }

    if (houseDoc) {
      if (paymentMode === PaymentMode.LATER) {
        houseDoc.status = "WILL_PAY_LATER";
      } else {
        houseDoc.status = "COLLECTED";
        houseDoc.currentYearDonation = (houseDoc.currentYearDonation || 0) + amount;
      }
      houseDoc.lastVisitedAt = new Date();
      await houseDoc.save();
    }
    if (shopDoc) {
      if (paymentMode === PaymentMode.LATER) {
        shopDoc.status = "WILL_PAY_LATER";
      } else {
        shopDoc.status = "COLLECTED";
        shopDoc.currentDonation = (shopDoc.currentDonation || 0) + amount;
      }
      shopDoc.lastVisitedAt = new Date();
      await shopDoc.save();
    }

    await auditLog({
      user: new mongoose.Types.ObjectId(collector._id),
      userName: collector.name,
      action: "DONATION_CREATED",
      recordType: "Donation",
      recordId: String(donation._id),
      details: { amount, paymentMode, receiptNumber: receipt.receiptNumber },
      ip: req.ip,
    });

    res.status(201).json({
      donation: donation.toObject(),
      receipt: {
        _id: receipt._id,
        receiptNumber: receipt.receiptNumber,
        devoteeName: receipt.devoteeName,
        amount: receipt.amount,
        paymentMode: receipt.paymentMode,
        issuedAt: receipt.issuedAt,
        qrDataUrl: receipt.qrDataUrl,
        verifyUrl: (receipt as { verifyUrl?: string }).verifyUrl,
      },
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

interface ListQuery {
  search?: string;
  area?: string;
  collector?: string;
  paymentMode?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: string;
  limit?: string;
  donorType?: string;
}

export async function listDonations(req: Request<never, never, never, ListQuery>, res: Response): Promise<void> {
  try {
    const { search, area, collector, paymentMode, status, from, to, page = "1", limit = "20", donorType } = req.query;
    const query: Record<string, unknown> = {};
    if (area) query.area = area;
    if (collector) query.collector = collector;
    if (paymentMode) query.paymentMode = paymentMode;
    if (donorType) query.donorType = donorType;
    if (status === "cancelled") query.isCancelled = true;
    else query.isCancelled = false;
    if (from || to) {
      query.collectedAt = {};
      if (from) (query.collectedAt as Record<string, unknown>).$gte = new Date(from);
      if (to) (query.collectedAt as Record<string, unknown>).$lte = new Date(new Date(to).getTime() + 86400000);
    }
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ donorName: re }, { phone: re }, { address: re }];
    }
    const total = await Donation.countDocuments(query);
    const docs = await Donation.find(query)
      .populate("collector", "name")
      .populate("area", "name")
      .populate("receipt", "receiptNumber")
      .sort({ collectedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();
    const totals = await Donation.aggregate([
      { $match: { ...query, isCancelled: false } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);
    res.json({
      data: docs,
      total,
      page: Number(page),
      limit: Number(limit),
      totals: { totalAmount: totals[0]?.totalAmount || 0, count: totals[0]?.count || 0 },
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function getDonation(req: Request, res: Response): Promise<void> {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate("collector", "name")
      .populate("area", "name")
      .populate("receipt")
      .populate("house")
      .populate("shop")
      .lean();
    if (!donation) {
      res.status(404).json({ message: "Donation not found" });
      return;
    }
    res.json(donation);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

/**
 * Permanently delete a donation along with its receipt and audit logs.
 */
export async function deleteDonation(req: Request, res: Response): Promise<void> {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      res.status(404).json({ message: "Donation not found" });
      return;
    }

    const amount = donation.amount;
    const receiptNumber = donation.receipt
      ? String((await Receipt.findById(donation.receipt).select("receiptNumber").lean())?.receiptNumber || "")
      : "";

    if (donation.receipt) {
      await Receipt.findByIdAndDelete(donation.receipt);
    }

    // Revert house/shop aggregates if this donation added to them
    if (donation.house) {
      const house = await House.findById(donation.house);
      if (house) {
        house.currentYearDonation = Math.max(0, (house.currentYearDonation || 0) - amount);
        if (house.status === "COLLECTED") house.status = "VISITED";
        await house.save();
      }
    }
    if (donation.shop) {
      const shop = await Shop.findById(donation.shop);
      if (shop) {
        shop.currentDonation = Math.max(0, (shop.currentDonation || 0) - amount);
        if (shop.status === "COLLECTED") shop.status = "VISITED";
        await shop.save();
      }
    }

    await AuditLog.deleteMany({ $or: [{ recordId: String(donation._id) }, { "details.receiptNumber": receiptNumber }] });

    await auditLog({
      user: new mongoose.Types.ObjectId(req.user!._id),
      userName: req.user?.name,
      action: "DONATION_DELETED",
      recordType: "Donation",
      recordId: String(donation._id),
      details: { amount, receiptNumber },
      ip: req.ip,
    });

    await Donation.findByIdAndDelete(donation._id);

    res.json({ success: true, message: "Donation and receipt removed", receiptNumber });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function cancelDonation(req: Request, res: Response): Promise<void> {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      res.status(404).json({ message: "Donation not found" });
      return;
    }
    if (donation.isCancelled) {
      res.status(400).json({ message: "Donation already cancelled" });
      return;
    }
    donation.isCancelled = true;
    donation.cancelledAt = new Date();
    donation.cancelledBy = new mongoose.Types.ObjectId(req.user!._id);
    donation.cancelReason = req.body.reason || "Cancelled by admin";
    await donation.save();

    if (donation.receipt) {
      await Receipt.findByIdAndUpdate(donation.receipt, {
        isCancelled: true,
        cancelledAt: new Date(),
        cancelledBy: new mongoose.Types.ObjectId(req.user!._id),
      });
    }

    // Revert house/shop status if this was the current year's collection
    const amount = donation.amount;
    if (donation.house) {
      const house = await House.findById(donation.house);
      if (house) {
        house.currentYearDonation = Math.max(0, (house.currentYearDonation || 0) - amount);
        if (house.status === "COLLECTED") house.status = "VISITED";
        await house.save();
      }
    }
    if (donation.shop) {
      const shop = await Shop.findById(donation.shop);
      if (shop) {
        shop.currentDonation = Math.max(0, (shop.currentDonation || 0) - amount);
        if (shop.status === "COLLECTED") shop.status = "VISITED";
        await shop.save();
      }
    }

    await auditLog({
      user: new mongoose.Types.ObjectId(req.user!._id),
      userName: req.user?.name,
      action: "DONATION_CANCELLED",
      recordType: "Donation",
      recordId: String(donation._id),
      details: { reason: donation.cancelReason },
      ip: req.ip,
    });
    res.json(donation);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export const allowedPaymentModes = Object.values(PaymentMode);

/**
 * Mark a LATER (pending) donation as paid with CASH or UPI.
 * Updates the linked receipt and the house/shop record.
 */
export async function payPendingDonation(req: Request, res: Response): Promise<void> {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      res.status(404).json({ message: "Donation not found" });
      return;
    }
    if (donation.paymentMode !== PaymentMode.LATER) {
      res.status(400).json({ message: "Only pending (LATER) donations can be marked as paid" });
      return;
    }
    const { paymentMode } = req.body as { paymentMode: "CASH" | "UPI" };

    donation.paymentMode = paymentMode;
    donation.paymentStatus = "PAID";
    donation.collectedAt = new Date();
    await donation.save();

    if (donation.receipt) {
      const receipt = await Receipt.findById(donation.receipt);
      if (receipt) {
        receipt.paymentMode = paymentMode;
        receipt.issuedAt = donation.collectedAt;
        await receipt.save();
      }
    }

    if (donation.house) {
      const house = await House.findById(donation.house);
      if (house) {
        house.status = "COLLECTED";
        house.currentYearDonation = (house.currentYearDonation || 0) + donation.amount;
        house.lastVisitedAt = new Date();
        await house.save();
      }
    }
    if (donation.shop) {
      const shop = await Shop.findById(donation.shop);
      if (shop) {
        shop.status = "COLLECTED";
        shop.currentDonation = (shop.currentDonation || 0) + donation.amount;
        shop.lastVisitedAt = new Date();
        await shop.save();
      }
    }

    await auditLog({
      user: new mongoose.Types.ObjectId(req.user!._id),
      userName: req.user?.name,
      action: "DONATION_PAID",
      recordType: "Donation",
      recordId: String(donation._id),
      details: { paymentMode },
      ip: req.ip,
    });

    res.json(donation);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}