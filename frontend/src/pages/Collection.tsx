import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HandCoins,
  History as HistoryIcon,
  Download,
  Banknote,
  Smartphone,
  Hourglass,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { api, errorMessage } from "../api/client";
import { DashboardData, Expense } from "../api/types";
import { Card, Button, Modal, Spinner, Badge } from "../components/ui";
import { YearSelect } from "../components/YearSelect";
import { ReceiptCard, ReceiptSuccessMark } from "../components/ReceiptCard";
import { formatINR, formatDate, PAYMENT_MODE_LABEL, generateIdempotencyKey, downloadBlob } from "../lib/format";
import { toast } from "../lib/toast";

type Mode = "CASH" | "UPI" | "LATER";

interface ReceiptResult {
  receiptNumber: string;
  devoteeName: string;
  phone?: string;
  address?: string;
  donorType?: string;
  collectorName?: string;
  paymentMode: Mode;
  amount: number;
  qrDataUrl?: string;
  issuedAt: string;
  _id?: string;
}

const MODES: { value: Mode; label: string; icon: string }[] = [
  { value: "CASH", label: "Cash", icon: "💵" },
  { value: "UPI", label: "UPI", icon: "📱" },
  { value: "LATER", label: "Later", icon: "⏳" },
];

const PAY_MODES: { value: "CASH" | "UPI"; label: string; icon: string }[] = [
  { value: "CASH", label: "Cash", icon: "💵" },
  { value: "UPI", label: "UPI", icon: "📱" },
];

