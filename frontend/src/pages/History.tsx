import { useEffect, useState } from "react";
import { Search, CheckCircle2, HandCoins, Trash2, Eye } from "lucide-react";
import { api, errorMessage } from "../api/client";
import { Receipt } from "../api/types";
import { Card, Button, Modal, Badge, Spinner, EmptyState } from "../components/ui";
import { YearSelect } from "../components/YearSelect";
import { ReceiptCard } from "../components/ReceiptCard";
import { formatINR, formatDateTime, PAYMENT_MODE_LABEL } from "../lib/format";
import { toast } from "../lib/toast";

const LIMIT = 20;

export default function History() {
  const [rows, setRows] = useState<Receipt[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<Receipt | null>(null);
  const [payMode, setPayMode] = useState<"CASH" | "UPI">("CASH");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Receipt | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Receipt | null>(null);

  const load = async (p = page, q = search, y = year) => {
    setLoading(true);
    try {
      const res = await api.get("/receipts", {
        params: { page: p, limit: LIMIT, search: q || undefined, year: y },
      });
      setRows(res.data.data);
      setTotal(res.data.total);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load(1, search, year);
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
  const maxPage = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="space-y-4 fade-up">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xl font-black text-brand-green">Collection History</div>
          <div className="text-xs text-gray-500">
            {year} · {total} records
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

      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : rows.length === 0 ? (
        <Card><EmptyState title="No records" message="No collections found for this year." /></Card>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => (
            <Card key={r._id} className="!p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-green">{r.receiptNumber}</span>
                    {isPending(r) ? <Badge status="PENDING">Pending</Badge> : r.isCancelled ? <Badge status="CANCELLED">Cancelled</Badge> : <Badge status="VALID">Paid</Badge>}
                  </div>
                  <div className="font-bold text-gray-900 truncate">{r.devoteeName}</div>
                  <div className="text-[11px] text-gray-400">{formatDateTime(r.issuedAt)} · {PAYMENT_MODE_LABEL[r.paymentMode] || r.paymentMode}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
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
      )}

      {total > LIMIT && (
        <div className="flex items-center justify-between">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
          <span className="text-xs text-gray-500">Page {page} of {maxPage}</span>
          <Button variant="outline" disabled={page >= maxPage} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

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