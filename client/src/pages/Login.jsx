import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  Boxes, Eye, EyeOff, Mail, LockKeyhole, ShieldCheck,
  RefreshCw, CheckCircle2, BarChart3, Package, Zap,
  ArrowRight, TrendingUp, Sparkles
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const generateCaptcha = () => {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { question: `${a} + ${b}`, answer: String(a + b) };
};

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState("");
  const [verified, setVerified] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
    setVerified(false);
  };

  const verifyCaptcha = () => {
    if (captchaInput.trim() !== captcha.answer) {
      toast.error("Incorrect verification answer");
      refreshCaptcha();
      return;
    }
    setVerified(true);
    toast.success("Verification successful");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!verified) {
      toast.error("Complete security verification first");
      return;
    }

    try {
      setLoading(true);
      await login({
        email: form.email.trim(),
        password: form.password,
      });

      toast.success("Login successful");
      navigate(location.state?.from?.pathname || "/", {
        replace: true,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to login");
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8fc] lg:grid lg:grid-cols-2">

      {/* LEFT: AI EXPERIENCE */}
      <section className="relative isolate min-h-[310px] overflow-hidden bg-[#21105d] text-white sm:min-h-[390px] lg:sticky lg:top-0 lg:h-screen lg:min-h-screen">

        {/* Animated background */}
        <div className="login-orb login-orb-one" />
        <div className="login-orb login-orb-two" />
        <div className="login-grid absolute inset-0 opacity-20" />

        {/* Brand */}
        <div className="relative z-20 flex items-center gap-3 px-6 pt-7 sm:px-10 lg:px-12 lg:pt-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-lg">
            <Boxes size={25} />
          </div>
          <div>
            <h2 className="font-bold tracking-wide">Inventory Intelligence</h2>
            <p className="text-[11px] text-indigo-200">AI BUSINESS PLATFORM</p>
          </div>
        </div>

        {/* Intro */}
        <div className="relative z-20 px-6 pt-8 sm:px-10 sm:pt-10 lg:px-12 lg:pt-16">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[2px] text-cyan-200 sm:text-xs">
            <Sparkles size={13} />
            Intelligent Operations
          </div>

          <h1 className="max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl xl:text-5xl">
            Smarter Demand.
            <br />
            <span className="login-gradient-text">
              Smarter Inventory.
            </span>
          </h1>

          <p className="mt-3 max-w-md text-xs leading-6 text-indigo-100 sm:text-sm sm:leading-7">
            Transform your business with AI-powered forecasting,
            real-time inventory visibility and intelligent decisions.
          </p>

          {/* Features: desktop and tablet */}
          <div className="mt-6 hidden space-y-3 sm:flex sm:flex-wrap lg:flex-col lg:space-y-4">
            {[
              { icon: BarChart3, text: "AI Demand Forecasting" },
              { icon: Package, text: "Real-time Inventory Control" },
              { icon: Zap, text: "Intelligent Business Operations" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-indigo-50">
                <div className="rounded-lg border border-white/15 bg-white/10 p-2">
                  <Icon size={17} />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Robot artwork */}
        <div className="pointer-events-none relative z-10 mx-auto mt-2 h-[190px] w-full max-w-[620px] sm:absolute sm:bottom-0 sm:right-0 sm:mt-0 sm:h-[48%] sm:max-h-[440px] sm:w-[85%] lg:h-[43%] lg:w-full lg:max-w-none">
 <img
  src="/images/login-robot.png"
  alt="AI inventory assistant robot"
  className="login-robot h-full w-full object-contain object-bottom"
  onError={(e) => console.error("Robot image failed:", e.currentTarget.src)}
/>
  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#21105d] to-transparent" />
</div>

        {/* Floating analytics card */}
        <div className="absolute bottom-[15%] right-[7%] z-20 hidden animate-float rounded-xl border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-xl sm:block lg:bottom-[13%] lg:right-[8%]">
          <div className="flex items-center gap-2 text-xs text-indigo-100">
            <TrendingUp size={15} className="text-emerald-300" />
            Demand analytics
          </div>
          <div className="mt-2 flex items-end gap-1.5">
            {[25, 38, 30, 55, 45, 70, 88].map((height, i) => (
              <div
                key={i}
                className="w-3 rounded-t-sm bg-gradient-to-t from-cyan-400 to-blue-200"
                style={{ height: `${height}px` }}
              />
            ))}
          </div>
          <p className="mt-2 text-[10px] text-indigo-200">Live intelligence</p>
        </div>

        <div className="absolute bottom-5 left-6 z-20 hidden text-[10px] text-indigo-200 sm:block lg:left-12">
          © {new Date().getFullYear()} AI Demand & Inventory Intelligence
        </div>
      </section>

      {/* RIGHT: LOGIN */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-indigo-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl" />

        <div className="relative z-10 w-full max-w-[430px] animate-login">

          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <Boxes size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Inventory<span className="text-indigo-600">AI</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Demand & Inventory Intelligence
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <div className="mb-4 hidden h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 lg:flex">
              <LockKeyhole size={23} />
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-[34px]">
              Welcome back
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in to access your organization's workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Work email
              </label>
              <div className="login-input">
                <Mail size={18} className="shrink-0 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@company.com"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="login-input">
                <LockKeyhole size={18} className="shrink-0 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {/* CAPTCHA */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck size={18} className="text-indigo-600" />
                <span className="text-sm font-bold text-slate-800">
                  Security verification
                </span>
                {verified && (
                  <CheckCircle2 size={17} className="ml-auto text-emerald-600" />
                )}
              </div>

              <p className="mb-3 text-xs text-slate-500">
                Solve the calculation to continue.
              </p>

              <div className="flex min-w-0 gap-2">
                <div className="flex h-12 min-w-0 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-bold text-slate-800">
                  {captcha.question} = ?
                </div>
                <input
                  type="number"
                  value={captchaInput}
                  onChange={(e) => {
                    setCaptchaInput(e.target.value);
                    setVerified(false);
                  }}
                  placeholder="Answer"
                  aria-label="CAPTCHA answer"
                  className="h-12 w-24 rounded-lg border border-slate-300 bg-white px-2 text-center text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  aria-label="Refresh CAPTCHA"
                  className="flex h-12 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
                >
                  <RefreshCw size={17} />
                </button>
              </div>

              <button
                type="button"
                onClick={verifyCaptcha}
                disabled={verified || !captchaInput.trim()}
                className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
              >
                {verified ? "Verification completed" : "Verify"}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !verified}
              className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in to workspace
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Access notice */}
          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="flex items-start gap-3">
              <LockKeyhole size={18} className="mt-0.5 shrink-0 text-slate-400" />
              <div>
                <p className="text-xs font-bold text-slate-700">
                  Authorized personnel only
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Restricted to company administrators and employees.
                  Contact your system administrator for access.
                </p>
                <a
                  href="mailto:codepilot.devteam@gmail.com"
                  className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Contact administrator
                </a>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-[11px] text-slate-400">
            © {new Date().getFullYear()} AI Demand & Inventory Intelligence Platform
          </p>
        </div>
      </section>

      {/* Animations */}
      <style>{`
        .login-orb {
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 9999px;
          filter: blur(80px);
          pointer-events: none;
          animation: orbMove 10s ease-in-out infinite alternate;
        }

        .login-orb-one {
          top: 12%;
          left: -100px;
          background: rgba(139, 92, 246, .38);
        }

        .login-orb-two {
          right: -100px;
          bottom: 5%;
          background: rgba(34, 211, 238, .22);
          animation-delay: -4s;
        }

        .login-grid {
          background-image:
            linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: linear-gradient(to bottom, black, transparent);
        }

        .login-gradient-text {
          background: linear-gradient(90deg, #a5f3fc, #c4b5fd, #ffffff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .login-robot {
          animation: robotFloat 5s ease-in-out infinite;
          filter: drop-shadow(0 20px 35px rgba(0,0,0,.25));
        }

        .animate-float {
          animation: cardFloat 5s ease-in-out infinite;
        }

        .animate-login {
          animation: loginEnter .7s ease-out both;
        }

        .login-input {
          display: flex;
          height: 50px;
          align-items: center;
          gap: 12px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          background: white;
          padding: 0 13px;
          transition: border-color .2s, box-shadow .2s;
        }

        .login-input:focus-within {
          border-color: #4f46e5;
          box-shadow: 0 0 0 4px rgba(79,70,229,.10);
        }

        .login-input input {
          width: 100%;
          min-width: 0;
          height: 100%;
          border: 0;
          outline: none;
          background: transparent;
          color: #1e293b;
          font-size: 14px;
        }

        .login-input input::placeholder {
          color: #94a3b8;
        }

        @keyframes robotFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        @keyframes cardFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-9px); }
        }

        @keyframes orbMove {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(45px, -30px) scale(1.2); }
        }

        @keyframes loginEnter {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .login-robot, .animate-float, .animate-login, .login-orb {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}