export default function Collection() {
  const navigate = useNavigate();
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [houseShop, setHouseShop] = useState("");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<Mode>("CASH");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ReceiptResult | null>(null);
  const [isLater, setIsLater] = useState(false);
  const [year, setYear] = useState<number>(() => new Date().getFullYear());

  const [given, setGiven] = useState<Expense[]>([]);
  const [givenTotal, setGivenTotal] = useState(0);
  const [givenAdvanceTotal, setGivenAdvanceTotal] = useState(0);
  const [givenLoading, setGivenLoading] = useState(false);
  const [showAddGiven, setShowAddGiven] = useState(false);
  const [givenCategory, setGivenCategory] = useState("");
  const [givenDesc, setGivenDesc] = useState("");
  const [givenAmount, setGivenAmount] = useState("");
  const [givenAdvance, setGivenAdvance] = useState(false);
  const [givenPayMode, setGivenPayMode] = useState<"CASH" | "UPI">("CASH");
  const [givenDate, setGivenDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [givenSaving, setGivenSaving] = useState(false);
  const [givenDeleting, setGivenDeleting] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setDash((await api.get("/dashboard", { params: { year } })).data);
    } catch {
      setDash(null);
    }
  };

  const loadGiven = async (y = year) => {
    setGivenLoading(true);
    try {
      const res = await api.get("/expenses", { params: { year: y, limit: 8 } });
      setGiven(res.data.data);
      setGivenTotal(res.data.totals?.totalAmount || 0);
      setGivenAdvanceTotal(res.data.totals?.advanceAmount || 0);
    } catch {
      setGiven([]);
      setGivenTotal(0);
      setGivenAdvanceTotal(0);
    } finally {
      setGivenLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadGiven();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const submitGiven = async () => {
    const amt = Number(givenAmount);
    if (!givenCategory.trim()) {
      toast.error("Category is required");
      return;
    }
    if (!givenDesc.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setGivenSaving(true);
    try {
      await api.post("/expenses", {
        category: givenCategory.trim(),
        description: givenDesc.trim(),
        amount: amt,
        date: givenDate ? new Date(`${givenDate}T12:00:00`).toISOString() : new Date().toISOString(),
        paymentMode: givenPayMode,
        advance: givenAdvance,
      });
      toast.success("Amount given recorded");
      setShowAddGiven(false);
      setGivenCategory("");
      setGivenDesc("");
      setGivenAmount("");
      setGivenAdvance(false);
      setGivenPayMode("CASH");
      setGivenDate(new Date().toISOString().slice(0, 10));
      loadGiven();
      loadStats();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setGivenSaving(false);
    }
  };

  const deleteGiven = async (id: string) => {
    setGivenDeleting(id);
    try {
      await api.patch(`/expenses/${id}/delete`);
      toast.success("Removed");
      loadGiven();
      loadStats();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setGivenDeleting(null);
    }
  };

  const reset = () => {
    setName("");
    setPhone("");
    setHouseShop("");
    setAddress("");
    setAmount("");
    setMode("CASH");
    setNotes("");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    const t = houseShop.trim().toLowerCase();
    const donorType = t.startsWith("shop") ? "SHOP" : t.startsWith("house") ? "HOUSE" : "INDIVIDUAL";

    setSaving(true);
    try {
      const res = await api.post("/donations", {
        donorType,
        donorName: name.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        houseShop: houseShop.trim() || null,
        amount: amt,
        paymentMode: mode,
        notes: notes.trim() || null,
        idempotencyKey: generateIdempotencyKey(),
        collectedAt: new Date().toISOString(),
      });
      const r = res.data.receipt as ReceiptResult;
      setResult(r);
      setIsLater(mode === "LATER");
      toast.success(mode === "LATER" ? "Saved as Pending" : "Receipt generated");
      reset();
      loadStats();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const exportExcel = async () => {
    try {
      const res = await api.get("/reports/excel/collection-log", { responseType: "blob" });
      downloadBlob(res.data, "SVGB_Collection_2026.xlsx");
      toast.success("Excel downloaded");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="space-y-4 fade-up">
      <div className="flex items-start justify-between gap-3">
        <div className="text-left">
          <div className="text-2xl font-black text-brand-green">SVGB Ganesh Chaturthi <span className="text-brand-gold">{dash?.year || year}</span></div>
          <div className="text-xs text-gray-500">Siddi Vinayaka Geleyara Balaga · Door-to-door collection</div>
        </div>
        <div className="w-28 shrink-0">
          <YearSelect value={year} onChange={setYear} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="!p-3 text-center">
          <Banknote size={18} className="mx-auto text-brand-green" />
          <div className="text-lg font-black text-gray-900 mt-0.5">{formatINR(dash?.cashCollection)}</div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Cash</div>
        </Card>
        <Card className="!p-3 text-center">
          <Smartphone size={18} className="mx-auto text-brand-gold" />
          <div className="text-lg font-black text-gray-900 mt-0.5">{formatINR(dash?.upiCollection)}</div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">UPI</div>
        </Card>
        <Card className="!p-3 text-center">
          <Hourglass size={18} className="mx-auto text-amber-500" />
          <div className="text-lg font-black text-amber-600 mt-0.5">{formatINR(dash?.pendingCollection)}</div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Later</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <TrendingDown size={18} className="text-red-500" />
            <div>
              <div className="text-sm font-black text-gray-900">Amount Given</div>
              <div className="text-[10px] text-gray-500">money given for decorations etc.</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <div className="text-lg font-black text-red-600">{formatINR(givenTotal)}</div>
              {givenAdvanceTotal > 0 && (
                <div className="text-[10px] font-semibold text-amber-600">Advance {formatINR(givenAdvanceTotal)}</div>
              )}
            </div>
            <Button variant="outline" className="!px-3 !py-2 text-xs" onClick={() => setShowAddGiven(true)}>
              <Plus size={14} /> Add
            </Button>
          </div>
        </div>

        {givenLoading ? (
          <div className="flex justify-center py-4"><Spinner /></div>
        ) : given.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-3">No amounts given for {year}.</p>
        ) : (
          <div className="mt-2 divide-y divide-gray-100">
            {given.map((g) => (
              <div key={g._id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="truncate text-sm font-semibold text-gray-900">{g.description}</div>
                    {g.advance && <Badge status="PENDING">Advance</Badge>}
                  </div>
                  <div className="text-[11px] text-gray-400">{g.category} · {PAYMENT_MODE_LABEL[g.paymentMode] || g.paymentMode} · {formatDate(g.date)}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold text-red-600">{formatINR(g.amount)}</span>
                  <button
                    onClick={() => deleteGiven(g._id)}
                    disabled={givenDeleting === g._id}
                    className="p-1.5 text-gray-400 transition hover:text-red-600 disabled:opacity-50"
                    title="Remove"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input className="input !py-3.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="Donor name" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Phone</label>
              <input className="input !py-3.5" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="label">House / Shop</label>
              <input className="input !py-3.5" value={houseShop} onChange={(e) => setHouseShop(e.target.value)} placeholder="e.g. House, Shop" />
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label className="label">Amount (₹) *</label>
            <input className="input !py-4 text-3xl font-black text-center" type="number" min={1} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500" />
          </div>
          <div>
            <label className="label">Payment</label>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  className={`rounded-2xl border-2 py-3.5 text-base font-bold transition-colors ${mode === m.value ? "border-brand-green bg-brand-green text-white" : "border-gray-200 bg-white text-gray-700"}`}
                  onClick={() => setMode(m.value)}
                >
                  <span className="mr-1">{m.icon}</span> {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </div>
          <Button type="submit" variant="gold" className="w-full !py-4 text-lg" loading={saving}>
            <HandCoins size={22} />
            {mode === "LATER" ? "Save as LATER (Pending)" : "GENERATE RECEIPT"}
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="!py-3.5" onClick={() => navigate("/app/history")}>
          <HistoryIcon size={18} /> History
        </Button>
        <Button variant="outline" className="!py-3.5" onClick={exportExcel}>
          <Download size={18} /> EXPORT EXCEL
        </Button>
      </div>

      <Modal open={showAddGiven} onClose={() => setShowAddGiven(false)} title="Add Amount Given">
        <div className="space-y-4">
          <div>
            <label className="label">Category *</label>
            <input className="input" value={givenCategory} onChange={(e) => setGivenCategory(e.target.value)} placeholder="e.g. Decoration, Pooja, Tent" />
          </div>
          <div>
            <label className="label">Description *</label>
            <input className="input" value={givenDesc} onChange={(e) => setGivenDesc(e.target.value)} placeholder="e.g. Decoration items, Pooja flowers" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₹) *</label>
              <input className="input" type="number" min={1} inputMode="numeric" value={givenAmount} onChange={(e) => setGivenAmount(e.target.value)} placeholder="500" />
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={givenDate} onChange={(e) => setGivenDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Paid by</label>
            <div className="grid grid-cols-2 gap-2">
              {PAY_MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  className={`rounded-xl border-2 py-3 text-base font-bold ${givenPayMode === m.value ? "border-brand-green bg-brand-green text-white" : "border-gray-200 bg-white text-gray-700"}`}
                  onClick={() => setGivenPayMode(m.value)}
                >
                  <span className="mr-1">{m.icon}</span> {m.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setGivenAdvance(!givenAdvance)}
            className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-sm font-bold ${givenAdvance ? "border-amber-400 bg-amber-50 text-amber-700" : "border-gray-200 bg-white text-gray-600"}`}
          >
            <span>Advance / token money given</span>
            <span className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black ${givenAdvance ? "bg-amber-400 text-white" : "bg-gray-200 text-gray-500"}`}>
              {givenAdvance ? "✓" : ""}
            </span>
          </button>
          <Button variant="primary" className="w-full" loading={givenSaving} onClick={submitGiven}>
            <Plus size={16} /> Save
          </Button>
        </div>
      </Modal>

      <Modal open={!!result} onClose={() => setResult(null)} title={isLater ? "Saved as Pending" : "Receipt Generated"}>
        {result && (
          <div className="space-y-4">
            <ReceiptSuccessMark />
            {isLater ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 text-center">
                  <Clock size={16} className="inline mr-1" />
                  <b>{result.devoteeName}</b> — ₹{result.amount.toLocaleString("en-IN")} marked as <b>LATER (Pending)</b>.
                  <div className="text-xs mt-1">Receipt <b className="font-mono">{result.receiptNumber}</b> reserved. Mark it as paid in History when they pay.</div>
                </div>
                <Button variant="primary" className="w-full" onClick={() => setResult(null)}>
                  <CheckCircle2 size={16} /> Done
                </Button>
              </div>
            ) : (
              <>
                <ReceiptCard
                  receipt={{
                    _id: result._id || "",
                    receiptNumber: result.receiptNumber,
                    devoteeName: result.devoteeName,
                    phone: result.phone,
                    address: result.address,
                    donorType: (result.donorType as "HOUSE" | "SHOP" | "INDIVIDUAL") || "INDIVIDUAL",
                    collectorName: result.collectorName,
                    paymentMode: result.paymentMode,
                    amount: result.amount,
                    qrDataUrl: result.qrDataUrl,
                    isCancelled: false,
                    issuedAt: result.issuedAt,
                  }}
                />
                <Button variant="primary" className="w-full" onClick={() => setResult(null)}>
                  <CheckCircle2 size={16} /> Done
                </Button>
              </>
            )}
          </div>
        )}
      </Modal>

      {!dash && <div className="flex justify-center"><Spinner /></div>}
    </div>
  );
}