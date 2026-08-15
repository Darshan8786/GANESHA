import { Download, Printer, MessageCircle, CheckCircle2, XCircle } from "lucide-react";
import { api, errorMessage } from "../api/client";
import { Receipt } from "../api/types";
import { formatINR, formatDate, formatTime, PAYMENT_MODE_LABEL, whatsappShareLink, buildReceiptWhatsappMessage } from "../lib/format";
import { Button } from "./ui";
import { toast } from "../lib/toast";

export function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const handlePdf = async () => {
    try {
      const res = await api.get(`/receipts/${receipt._id}/pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${receipt.receiptNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const bg = `url('${window.location.origin}/receipt-bg.jpg')`;
    printWindow.document.write(`
      <html><head><title>${receipt.receiptNumber}</title>
      <style>
        body { margin: 0; }
        .receipt-bg { position: relative; background-image: ${bg}; background-size: cover; background-position: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .receipt-bg-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.86); pointer-events: none; }
        .relative { position: relative; z-index: 1; }
      </style>
      </head><body>
      ${document.getElementById("receipt-print")?.innerHTML || ""}
      </body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const whatsapp = () => {
    window.open(
      whatsappShareLink(
        receipt.phone,
        buildReceiptWhatsappMessage({
          receiptNumber: receipt.receiptNumber,
          devoteeName: receipt.devoteeName,
          amount: receipt.amount,
          paymentMode: receipt.paymentMode,
        })
      ),
      "_blank"
    );
  };

  return (
    <div className="space-y-4">
      <div id="receipt-print" className="receipt-bg card overflow-hidden max-w-md mx-auto">
        <div className="receipt-bg-overlay" />
        <div className="relative z-10">
          <div className="bg-brand-green text-white px-6 py-5 text-center">
            <div className="text-2xl font-black tracking-wide">SVGB</div>
            <div className="text-xs font-semibold text-green-200 tracking-widest uppercase">SIDDI VINAYAKA GELEYARA BALAGA</div>
            <div className="mt-2 inline-block rounded-full bg-brand-gold px-3 py-1 text-xs font-bold tracking-wider uppercase">
              Ganesh Chaturthi Receipt
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Receipt Number</div>
                <div className="font-mono font-bold text-brand-green">{receipt.receiptNumber}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Date · Time</div>
                <div className="text-sm font-semibold text-gray-700">
                  {formatDate(receipt.issuedAt)} · {formatTime(receipt.issuedAt)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Devotee</div>
                <div className="font-bold text-gray-900 text-lg">{receipt.devoteeName}</div>
                {receipt.phone && <div className="text-xs text-gray-500">{receipt.phone}</div>}
              </div>
              {receipt.address && (
                <div className="col-span-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">House / Shop</div>
                  <div className="text-gray-700">{receipt.address}</div>
                </div>
              )}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Collector</div>
                <div className="text-gray-700">{receipt.collectorName || (typeof receipt.collector === "object" ? receipt.collector?.name : "-")}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Payment Mode</div>
                <div className="text-gray-700">{PAYMENT_MODE_LABEL[receipt.paymentMode] || receipt.paymentMode}</div>
              </div>
            </div>

            <div className="rounded-xl bg-brand-gold text-white text-center py-5">
              <div className="text-xs font-semibold uppercase tracking-widest">Amount Donated</div>
              <div className="text-4xl font-black mt-1">{formatINR(receipt.amount)}</div>
            </div>

            <div className="text-center">
              <div className="text-sm font-bold text-brand-green">Thank you for your contribution.</div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-dashed border-gray-200">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-xs font-semibold text-green-600">
                  {receipt.isCancelled ? "Cancelled" : "Valid receipt"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!receipt.isCancelled && (
        <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
          <Button variant="outline" className="!flex-col !gap-1 !py-3 !text-xs" onClick={handlePdf}>
            <Download size={18} /> Download PDF
          </Button>
          <Button variant="outline" className="!flex-col !gap-1 !py-3 !text-xs" onClick={handlePrint}>
            <Printer size={18} /> Print
          </Button>
          <Button variant="gold" className="!flex-col !gap-1 !py-3 !text-xs" onClick={whatsapp}>
            <MessageCircle size={18} /> WhatsApp
          </Button>
        </div>
      )}

      {receipt.isCancelled && (
        <div className="max-w-md mx-auto flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm font-semibold">
          <XCircle size={18} /> This receipt has been cancelled and is not valid.
        </div>
      )}
    </div>
  );
}

export function ReceiptSuccessMark() {
  return (
    <div className="flex flex-col items-center py-4">
      <CheckCircle2 size={64} className="text-green-600" />
      <div className="text-xl font-bold text-gray-900 mt-2">Donation Recorded!</div>
      <div className="text-sm text-gray-500">Receipt generated successfully</div>
    </div>
  );
}