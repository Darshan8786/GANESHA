import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { HandCoins, History as HistoryIcon, LogOut } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center justify-center gap-0.5 pb-3 text-[11px] font-bold transition-colors ${
    isActive ? "text-brand-green" : "text-gray-400"
  }`;

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-brand-sand pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <header className="sticky top-0 z-40 header-3d text-white safe-top">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="logo-3d flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black text-white">
              S
            </div>
            <div>
              <div className="text-sm font-black leading-tight emboss-light">SVGB</div>
              <div className="text-[10px] font-semibold text-amber-300">Ganesh Chaturthi 2026</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-green-100 emboss-light">{user?.name?.split(" ")[0]}</span>
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

      <nav className="fixed bottom-0 left-0 right-0 z-40 nav-bar safe-bottom">
        <div className="mx-auto flex max-w-md items-stretch px-2">
          <NavLink to="/app" end>
            {({ isActive }) => (
              <span className={navClass({ isActive })}>
                <span className={`mb-0.5 flex h-9 w-14 items-center justify-center rounded-xl transition-all ${isActive ? "nav-3d-active translate-y-[-2px]" : ""}`}>
                  <HandCoins size={20} />
                </span>
                Collection
              </span>
            )}
          </NavLink>
          <NavLink to="/app/history">
            {({ isActive }) => (
              <span className={navClass({ isActive })}>
                <span className={`mb-0.5 flex h-9 w-14 items-center justify-center rounded-xl transition-all ${isActive ? "nav-3d-active translate-y-[-2px]" : ""}`}>
                  <HistoryIcon size={20} />
                </span>
                History
              </span>
            )}
          </NavLink>
        </div>
      </nav>
    </div>
  );
}