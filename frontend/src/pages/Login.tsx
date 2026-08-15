import { FormEvent, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, LogIn } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { errorMessage } from "../api/client";
import { Spinner } from "../components/ui";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!email.trim() || !password) {
      setErr("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from || "/app");
    } catch (err) {
      setErr(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-gradient-to-b from-brand-green to-brand-greenlight relative overflow-hidden safe-top">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #f59e0b 0, transparent 30%), radial-gradient(circle at 80% 70%, #f59e0b 0, transparent 30%)" }} />
      <div className="w-full max-w-md relative fade-up">
        <div className="text-center mb-6">
          <img src="/ganesha-banner.jpg" alt="Ganesh" className="float h-28 w-28 mx-auto rounded-2xl object-cover frame-gold" />
          <h1 className="mt-5 text-2xl font-bold text-white emboss-light">SVGB · Siddi Vinayaka Geleyara Balaga</h1>
          <p className="text-amber-200 text-sm mt-1 font-medium">Ganesh Chaturthi 2026 · Collection Management</p>
        </div>

        <form className="card card-strong p-6 sm:p-8" onSubmit={onSubmit}>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Administrator sign in</h2>
          <p className="text-xs text-gray-500 mb-6">This application is restricted to the SVGB administrator.</p>

          {err && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3">{err}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-10"
                  type="email"
                  placeholder="admin@svgb.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-10 pr-11"
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button className="btn-gold w-full !py-3" type="submit" disabled={loading}>
              {loading ? <Spinner /> : <LogIn size={18} />} {loading ? "Signing in…" : "Sign In"}
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="text-center text-xs text-gray-500 mb-2">Login as a visitor instead?</div>
            <Link to="/" className="block text-center text-sm font-semibold text-brand-green hover:underline">
              Visit public website →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}