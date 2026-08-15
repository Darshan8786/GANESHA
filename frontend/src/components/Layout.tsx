import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { HandCoins, History as HistoryIcon, LogOut } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center justify-center gap-0.5 py-3 text-[11px] font-bold ${
    isActive ? "text-brand-green" : "text-gray-400"
  }`;

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-sand pb-24">
      <header className="sticky top-0 z-40 bg-brand-green text-white shadow-md">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gold text-sm font-black text-brand-green">
              S
            </div>
            <div>
              <div className="text-sm font-black leading-tight">SVGB</div>
              <div className="text-[10px] text-green-200">Ganesh Chaturthi 2026</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-green-100">{user?.name?.split(" ")[0]}</span>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="rounded-lg p-2 text-green-100 transition hover:bg-brand-greenlight"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white shadow-t">
        <div className="mx-auto grid max-w-md grid-cols-2">
          <NavLink to="/app" end className={navClass}>
            <HandCoins size={20} />
            Collection
          </NavLink>
          <NavLink to="/app/history" className={navClass}>
            <HistoryIcon size={20} />
            History
          </NavLink>
        </div>
      </nav>
    </div>
  );
}