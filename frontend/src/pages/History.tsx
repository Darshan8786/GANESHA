import { useEffect, useMemo, useState } from "react";
import { Search, CheckCircle2, HandCoins, Trash2, Eye, CalendarDays, Printer, Download, X } from "lucide-react";
import { api, errorMessage } from "../api/client";
import { Receipt } from "../api/types";
import { Card, Button, Modal, Badge, Spinner, EmptyState } from "../components/ui";
import { YearSelect } from "../components/YearSelect";
import { ReceiptCard, ReceiptPrint } from "../components/ReceiptCard";
import { formatINR, formatDate, PAYMENT_MODE_LABEL, downloadBlob } from "../lib/format";
import { toast } from "../lib/toast";

const FETCH_LIMIT = 1000;

const dayKey = (iso: string | Date | undefined): string => {
  const d = new Date(iso || Date.now());
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export default function History() {
  const [rows, setRows] = useState<Receipt[]>([]);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<Receipt | null>(null);
  const [payMode, setPayMode] = useState<"CASH" | "UPI">("CASH");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Receipt | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Receipt | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  const selectableRows = rows.filter((r) => !r.isCancelled);
  const allSelected = selectableRows.length > 0 && selected.size === selectableRows.length;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(allSelected ? new Set() : new Set(selectableRows.map((r) => r._id)));
  };

  const clearSelection = () => setSelected(new Set());

  const selectedRows = rows.filter((r) => selected.has(r._id));

  const handleBatchPrint = () => {
    const ids = selectedRows.map((r) => `rp-${r._id}`);
    if (!ids.length) return;
    const html = ids
      .map((id, i) => (i > 0 ? `<div class="pg-break"></div>` : "") + (document.getElementById(id)?.innerHTML || ""))
      .join("");
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>SVGB Receipts</title>
      <style>
        body { margin: 0; }
        .card { background: #fff; }
        .pg-break { page-break-after: always; }
      </style>
      </head><body>
      ${html}
      </body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleBatchDownload = async () => {
    const ids = selectedRows.map((r) => r._id);
    if (!ids.length) return;
    setDownloading(true);
    try {
      const res = await api.post("/receipts/batch/pdf", { ids }, { responseType: "blob" });
      downloadBlob(res.data, `SVGB_Receipts_${ids.length}.pdf`);
      toast.success(`Downloaded ${ids.length} receipts`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  const load = async (q = search, y = year) => {
    setLoading(true);
    try {
      const res = await api.get("/receipts", {
        params: { limit: FETCH_LIMIT, search: q || undefined, year: y },
      });
      setRows(res.data.data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      load(search, year);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, year]);

  const markPaid = async () => {
    if (!paying) return;
    const donationId = typeof paying.donation === "string" ? paying.donation : paying.donation?._id;
    if (!donationId) {
      toast.error("Cannot update this record");
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/donations/${donationId}/pay`, { paymentMode: payMode });
      toast.success("Marked as paid");
      setPaying(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const donorId = typeof deleting.donation === "string" ? deleting.donation : deleting.donation?._id;
    if (!donorId) {
      toast.error("Cannot delete this record");
      return;
    }
    setDeletingId(donorId);
    try {
      await api.delete(`/donations/${donorId}`);
      toast.success("Collection deleted");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const isPending = (r: Receipt) => r.paymentMode === "LATER" && !r.isCancelled;

  const groups = useMemo(() => {
    const map = new Map<string, Receipt[]>();
    for (const r of rows) {
      const k = dayKey(r.issuedAt);
      const arr = map.get(k) || [];
      arr.push(r);
      map.set(k, arr);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [rows]);

  const totalAll = rows.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <div className="space-y-4 fade-up">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xl font-black text-brand-green emboss">Collection History</div>
          <div className="text-xs text-gray-500">
            {year} · {rows.length} records · {formatINR(totalAll)}
          </div>
        </div>
        <div className="w-28 shrink-0">
          <YearSelect value={year} onChange={setYear} />
        </div>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-11 !rounded-2xl !py-3"
          placeholder="Search name / receipt no / phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {selected.size > 0 && (
        <div
          className="sticky top-16 z-30 flex items-center gap-2 rounded-2xl px-4 py-3 text-white shadow-lg"
          style={{ backgroundImage: "linear-gradient(180deg, #1b6b3d 0%, #14532d 60%, #0d3a1f 100%)", boxShadow: "0 6px 0 0 #0a2c17, 0 16px 30px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)" }}
        >
          <div className="text-sm font-bold">{selected.size} selected</div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="gold" className="!px-3 !py-2 !text-xs" onClick={handleBatchPrint}>
              <Printer size={14} /> Print
            </Button>
            <Button variant="gold" className="!px-3 !py-2 !text-xs" loading={downloading} onClick={handleBatchDownload}>
              <Download size={14} /> PDF
            </Button>
            <button onClick={clearSelection} className="rounded-lg p-1.5 text-white/80 hover:bg-white/20" title="Clear selection">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : rows.length === 0 ? (
        <Card><EmptyState title="No records" message="No collections found for this year." /></Card>
      ) : (
        <div className="space-y-5">
          {groups.map(([day, list]) => {
            const dayTotal = list.reduce((s, r) => s + (r.amount || 0), 0);
            return (
              <div key={day} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-gray-700">
                    <CalendarDays size={14} className="text-brand-green" />
                    {formatDate(day)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-brand-green hover:bg-brand-cream"
                      title="Select all visible"
                    >
                      {allSelected ? <CheckCircle2 size={13} /> : <span className="inline-block h-3.5 w-3.5 rounded border-2 border-brand-green" />}
                      Select all
                    </button>
                    <div className="text-xs font-bold text-gray-500">{list.length} · {formatINR(dayTotal)}</div>
                  </div>
                </div>
                {list.map((r) => (
                  <Card key={r._id} className="!p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={() => toggleSelect(r._id)}
                        disabled={r.isCancelled}
                        className={`shrink-0 self-center rounded p-1 transition ${r.isCancelled ? "opacity-30" : "hover:bg-brand-cream"}`}
                        title={selected.has(r._id) ? "Deselect" : "Select for batch print"}
                      >
                        {selected.has(r._id) ? (
                          <CheckCircle2 size={20} className="text-brand-green" />
                        ) : (
                          <span className="inline-block h-5 w-5 rounded-md border-2 border-gray-300" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brand-green">{r.receiptNumber}</span>
                          {isPending(r) ? <Badge status="PENDING">Pending</Badge> : r.isCancelled ? <Badge status="CANCELLED">Cancelled</Badge> : <Badge status="VALID">Paid</Badge>}
                        </div>
                        <div className="font-bold text-gray-900 truncate">{r.devoteeName}</div>
                        <div className="text-[11px] text-gray-400">{formatDate(r.issuedAt)}, {PAYMENT_MODE_LABEL[r.paymentMode] || r.paymentMode}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="text-right">
                          <div className="text-lg font-black text-brand-green">{formatINR(r.amount)}</div>
                          {isPending(r) && (
                            <Button variant="gold" className="!px-2.5 !py-1.5 text-xs mt-1" onClick={() => { setPaying(r); setPayMode("CASH"); }}>
                              <HandCoins size={13} /> Paid
                            </Button>
                          )}
                        </div>
                        <button
                          onClick={() => setViewing(r)}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-brand-green hover:text-white"
                          title="View receipt"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => setDeleting(r)}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <div className="hidden">
        {selectedRows.map((r) => (
          <ReceiptPrint key={r._id} receipt={r} printId={`rp-${r._id}`} />
        ))}
      </div>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Receipt">
        {viewing && <ReceiptCard receipt={viewing} />}
      </Modal>

      <Modal open={!!paying} onClose={() => setPaying(null)} title="Mark as Paid">
        {paying && (
          <div className="space-y-4">
            <div className="rounded-xl bg-brand-cream p-3 text-sm">
              <div className="font-bold text-gray-900">{paying.devoteeName}</div>
              <div className="text-xs text-gray-500">Receipt {paying.receiptNumber} · {formatINR(paying.amount)}</div>
            </div>
            <div>
              <label className="label">How did they pay?</label>
              <div className="grid grid-cols-2 gap-2">
                {(["CASH", "UPI"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`rounded-xl border-2 py-3.5 text-base font-bold ${payMode === m ? "border-brand-green bg-brand-green text-white" : "border-gray-200 bg-white text-gray-700"}`}
                    onClick={() => setPayMode(m)}
                  >
                    {m === "CASH" ? "💵 Cash" : "📱 UPI"}
                  </button>
                ))}
              </div>
            </div>
            <Button variant="primary" className="w-full" loading={saving} onClick={markPaid}>
              <CheckCircle2 size={16} /> Confirm {payMode === "CASH" ? "Cash" : "UPI"} Payment
            </Button>
          </div>
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Collection?">
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This will permanently remove <b>{deleting.devoteeName}</b> — Receipt <b className="font-mono">{deleting.receiptNumber}</b> ({formatINR(deleting.amount)}).
              This cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="danger" loading={!!deletingId} onClick={confirmDelete}>
                <Trash2 size={16} /> Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}