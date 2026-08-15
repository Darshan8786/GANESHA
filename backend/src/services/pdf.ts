import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { env } from "../config/env";

const receiptBgPath = path.join(__dirname, "..", "..", "assets", "receipt-bg.jpg");

export interface ReceiptPdfData {
  receiptNumber: string;
  date: string;
  time: string;
  devoteeName: string;
  phone?: string;
  address?: string;
  donorType: string;
  collectorName: string;
  paymentMode: string;
  amount: number;
  qrDataUrl?: string;
}

const green = "#14532d";
const gold = "#d97706";
const light = "#fefce8";
const ink = "#1f2937";
const muted = "#6b7280";

export function buildReceiptPdf(data: ReceiptPdfData): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: "A4", margin: 40 });

  // Background photo (subtle watermark behind the design blocks)
  if (fs.existsSync(receiptBgPath)) {
    doc.save();
    doc.opacity(0.3);
    doc.image(receiptBgPath, 0, 0, { width: doc.page.width, height: doc.page.height });
    doc.restore();
  }

  // Top band
  doc.rect(0, 0, doc.page.width, 96).fill(green);
  doc
    .fillColor("#ffffff")
    .fontSize(30)
    .font("Helvetica-Bold")
    .text(env.org.name, 40, 28, { width: 200, align: "left" });
  doc
    .fontSize(13)
    .font("Helvetica")
    .text(env.org.tagline.toUpperCase(), 40, 64, { width: 400 });
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(`GANESH CHATURTHI RECEIPT`, 0, 32, { width: doc.page.width - 40, align: "right" });
  doc
    .fontSize(8)
    .font("Helvetica")
    .text(env.org.festivalName, 0, 52, { width: doc.page.width - 40, align: "right" });

  // Card
  doc.rect(40, 120, doc.page.width - 80, 260).fillAndStroke(light, gold);
  doc.strokeColor(gold).lineWidth(2).rect(40, 120, doc.page.width - 80, 260).stroke();

  doc
    .fillColor(muted)
    .fontSize(9)
    .font("Helvetica")
    .text("RECEIPT NUMBER", 60, 150);
  doc
    .fillColor(ink)
    .fontSize(16)
    .font("Helvetica-Bold")
    .text(data.receiptNumber, 60, 164);

  doc
    .fillColor(muted)
    .fontSize(9)
    .text("DATE", 60, 214);
  doc
    .fillColor(ink)
    .fontSize(12)
    .font("Helvetica")
    .text(data.date, 60, 228);

  doc
    .fillColor(muted)
    .fontSize(9)
    .text("TIME", 240, 214);
  doc
    .fillColor(ink)
    .fontSize(12)
    .text(data.time, 240, 228);

  doc
    .fillColor(muted)
    .fontSize(9)
    .text("DEVOTEE", 60, 264);
  doc
    .fillColor(ink)
    .fontSize(13)
    .font("Helvetica-Bold")
    .text(data.devoteeName, 60, 278);
  doc
    .fillColor(muted)
    .fontSize(9)
    .text(data.phone ? `Phone: ${data.phone}` : "", 60, 298);

  doc
    .fillColor(muted)
    .fontSize(9)
    .text("ADDRESS", 240, 264);
  doc
    .fillColor(ink)
    .fontSize(10)
    .font("Helvetica")
    .text(data.address || "-", 240, 278, { width: 300 });

  doc
    .fillColor(muted)
    .fontSize(9)
    .text("COLLECTOR", 60, 340);
  doc
    .fillColor(ink)
    .fontSize(12)
    .font("Helvetica")
    .text(data.collectorName, 60, 354);

  doc
    .fillColor(muted)
    .fontSize(9)
    .text("PAYMENT MODE", 240, 340);
  doc
    .fillColor(ink)
    .fontSize(12)
    .text(data.paymentMode, 240, 354);

  // Amount box
  doc.rect(40, 410, doc.page.width - 80, 90).fill(gold);
  doc
    .fillColor("#ffffff")
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("AMOUNT DONATED", 0, 428, { width: doc.page.width - 40, align: "right" });
  doc
    .fontSize(36)
    .text(`₹${data.amount.toLocaleString("en-IN")}`, 0, 448, { width: doc.page.width - 40, align: "right" });

  // Thank you
  doc
    .fillColor(green)
    .fontSize(13)
    .font("Helvetica-Bold")
    .text("Thank you for your contribution.", 40, 540);

  doc
    .fillColor(muted)
    .fontSize(9)
    .font("Helvetica")
    .text(`${env.org.fullName}`, 40, 700);
  doc
    .fillColor(muted)
    .fontSize(7)
    .text("This is a computer generated receipt. It is valid without a signature.", 40, 716);

  return doc;
}
