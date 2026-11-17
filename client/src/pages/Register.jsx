
import { Link, Navigate } from "react-router-dom";
import {
  Boxes,
  ShieldCheck,
  Mail,
  LockKeyhole,
  Building2,
  UserX,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ADMIN_EMAIL = "codepilot.devteam@gmail.com";

export default function Register() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 animate-pulse rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 animate-pulse rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg animate-[fadeIn_0.7s_ease-out]">

        <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-7 text-center shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-10">

          {/* Logo */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-xl shadow-blue-500/30">
            <Boxes size={40} />
          </div>

          <h1 className="mt-6 text-3xl font-bold text-white">
            Internal Access Only
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            AI Demand & Inventory Intelligence Platform
          </p>

          {/* Restricted Access */}
          <div className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/10 text-amber-400">
              <UserX size={28} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-amber-300">
              Public Registration Not Allowed
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              This application is developed exclusively for internal
              business use. Registration and access are restricted to
              authorized company personnel.
            </p>

            <p className="mt-3 text-sm font-medium text-slate-200">
              Outsiders are not permitted to create an account.
            </p>
          </div>

          {/* Admin Contact */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h3 className="font-semibold text-white">
                  Need Access?
                </h3>
                <p className="text-xs text-slate-400">
                  Contact your System Administrator
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                Admin Contact Email
              </p>

              <a
                href={`mailto:${ADMIN_EMAIL}`}
                className="flex items-center gap-2 break-all text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
              >
                <Mail size={17} className="shrink-0" />
                {ADMIN_EMAIL}
              </a>
            </div>
          </div>

          {/* Internal Use Notice */}
          <div className="mt-6 flex items-start gap-3 rounded-xl bg-blue-500/10 p-4 text-left">
            <Building2 size={19} className="mt-0.5 shrink-0 text-blue-400" />
            <p className="text-xs leading-5 text-slate-400">
              This system is intended for authorized employees,
              managers and administrators of the organization only.
            </p>
          </div>

          {/* Login Link */}
          <Link
            to="/login"
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            <ArrowLeft size={18} />
            Back to Secure Login
          </Link>

          <p className="mt-7 text-xs text-slate-500">
            © {new Date().getFullYear()} AI Demand & Inventory Intelligence Platform
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
