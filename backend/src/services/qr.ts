import QRCode from "qrcode";
import { env } from "../config/env";

export async function generateQRDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 220,
    color: { dark: "#14532d", light: "#ffffff" },
  });
}

export function buildVerifyUrl(receiptNumber: string): string {
  return `${env.publicBaseUrl}/verify/${encodeURIComponent(receiptNumber)}`;
}
