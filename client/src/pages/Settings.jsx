import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserCircle,
  Bell,
  Palette,
  ShieldCheck,
  Building2,
  Users,
  Save,
  RotateCcw,
  Monitor,
  Lock,
  ChevronRight,
  CheckCircle2,
  Settings as SettingsIcon,
  Globe,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const STORAGE_KEY = "aiInventoryPreferences";

const defaults = {
  theme: "light",
  language: "English",
  emailNotifications: true,
  stockAlerts: true,
  orderAlerts: true,
  demandAlerts: true,
  compactView: false,
};

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-slate-300"}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-6" : "left-1"}`}
      />
    </button>
  );
}

function SettingRow({ title, description, children }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      <div className="sm:shrink-0">{children}</div>
    </div>
  );
}

function SettingsCard({ icon: Icon, title, description, children }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
      <div className="mb-1 flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={19} />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ActionButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex min-h-10 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 sm:w-auto sm:justify-center"
    >
      {children}
      <ChevronRight size={15} />
    </button>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  const [preferences, setPreferences] = useState(defaults);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPreferences({ ...defaults, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error("Unable to load preferences:", error);
    }
  }, []);

  const update = (key, value) => {
    setPreferences((previous) => ({ ...previous, [key]: value }));
    setSaved(false);
  };

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      setSaved(true);
      toast.success("Preferences saved successfully");
    } catch (error) {
      console.error("Unable to save preferences:", error);
      toast.error("Unable to save preferences");
    }
  };

  const reset = () => {
    setPreferences(defaults);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    setSaved(true);
    toast.success("Preferences restored to default");
  };

  const selectClass =
    "min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 sm:w-44";

  return (
    <div className="mx-auto min-h-full max-w-[1500px] space-y-5 pb-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-5 text-white shadow-xl sm:p-7">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-100">
              <SettingsIcon size={13} /> Platform Configuration
            </span>
            <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
              Settings
            </h1>
            <p className="mt-2 max-w-xl text-xs leading-5 text-slate-300 sm:text-sm">
              Manage your account shortcuts, application preferences and
              notification settings.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              onClick={reset}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-white/20 sm:flex-none"
            >
              <RotateCcw size={15} /> Reset
            </button>
            <button
              onClick={save}
              disabled={saved}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-blue-700 transition hover:bg-blue-50 disabled:cursor-default disabled:opacity-60 sm:flex-none"
            >
              {saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
              {saved ? "Saved" : "Save Changes"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Signed-in Account
          </p>
          <p className="mt-2 truncate text-sm font-extrabold text-slate-900">
            {user?.name || "User"}
          </p>
          <p className="mt-1 truncate text-[11px] text-slate-500">
            {user?.email || ""}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Account Role
          </p>
          <p className="mt-2 text-sm font-extrabold capitalize text-blue-700">
            {user?.role || "User"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {isAdmin ? "Administrator access" : "Standard access"}
          </p>
        </div>
        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:col-span-1 sm:p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Preference Status
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${saved ? "bg-emerald-500" : "bg-amber-500"}`}
            />
            <p
              className={`text-sm font-extrabold ${saved ? "text-emerald-600" : "text-amber-600"}`}
            >
              {saved ? "All changes saved" : "Unsaved changes"}
            </p>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Browser preferences</p>
        </div>
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <SettingsCard
          icon={UserCircle}
          title="Account & Profile"
          description="Your personal account information"
        >
          <SettingRow
            title="My Profile"
            description="View your profile and personal information."
          >
            <ActionButton onClick={() => navigate("/profile")}>
              Open Profile
            </ActionButton>
          </SettingRow>
          <SettingRow
            title="Password & Security"
            description="Manage your account password from your profile."
          >
            <ActionButton onClick={() => navigate("/profile")}>
              <Lock size={14} /> Manage Password
            </ActionButton>
          </SettingRow>
        </SettingsCard>

        <SettingsCard
          icon={Palette}
          title="Appearance & Preferences"
          description="Customize your application experience"
        >
          <SettingRow
            title="Theme Preference"
            description="Choose a preferred appearance setting."
          >
            <select
              value={preferences.theme}
              onChange={(e) => update("theme", e.target.value)}
              className={selectClass}
            >
              <option value="light">Light</option>
              <option value="dark">Dark preference</option>
              <option value="system">System default</option>
            </select>
          </SettingRow>
          <SettingRow
            title="Language"
            description="Choose your preferred language preference."
          >
            <select
              value={preferences.language}
              onChange={(e) => update("language", e.target.value)}
              className={selectClass}
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Odia">Odia</option>
            </select>
          </SettingRow>
          <SettingRow
            title="Compact View"
            description="Save a preference for a denser layout."
          >
            <Toggle
              checked={preferences.compactView}
              onChange={(value) => update("compactView", value)}
            />
          </SettingRow>
        </SettingsCard>

        <SettingsCard
          icon={Bell}
          title="Notification Preferences"
          description="Choose notification preferences"
        >
          <SettingRow
            title="Email Notifications"
            description="Preference for email notifications."
          >
            <Toggle
              checked={preferences.emailNotifications}
              onChange={(value) => update("emailNotifications", value)}
            />
          </SettingRow>
          <SettingRow
            title="Stock Alerts"
            description="Preference for low-stock and out-of-stock alerts."
          >
            <Toggle
              checked={preferences.stockAlerts}
              onChange={(value) => update("stockAlerts", value)}
            />
          </SettingRow>
          <SettingRow
            title="Purchase Order Alerts"
            description="Preference for purchase order notifications."
          >
            <Toggle
              checked={preferences.orderAlerts}
              onChange={(value) => update("orderAlerts", value)}
            />
          </SettingRow>
          <SettingRow
            title="Demand Alerts"
            description="Preference for demand and replenishment alerts."
          >
            <Toggle
              checked={preferences.demandAlerts}
              onChange={(value) => update("demandAlerts", value)}
            />
          </SettingRow>
        </SettingsCard>

        <SettingsCard
          icon={ShieldCheck}
          title="Security & Access"
          description="Your account access information"
        >
          <SettingRow
            title="Account Role"
            description="Your current application permission level."
          >
            <span className="inline-flex rounded-lg bg-blue-50 px-3 py-2 text-xs font-extrabold capitalize text-blue-700">
              {user?.role || "User"}
            </span>
          </SettingRow>
          <SettingRow
            title="Protected Access"
            description="Application routes are protected by authentication."
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <ShieldCheck size={16} /> Active
            </span>
          </SettingRow>
        </SettingsCard>

        {isAdmin && (
          <div className="xl:col-span-2">
            <SettingsCard
              icon={Building2}
              title="Administration"
              description="Administrative management shortcuts"
            >
              <SettingRow
                title="Employee Management"
                description="Create, update and manage employee accounts."
              >
                <ActionButton onClick={() => navigate("/employees")}>
                  <Users size={14} /> Manage Employees
                </ActionButton>
              </SettingRow>
              <SettingRow
                title="Organization Settings"
                description="Organization-wide configuration requires backend integration."
              >
                <span className="inline-flex rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                  Not configured
                </span>
              </SettingRow>
            </SettingsCard>
          </div>
        )}
      </div>

      <section className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-white p-2.5 text-blue-600 shadow-sm">
            <Monitor size={19} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">
              Preference storage
            </h3>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
              These preferences are saved in this browser only. Theme, language,
              and notification switches do not yet change the global application
              or server notification behavior.
            </p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saved}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Save size={15} /> Save Preferences
        </button>
      </section>
    </div>
  );
}
