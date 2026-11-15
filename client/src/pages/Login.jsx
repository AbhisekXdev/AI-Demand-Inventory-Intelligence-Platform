import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  Boxes,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password) {
      toast.error("Please enter your email and password");
      return;
    }

    try {
      setLoading(true);

      await login({
        email: form.email.trim(),
        password: form.password,
      });

      toast.success("Login successful");

      const destination = location.state?.from?.pathname || "/";
      navigate(destination, { replace: true });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to login"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <Boxes size={32} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Welcome Back
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to your Demand & Inventory Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email Address
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <Mail size={18} className="text-slate-400" />

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                autoComplete="email"
                className="w-full py-3 text-sm outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <LockKeyhole size={18} className="text-slate-400" />

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full py-3 text-sm outline-none"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="text-slate-400 hover:text-slate-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <RefreshCw size={17} className="animate-spin" />}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Create Account
          </Link>
        </p>

        <p className="mt-8 text-center text-xs text-slate-400">
          AI Demand & Inventory Intelligence Platform
        </p>
      </div>
    </div>
  );
}