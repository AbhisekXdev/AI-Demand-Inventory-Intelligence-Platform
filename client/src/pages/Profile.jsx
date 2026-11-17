
import { useEffect, useState } from "react";
import {
  UserCircle, Mail, Phone, MapPin, Briefcase, CalendarDays,
  ShieldCheck, Pencil, Save, X, LockKeyhole, Building2,
  IdCard, UserRound, RefreshCw, Eye, EyeOff
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

export default function Profile() {
  const { user, login } = useAuth();

  const isAdmin = user?.role === "admin";

  const [profile, setProfile] = useState(user || {});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get("/auth/me");
        setProfile(response.data.user || response.data);
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Unable to load profile"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    setProfile((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!isAdmin) return;

    try {
      setSaving(true);

      const response = await api.patch("/auth/me", {
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        pincode: profile.pincode,
        emergencyContact: profile.emergencyContact,
      });

      setProfile(response.data.user || {
        ...profile,
        ...(response.data.profile || {}),
      });

      toast.success(response.data.message || "Profile updated successfully");
      setEditing(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      setSaving(true);

      const response = await api.patch("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success(response.data.message || "Password changed successfully");

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowPasswordForm(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to change password"
      );
    } finally {
      setSaving(false);
    }
  };

  const displayValue = (value) => value || "Not provided";

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
        <RefreshCw className="animate-spin text-blue-600" />
        Loading profile...
      </div>
    );
  }

  const fields = [
    { label: "Full Name", name: "name", icon: UserRound },
    { label: "Email Address", name: "email", icon: Mail, readOnly: true },
    { label: "Phone Number", name: "phone", icon: Phone },
    { label: "Emergency Contact", name: "emergencyContact", icon: Phone },
    { label: "Address", name: "address", icon: MapPin },
    { label: "City", name: "city", icon: MapPin },
    { label: "State", name: "state", icon: MapPin },
    { label: "Pincode", name: "pincode", icon: MapPin },
  ];

  const employmentFields = [
    { label: "Employee Code", value: profile.employeeCode },
    { label: "Role", value: profile.role },
    { label: "Designation", value: profile.designation },
    { label: "Department", value: profile.department },
    { label: "Joining Date", value: profile.joiningDate },
  ];

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/70 p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
          Account Management
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          My Profile
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          View your personal information and employment details.
        </p>
      </div>

      {/* Profile Banner */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-blue-800 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-3xl font-bold">
            {profile.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold">
              {profile.name || "User"}
            </h2>
            <p className="mt-1 text-sm text-blue-100">
              {profile.designation || profile.role || "Platform User"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize">
                {profile.role || "Employee"}
              </span>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                {profile.isActive === false ? "Inactive" : "Active Account"}
              </span>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setEditing(!editing)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-50"
            >
              {editing ? <X size={17} /> : <Pencil size={17} />}
              {editing ? "Cancel Edit" : "Edit Profile"}
            </button>
          )}
        </div>
      </div>

      {/* Personal Information */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <UserCircle size={21} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Personal Information</h3>
            <p className="text-xs text-slate-500">Your contact and personal details</p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {fields.map(({ label, name, icon: Icon, readOnly }) => (
              <div key={name}>
                <label className="mb-2 block text-sm font-semibold text-slate-600">
                  {label}
                </label>

                <div className="relative">
                  <Icon
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    name={name}
                    value={profile[name] || ""}
                    onChange={handleChange}
                    readOnly={!editing || readOnly}
                    className={`${inputClass} pl-11 ${
                      !editing || readOnly
                        ? "bg-slate-50 text-slate-500"
                        : ""
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          {editing && isAdmin && (
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={17} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>

        {!isAdmin && (
          <p className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
            Your profile is read-only. Contact your administrator to update
            your personal or employment details.
          </p>
        )}
      </div>

      {/* Employment Details */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
            <Briefcase size={21} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Employment Details</h3>
            <p className="text-xs text-slate-500">Your organization information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employmentFields.map((item) => (
            <div key={item.label} className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-400">
                {item.label}
              </p>
              <p className="mt-2 font-semibold capitalize text-slate-800">
                {displayValue(item.value)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Password Security */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <ShieldCheck size={21} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Account Security</h3>
              <p className="text-xs text-slate-500">
                Keep your account protected.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {showPasswordForm ? "Close" : "Change Password"}
          </button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="mt-6 space-y-4 border-t border-slate-100 pt-5">
            {[
              { label: "Current Password", name: "currentPassword" },
              { label: "New Password", name: "newPassword" },
              { label: "Confirm New Password", name: "confirmPassword" },
            ].map((item) => (
              <div key={item.name}>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {item.label} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <LockKeyhole size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    minLength={item.name === "currentPassword" ? undefined : 8}
                    type={showPassword ? "text" : "password"}
                    value={passwordForm[item.name]}
                    onChange={(event) =>
                      setPasswordForm((previous) => ({
                        ...previous,
                        [item.name]: event.target.value,
                      }))
                    }
                    className={`${inputClass} pl-11 pr-12`}
                    placeholder={`Enter ${item.label.toLowerCase()}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
