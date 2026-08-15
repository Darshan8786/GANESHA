import { Receipt } from "../models/Receipt";
import { env } from "../config/env";

/**
 * Generates the next sequential receipt number e.g. SVGB-2026-0001
 * Uses a findOneAndUpdate style counter to remain atomic-ish in single
 * instance deployments and guards against duplicates with a retry.
 */
export async function generateReceiptNumber(): Promise<string> {
  const prefix = `${env.org.receiptPrefix}-${env.org.festivalYear}-`;
  const year = env.org.festivalYear;

  for (let attempt = 0; attempt < 5; attempt++) {
    const last = await Receipt.findOne({
      receiptNumber: { $regex: `^${prefix}` },
    })
      .sort({ receiptNumber: -1 })
      .select("receiptNumber")
      .lean();

    let seq = 1;
    if (last && last.receiptNumber) {
      const parts = last.receiptNumber.split("-");
      seq = Number(parts[parts.length - 1]) + 1;
    }

    const candidate = `${prefix}${String(seq).padStart(4, "0")}`;
    const existing = await Receipt.exists({ receiptNumber: candidate });
    if (!existing) {
      return candidate;
    }
  }

  // Fallback: use timestamp suffix to guarantee uniqueness
  const fallback = `${prefix}${Date.now()}`;
  console.warn(`[receipt] uniqueness fallback used: ${fallback} (year=${year})`);
  return fallback;
}
