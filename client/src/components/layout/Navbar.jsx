
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Menu,
  Search,
  UserCircle,
  ChevronDown,
  Command,
  Package,
  Settings,
  HelpCircle,
  LogOut,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Logout
  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate("/login", { replace: true });
    toast.success("Logged out successfully");
  };

  const userName = user?.name || "User";
  const userRole = user?.role || "Staff";

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="flex h-[76px] items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Left: Menu + Brand */}
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-blue-600 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu size={23} />
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-200 sm:flex">
              <Package size={21} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold tracking-tight text-slate-900 sm:text-lg">
                Inventory Management
              </h1>

              <div className="mt-0.5 flex items-center gap-2">
                <span className="hidden text-xs text-slate-500 sm:block">
                  AI Demand & Inventory Intelligence
                </span>

                <span className="h-1 w-1 rounded-full bg-emerald-500" />

                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                  System Online
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Search + Actions + Profile */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-5">

          {/* Search */}
          <div className="hidden w-52 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 md:flex lg:w-64">
            <Search size={17} className="shrink-0 text-slate-400" />

            <input
              type="search"
              placeholder="Search anything..."
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />

            <div className="flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] font-medium text-slate-400">
              <Command size={11} />
              K
            </div>
          </div>

          {/* Help */}
          <button
            type="button"
            aria-label="Help"
            title="Help & Support"
            className="hidden rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 sm:block"
          >
            <HelpCircle size={20} />
          </button>

          {/* Settings */}
          <button
            type="button"
            aria-label="Settings"
            title="Settings"
            className="hidden rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 sm:block"
          >
            <Settings size={20} />
          </button>

          {/* Notifications */}
          <button
            type="button"
            aria-label="Notifications"
            title="Notifications"
            className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
          >
            <Bell size={21} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
          </button>

          {/* User Profile - Desktop and Mobile */}
          <div
            className="relative border-l border-slate-200 pl-2 sm:pl-4"
            ref={profileRef}
          >
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              aria-label="Open user profile menu"
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className="flex min-h-11 items-center gap-2 rounded-xl p-1.5 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:gap-3 sm:px-2"
            >
              {/* User Avatar */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-sm font-bold text-blue-700 ring-2 ring-blue-50">
                {initials || <UserCircle size={25} />}
              </div>

              {/* User Name - Desktop */}
              <div className="hidden text-left sm:block">
                <p className="max-w-32 truncate text-sm font-bold text-slate-800">
                  {userName}
                </p>

                <p className="text-[11px] font-medium capitalize text-slate-500">
                  {userRole}
                </p>
              </div>

              <ChevronDown
                size={16}
                className={`hidden text-slate-400 transition-transform sm:block ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-3 w-[min(280px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
              >
                {/* User Information */}
                <div className="border-b border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 font-bold text-blue-700">
                      {initials || <UserCircle size={27} />}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">
                        {userName}
                      </p>

                      <p className="truncate text-xs text-slate-500">
                        {user?.email || "Account"}
                      </p>

                      <span className="mt-1 inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-semibold capitalize text-blue-700">
                        {userRole}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account Menu */}
                <div className="p-2">
                  <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600">
                    <UserRound size={18} />
                    <span>My Account</span>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
