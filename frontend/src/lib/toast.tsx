import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

type ToastFn = (type: ToastType, message: string) => void;

const ToastContext = createContext<ToastFn | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push: ToastFn = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ type: ToastType; message: string }>).detail;
      push(detail.type, detail.message);
    };
    window.addEventListener("kgb-toast", handler);
    return () => window.removeEventListener("kgb-toast", handler);
  }, [push]);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-100 space-y-2 w-92 max-w-md">
        {items.map((t) => (
          <div
            key={t.id}
            className={
              "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lift fade-up " +
              (t.type === "success" ? "bg-brand-green" : t.type === "error" ? "bg-red-600" : "bg-gray-800")
            }
          >
            {t.type === "success" ? <CheckCircle2 size={18} /> : t.type === "error" ? <XCircle size={18} /> : <Info size={18} />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return {
    success: (m: string) => ctx("success", m),
    error: (m: string) => ctx("error", m),
    info: (m: string) => ctx("info", m),
  };
}

const dispatch = (type: ToastType, message: string) =>
  window.dispatchEvent(new CustomEvent<{ type: ToastType; message: string }>("kgb-toast", { detail: { type, message } }));

export const toast = {
  success: (m: string) => dispatch("success", m),
  error: (m: string) => dispatch("error", m),
  info: (m: string) => dispatch("info", m),
};