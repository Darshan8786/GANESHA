export function formatINR(amount: number | undefined | null): string {
  const value = Number(amount || 0);
  return `₹${value.toLocaleString("en-IN")}`;
}

export function formatDate(iso: string | Date | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatTime(iso: string | Date | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(iso: string | Date | undefined): string {
  if (!iso) return "-";
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export const HOUSE_STATUS_LABEL: Record<string, string> = {
  NOT_VISITED: "Not Visited",
  VISITED: "Visited",
  COLLECTED: "Collected",
  WILL_PAY_LATER: "Will Pay Later",
  NOT_AVAILABLE: "Not Available",
  REFUSED: "Refused",
};

export const PAYMENT_MODE_LABEL: Record<string, string> = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  LATER: "Later",
};

export function statusColor(status: string): string {
  switch (status) {
    case "COLLECTED":
    case "APPROVED":
    case "VERIFIED":
    case "VALID":
    case "ACTIVE":
      return "bg-green-100 text-green-700";
    case "NOT_VISITED":
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    case "VISITED":
    case "WILL_PAY_LATER":
      return "bg-blue-100 text-blue-700";
    case "NOT_AVAILABLE":
    case "REJECTED":
      return "bg-gray-200 text-gray-600";
    case "REFUSED":
    case "CANCELLED":
    case "INACTIVE":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function whatsappShareLink(phone: string | undefined, message: string): string {
  if (!phone) return `https://wa.me/?text=${encodeURIComponent(message)}`;
  const digits = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildReceiptWhatsappMessage(receipt: {
  receiptNumber: string;
  devoteeName: string;
  amount: number;
  paymentMode: string;
}): string {
  const lines = [
    "🙏 Thank you for your contribution to Ganesh Chaturthi 2026.",
    "",
    `Receipt No: ${receipt.receiptNumber}`,
    `Devotee: ${receipt.devoteeName}`,
    `Amount: ${formatINR(receipt.amount)}`,
    `Payment Mode: ${PAYMENT_MODE_LABEL[receipt.paymentMode] || receipt.paymentMode}`,
    "",
    "SVGB – Siddi Vinayaka Geleyara Balaga",
  ];
  return lines.join("\n");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  downloadBlob(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }), filename);
}

export function generateIdempotencyKey(): string {
  return `kt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}