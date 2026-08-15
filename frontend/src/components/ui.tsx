import { ReactNode, ButtonHTMLAttributes, useEffect } from "react";
import { Loader2, Inbox, X } from "lucide-react";

export function Spinner({ className = "" }: { className?: string }) {
  return <Loader2 className={`animate-spin text-brand-green ${className}`} size={28} />;
}

export function Button({
  variant = "primary",
  loading = false,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "gold" | "outline" | "danger" | "ghost";
  loading?: boolean;
}) {
  const cls = {
    primary: "btn-primary",
    gold: "btn-gold",
    outline: "btn-outline",
    danger: "btn-danger",
    ghost: "btn text-brand-green hover:bg-brand-green/10",
  }[variant];
  return (
    <button className={`${cls} ${className}`} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function StatCard({
  label,
  value,
  icon,
  accent = "green",
  sub,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: "green" | "gold" | "blue" | "red" | "gray";
  sub?: string;
}) {
  const accents: Record<string, string> = {
    green: "bg-brand-green/10 text-brand-green",
    gold: "bg-brand-gold/10 text-brand-gold",
    blue: "bg-blue-100 text-blue-600",
    red: "bg-red-100 text-red-600",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <Card className="flex items-center gap-4">
      <div className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center ${accents[accent]}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
        <div className="text-2xl font-bold text-gray-900 truncate">{value}</div>
        {sub ? <div className="text-xs text-gray-500">{sub}</div> : null}
      </div>
    </Card>
  );
}

export function ProgressBar({ percent, className = "" }: { percent: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div className={`h-2.5 w-full rounded-full bg-gray-200 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full bg-brand-green transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Badge({ status, children }: { status?: string; children?: ReactNode }) {
  const color = status ? statusColor2(status) : "bg-gray-100 text-gray-600";
  return <span className={`badge ${color}`}>{children}</span>;
}

function statusColor2(s: string): string {
  switch (s) {
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
      return "bg-gray-200 text-gray-600";
    case "REFUSED":
    case "REJECTED":
    case "CANCELLED":
    case "INACTIVE":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div
        className={`w-full ${wide ? "max-w-3xl" : "max-w-md"} max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-lift fade-up`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ title, message, icon }: { title: string; message?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon || <Inbox className="text-gray-300 mb-3" size={40} />}
      <div className="text-sm font-semibold text-gray-600">{title}</div>
      {message ? <div className="text-xs text-gray-400 mt-1 max-w-xs">{message}</div> : null}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-bold text-gray-900 mb-4">{children}</h2>;
}