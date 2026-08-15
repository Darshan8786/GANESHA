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
  FileSpreadsheet,
  FileText,
  ChevronDown,
  Scale,
  BarChart3,
  Menu,
} from "lucide-react";
import { api, errorMessage } from "../api/client";
import { AmountGivenItem, AmountGivenReport, DashboardData } from "../api/types";
import { Card, Button, Modal, Spinner } from "../components/ui";
import { YearSelect } from "../components/YearSelect";
import { ReceiptCard, ReceiptSuccessMark } from "../components/ReceiptCard";
import { formatINR, generateIdempotencyKey, downloadBlob } from "../lib/format";
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
  const [isHouse, setIsHouse] = useState(false);
  const [isShop, setIsShop] = useState(false);
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<Mode>("CASH");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ReceiptResult | null>(null);
  const [isLater, setIsLater] = useState(false);
  const [year, setYear] = useState<number>(() => new Date().getFullYear());

  const [given, setGiven] = useState<AmountGivenReport | null>(null);
  const [givenLoading, setGivenLoading] = useState(false);
  const [givenOpen, setGivenOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAddGiven, setShowAddGiven] = useState(false);
  const [givenCategory, setGivenCategory] = useState("");
  const [givenAmount, setGivenAmount] = useState("");
  const [givenAdvance, setGivenAdvance] = useState("");
  const [givenPayMode, setGivenPayMode] = useState<"CASH" | "UPI">("CASH");
  const [givenDate, setGivenDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [givenSaving, setGivenSaving] = useState(false);
  const [givenDeleting, setGivenDeleting] = useState<string | null>(null);
  const [payItem, setPayItem] = useState<AmountGivenItem | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payMode, setPayMode] = useState<"CASH" | "UPI">("CASH");
  const [paySaving, setPaySaving] = useState(false);

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
      const res = await api.get("/reports/amount-given", { params: { year: y } });
      setGiven(res.data);
    } catch {
      setGiven(null);
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
    const adv = givenAdvance === "" ? 0 : Number(givenAdvance);
    if (!givenCategory.trim()) {
      toast.error("Category is required");
      return;
    }
    if (!amt || amt <= 0) {
      toast.error("Enter a valid total amount");
      return;
    }
    if (adv < 0 || (givenAdvance !== "" && Number.isNaN(adv))) {
      toast.error("Enter a valid advance amount");
      return;
    }
    if (adv > amt) {
      toast.error("Advance cannot exceed total amount");
      return;
    }
    setGivenSaving(true);
    try {
      await api.post("/expenses", {
        category: givenCategory.trim(),
        description: givenCategory.trim(),
        amount: amt,
        date: givenDate ? new Date(`${givenDate}T12:00:00`).toISOString() : new Date().toISOString(),
        paymentMode: givenPayMode,
        advance: adv,
      });
      toast.success("Amount given recorded");
      setShowAddGiven(false);
      setGivenCategory("");
      setGivenAmount("");
      setGivenAdvance("");
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

  const deleteGiven = async (item: string) => {
    if (!window.confirm(`Remove "${item}" and all its payments for ${year}?`)) return;
    setGivenDeleting(item);
    try {
      await api.delete("/expenses/by-item", { params: { category: item, year } });
      toast.success("Item removed");
      loadGiven();
      loadStats();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setGivenDeleting(null);
    }
  };

  const exportGivenExcel = async () => {
    try {
      const res = await api.get("/reports/excel/amount-given", { params: { year }, responseType: "blob" });
      downloadBlob(res.data, `SVGB_Amount_Given_${year}.xlsx`);
      toast.success("Excel downloaded");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const exportGivenPdf = async () => {
    try {
      const res = await api.get("/reports/pdf/amount-given", { params: { year }, responseType: "blob" });
      downloadBlob(res.data, `SVGB_Amount_Given_${year}.pdf`);
      toast.success("PDF downloaded");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const openPay = (item: AmountGivenItem) => {
    setPayItem(item);
    setPayAmount(String(item.pending));
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayMode("CASH");
  };

  const submitPay = async () => {
    if (!payItem) return;
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amt > payItem.pending) {
      toast.error("Amount exceeds the pending balance");
      return;
    }
    setPaySaving(true);
    try {
      await api.post("/expenses", {
        category: payItem.item,
        description: payItem.item,
        amount: payItem.total,
        date: payDate ? new Date(`${payDate}T12:00:00`).toISOString() : new Date().toISOString(),
        paymentMode: payMode,
        advance: amt,
      });
      toast.success("Balance paid");
      setPayItem(null);
      loadGiven();
      loadStats();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPaySaving(false);
    }
  };

  const reset = () => {
    setName("");
    setPhone("");
    setIsHouse(false);
    setIsShop(false);
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

    const donorType = isHouse ? "HOUSE" : isShop ? "SHOP" : "INDIVIDUAL";

    setSaving(true);
    try {
      const res = await api.post("/donations", {
        donorType,
        donorName: name.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        houseShop: isHouse ? "House" : isShop ? "Shop" : null,
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
      <div className="relative">
        <img src="/home-banner.jpg" alt="" className="h-36 w-full rounded-2xl object-cover frame-gold" />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <div className="text-xs font-bold text-amber-300 uppercase tracking-widest emboss-light">Ganesh Chaturthi 2026</div>
            <div className="text-xl font-black text-white emboss-light">SVGB Collection Drive</div>
          </div>
          <div className="logo-3d hidden h-9 w-9 items-center justify-center rounded-xl text-xs font-black text-white">S</div>
        </div>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="text-left">
          <div className="text-2xl font-black text-brand-green emboss">SVGB Ganesh Chaturthi <span className="text-brand-gold">{dash?.year || year}</span></div>
          <div className="text-xs text-gray-500">Siddi Vinayaka Geleyara Balaga · Door-to-door collection</div>
        </div>
        <div className="w-28 shrink-0">
          <YearSelect value={year} onChange={setYear} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="!p-3 text-center">
          <Banknote size={18} className="mx-auto text-brand-green" />
          <div className="text-base font-black text-gray-900 mt-0.5 truncate px-1">{formatINR(dash?.cashCollection)}</div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Cash</div>
        </Card>
        <Card className="!p-3 text-center">
          <Smartphone size={18} className="mx-auto text-brand-gold" />
          <div className="text-base font-black text-gray-900 mt-0.5 truncate px-1">{formatINR(dash?.upiCollection)}</div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">UPI</div>
        </Card>
        <Card className="!p-3 text-center">
          <Hourglass size={18} className="mx-auto text-amber-500" />
          <div className="text-base font-black text-amber-600 mt-0.5 truncate px-1">{formatINR(dash?.pendingCollection)}</div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Later</div>
        </Card>
      </div>

      <Card className="p-4">
        <button type="button" className="flex w-full items-center gap-2.5 text-left" onClick={() => setMenuOpen(!menuOpen)}>
          <div className="chip-3d flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10">
            <Menu size={18} className="text-brand-green" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-black text-gray-900">Menu</div>
            <div className="truncate text-[10px] text-gray-500">
              {menuOpen ? "Tally & Last 7 Days" : "tap to view Tally & Last 7 Days"}
            </div>
          </div>
          <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
        </button>

        {menuOpen && (
          <>
            <div className="mt-3 rounded-xl border border-brand-green/15 bg-brand-green/5 p-3">
              <div className="flex items-center gap-2">
                <Scale size={14} className="text-brand-green" />
                <div className="text-xs font-black uppercase tracking-wide text-gray-900">Tally</div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="tile-inset rounded-xl bg-brand-green/10 px-3 py-2 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Received</div>
                  <div className="text-base font-black text-brand-green">
                    {formatINR((dash?.cashCollection || 0) + (dash?.upiCollection || 0) + (dash?.bankCollection || 0))}
                  </div>
                </div>
                <div className="tile-inset rounded-xl bg-red-50 px-3 py-2 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Given Out</div>
                  <div className="text-base font-black text-red-600">{formatINR(dash?.givenOut)}</div>
                </div>
                <div className="tile-inset rounded-xl bg-slate-100 px-3 py-2 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Remaining</div>
                  <div className="text-base font-black text-gray-700">{formatINR(dash?.balance)}</div>
                </div>
              </div>
              <p className="mt-2 text-center text-[10px] text-gray-400">
                Collection Received − Amount Given = Remaining
              </p>
            </div>

            <div className="mt-3 rounded-xl border border-brand-green/15 bg-brand-green/5 p-3">
              <div className="flex items-center gap-2">
                <BarChart3 size={14} className="text-brand-green" />
                <div className="text-xs font-black uppercase tracking-wide text-gray-900">Last 7 Days</div>
                <div className="ml-auto flex items-center gap-3 text-[10px] font-semibold text-gray-500">
                  <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand-green" /> Cash</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand-gold" /> UPI</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-400" /> Bank</span>
                </div>
              </div>
              <div className="mt-3 flex items-end gap-2" style={{ height: 108 }}>
                {dash?.dailyCollection?.length ? (
                  dash.dailyCollection.map((d) => {
                    const maxTotal = Math.max(1, ...dash.dailyCollection.map((x) => x.total));
                    const pct = Math.max(4, Math.round((d.total / maxTotal) * 88));
                    const p = (n: number) => String(n).padStart(2, "0");
                    return (
                      <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
                        <div className="bar-track relative w-full overflow-hidden rounded-lg" style={{ height: pct }}>
                          <div className="bar-seg absolute bottom-0 left-0 right-0 bg-brand-green" style={{ height: `${d.total > 0 ? (d.cash / d.total) * 100 : 0}%` }} />
                          <div className="bar-seg absolute bottom-0 left-0 right-0 bg-brand-gold" style={{ height: `${d.total > 0 ? (d.upi / d.total) * 100 : 0}%` }} />
                          <div className="bar-seg absolute bottom-0 left-0 right-0 bg-slate-400" style={{ height: `${d.total > 0 ? (d.bank / d.total) * 100 : 0}%` }} />
                        </div>
                        <div className="text-[9px] font-bold text-gray-500">
                          {d.date.slice(8, 10)}-{p(Number(d.date.slice(5, 7)))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No data</div>
                )}
              </div>
            </div>
          </>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <button type="button" className="flex min-w-0 flex-1 items-center gap-2.5 text-left" onClick={() => setGivenOpen(!givenOpen)}>
            <TrendingDown size={18} className="shrink-0 text-red-500" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-black text-gray-900">Amount Given</div>
              <div className="truncate text-[10px] text-gray-500">
                {givenOpen
                  ? "money given for decorations etc."
                  : given?.data?.length
                    ? `${given.data.length} item${given.data.length > 1 ? "s" : ""} · Total ${formatINR(given.totals.total)}`
                    : "tap to view / add"}
              </div>
            </div>
            <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${givenOpen ? "rotate-180" : ""}`} />
          </button>
          <div className="shrink-0">
            <Button variant="outline" className="!px-3 !py-2 text-xs" onClick={() => setShowAddGiven(true)}>
              <Plus size={14} /> Add
            </Button>
          </div>
        </div>

        {givenOpen && (
          <>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="tile-inset rounded-xl bg-red-50 px-3 py-2 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Total</div>
                <div className="text-base font-black text-red-600">{formatINR(given?.totals?.total)}</div>
              </div>
              <div className="tile-inset rounded-xl bg-amber-50 px-3 py-2 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Advance</div>
                <div className="text-base font-black text-amber-600">{formatINR(given?.totals?.advance)}</div>
              </div>
              <div className="tile-inset rounded-xl bg-slate-100 px-3 py-2 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Pending</div>
                <div className="text-base font-black text-gray-700">{formatINR(given?.totals?.pending)}</div>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="flex-1 !px-2 !py-2 text-xs" onClick={exportGivenExcel} disabled={!given?.data?.length}>
                <FileSpreadsheet size={14} /> Excel
              </Button>
              <Button variant="outline" className="flex-1 !px-2 !py-2 text-xs" onClick={exportGivenPdf} disabled={!given?.data?.length}>
                <FileText size={14} /> PDF
              </Button>
            </div>

            {givenLoading ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : !given?.data?.length ? (
              <p className="text-center text-xs text-gray-400 py-3">No amounts given for {year}.</p>
            ) : (
              <div className="mt-2 divide-y divide-gray-100">
                {given.data.map((g) => (
                  <div key={g.item} className="py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-gray-900">{g.item}</div>
                        <div className="text-[11px] text-gray-400">{g.count} payment{g.count > 1 ? "s" : ""}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-red-600">{formatINR(g.total)}</span>
                        <button
                          onClick={() => deleteGiven(g.item)}
                          disabled={givenDeleting === g.item}
                          className="p-1.5 text-gray-400 transition hover:text-red-600 disabled:opacity-50"
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] font-semibold">
                      <span className="text-amber-600">Advance {formatINR(g.advance)}</span>
                      <span className="text-gray-500">Pending {formatINR(g.pending)}</span>
                      {g.pending > 0 ? (
                        <Button variant="gold" className="ml-auto !px-2.5 !py-1 !text-[10px]" onClick={() => openPay(g)}>
                          Pay Balance
                        </Button>
                      ) : (
                        <span className="ml-auto text-[10px] font-black text-green-600">PAID ✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
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
              <label className="label">Type</label>
              <div className="flex h-full items-center gap-4">
                <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 py-3.5 text-sm font-bold transition-colors ${isHouse ? "border-brand-green bg-brand-green text-white" : "border-gray-200 bg-white text-gray-700"}`}>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isHouse}
                    onChange={() => {
                      setIsHouse(!isHouse);
                      if (!isHouse) setIsShop(false);
                    }}
                  />
                  {isHouse ? "☑" : "☐"} House
                </label>
                <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 py-3.5 text-sm font-bold transition-colors ${isShop ? "border-brand-green bg-brand-green text-white" : "border-gray-200 bg-white text-gray-700"}`}>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isShop}
                    onChange={() => {
                      setIsShop(!isShop);
                      if (!isShop) setIsHouse(false);
                    }}
                  />
                  {isShop ? "☑" : "☐"} Shop
                </label>
              </div>
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

      <Modal open={!!payItem} onClose={() => setPayItem(null)} title="Pay Balance">
        {payItem && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 border border-gray-200 px-3 py-3 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{payItem.item}</div>
              <div className="text-xl font-black text-red-600 mt-0.5">{formatINR(payItem.pending)}</div>
              <div className="text-[10px] text-gray-400">Balance to pay</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Amount (₹) *</label>
                <input className="input" type="number" min={1} inputMode="numeric" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              </div>
              <div>
                <label className="label">Date</label>
                <input className="input" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Paid by</label>
              <div className="grid grid-cols-2 gap-2">
                {PAY_MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    className={`rounded-xl border-2 py-3 text-base font-bold ${payMode === m.value ? "border-brand-green bg-brand-green text-white" : "border-gray-200 bg-white text-gray-700"}`}
                    onClick={() => setPayMode(m.value)}
                  >
                    <span className="mr-1">{m.icon}</span> {m.label}
                  </button>
                ))}
              </div>
            </div>
            <Button variant="primary" className="w-full" loading={paySaving} onClick={submitPay}>
              <HandCoins size={16} /> Pay {formatINR(Number(payAmount) || 0)}
            </Button>
          </div>
        )}
      </Modal>

      <Modal open={showAddGiven} onClose={() => setShowAddGiven(false)} title="Add Amount Given">
        <div className="space-y-4">
          <div>
            <label className="label">Item *</label>
            <input className="input" value={givenCategory} onChange={(e) => setGivenCategory(e.target.value)} placeholder="e.g. Decoration, Pooja, Tent" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Total Amount (₹) *</label>
              <input className="input" type="number" min={1} inputMode="numeric" value={givenAmount} onChange={(e) => setGivenAmount(e.target.value)} placeholder="500" />
            </div>
            <div>
              <label className="label">Advance given (₹)</label>
              <input className="input" type="number" min={0} inputMode="numeric" value={givenAdvance} onChange={(e) => setGivenAdvance(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={givenDate} onChange={(e) => setGivenDate(e.target.value)} />
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
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-800">
            Pending for this item = Total Amount − Advance given. Enter the full item cost in <b>Total Amount</b>.
          </div>
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