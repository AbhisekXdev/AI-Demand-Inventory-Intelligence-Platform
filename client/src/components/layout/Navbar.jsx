import { useCallback, useEffect, useMemo, useState } from "react";
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
  RefreshCw,
  CheckCheck,
  AlertTriangle,
  X,
  Clock,
  LogOut,
} from "lucide-react";
import { toast } from "react-toastify";

import { useAuth } from "../../context/AuthContext";

import {
  getNotifications,
  getReadNotificationIds,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../services/notificationService";

export default function Navbar({ onMenuClick }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [readIds, setReadIds] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // User details
  const userName = user?.name || user?.email || "User";
  const userEmail = user?.email || "";
  const userRole = user?.role || "User";

  const userInitials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  // Load notifications
  const loadNotifications = useCallback(async (showMessage = false) => {
    try {
      setLoadingNotifications(true);

      const result = await getNotifications();

      setNotifications(Array.isArray(result) ? result : []);
      setReadIds(getReadNotificationIds());

      if (showMessage) {
        toast.success("Notifications refreshed successfully");
      }
    } catch (error) {
      console.error("Notification API Error:", error);

      if (showMessage) {
        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Unable to refresh notifications",
        );
      }
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((item) => !readIds.includes(item.id)).length;
  }, [notifications, readIds]);

  // Mark one notification as read
  const handleMarkAsRead = (notificationId) => {
    markNotificationAsRead(notificationId);

    setReadIds((previous) =>
      previous.includes(notificationId)
        ? previous
        : [...previous, notificationId],
    );
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead(notifications);

    setReadIds((previous) => [
      ...new Set([...previous, ...notifications.map((item) => item.id)]),
    ]);

    toast.success("All notifications marked as read");
  };

  // Format notification date
  const formatDate = (date) => {
    if (!date) return "Recently";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Recently";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Logout
  const handleLogout = () => {
    try {
      setProfileOpen(false);
      setNotificationOpen(false);

      logout();

      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout Error:", error);
      toast.error("Unable to logout. Please try again.");
    }
  };

  const iconButtonClass =
    "flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  const dropdownButtonClass =
    "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold tracking-tight text-slate-700 transition-all duration-200 hover:translate-x-1 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  return (
    <header className="app-navbar sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="flex min-h-[68px] items-center justify-between gap-2 px-3 sm:min-h-[76px] sm:px-6 lg:px-8">
        {/* LEFT: MENU + BRAND */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className={`${iconButtonClass} lg:hidden`}
            aria-label="Open navigation menu"
          >
            <Menu size={23} />
          </button>

          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-200/70 transition-transform duration-300 hover:scale-105 sm:flex">
              <Package size={22} strokeWidth={2.2} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-extrabold tracking-tight text-slate-900 sm:text-lg">
                Inventory Management
              </h1>

              <div className="mt-1 flex items-center gap-2">
                <span className="hidden text-xs font-medium tracking-tight text-slate-500 sm:block">
                  AI Demand & Inventory Intelligence
                </span>

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />

                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                  System Online
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: ACTIONS */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 lg:gap-4">
          {/* SEARCH */}
          <div className="hidden w-52 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 transition-all duration-200 hover:border-slate-300 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 md:flex lg:w-64">
            <Search size={17} className="shrink-0 text-slate-400" />

            <input
              type="search"
              placeholder="Search anything..."
              className="w-full cursor-text bg-transparent text-sm font-medium tracking-tight text-slate-700 outline-none placeholder:font-normal placeholder:text-slate-400"
            />

            <div className="flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] font-semibold text-slate-400">
              <Command size={11} />K
            </div>
          </div>

          {/* HELP */}
          {/* HELP */}
          <button
            type="button"
            onClick={() => navigate("/help")}
            aria-label="Help Center"
            title="Help & Support"
            className={iconButtonClass}
          >
            <HelpCircle size={20} />
          </button>

          {/* SETTINGS */}
        

          {/* NOTIFICATIONS */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationOpen((previous) => !previous);
                setProfileOpen(false);
              }}
              aria-label={`Notifications, ${unreadCount} unread`}
              aria-expanded={notificationOpen}
              title="Notifications"
              className={`${iconButtonClass} relative ${
                notificationOpen ? "bg-blue-50 text-blue-700" : ""
              }`}
            >
              <Bell size={21} strokeWidth={2} />

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close notifications"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setNotificationOpen(false)}
                />

                <div className="navbar-dropdown fixed left-3 right-3 top-[76px] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-[400px]">
                  {/* HEADER */}
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                    <div>
                      <h3 className="text-base font-bold tracking-tight text-slate-900">
                        Notifications
                      </h3>

                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {unreadCount} unread notification(s)
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => loadNotifications(true)}
                        disabled={loadingNotifications}
                        title="Refresh notifications"
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RefreshCw
                          size={17}
                          className={loadingNotifications ? "animate-spin" : ""}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => setNotificationOpen(false)}
                        aria-label="Close"
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  </div>

                  {/* MARK ALL READ */}
                  {notifications.length > 0 && unreadCount > 0 && (
                    <div className="flex justify-end border-b border-slate-100 px-4 py-2">
                      <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-blue-600 transition hover:bg-blue-50 hover:text-blue-800"
                      >
                        <CheckCheck size={15} />
                        Mark all as read
                      </button>
                    </div>
                  )}

                  {/* NOTIFICATION LIST */}
                  <div className="max-h-[calc(100dvh-190px)] overflow-y-auto sm:max-h-[420px]">
                    {loadingNotifications && notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <RefreshCw size={25} className="animate-spin" />
                        <p className="mt-3 text-sm font-medium">
                          Loading notifications...
                        </p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                        <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
                          <Bell size={26} />
                        </div>

                        <h4 className="mt-3 text-sm font-bold text-slate-800">
                          You're all caught up!
                        </h4>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          No inventory alerts or overdue purchase orders.
                        </p>
                      </div>
                    ) : (
                      notifications.map((item) => {
                        const isRead = readIds.includes(item.id);

                        return (
                          <div
                            key={item.id}
                            className={`border-b border-slate-100 px-4 py-4 transition-colors duration-200 hover:bg-slate-50 ${
                              !isRead ? "bg-blue-50/40" : ""
                            }`}
                          >
                            <div className="flex gap-3">
                              <div
                                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                  item.priority === "HIGH"
                                    ? "bg-red-100 text-red-600"
                                    : "bg-amber-100 text-amber-600"
                                }`}
                              >
                                <AlertTriangle size={19} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-sm font-bold tracking-tight text-slate-800">
                                    {item.title}
                                  </h4>

                                  {!isRead && (
                                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                                  )}
                                </div>

                                <p className="mt-1 text-xs leading-5 text-slate-600">
                                  {item.message}
                                </p>

                                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
                                    <Clock size={12} />
                                    {formatDate(item.createdAt)}
                                  </span>

                                  {!isRead && (
                                    <button
                                      type="button"
                                      onClick={() => handleMarkAsRead(item.id)}
                                      className="cursor-pointer rounded-md px-2 py-1 text-[11px] font-bold text-blue-600 transition hover:bg-blue-50 hover:text-blue-800"
                                    >
                                      Mark as read
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* FOOTER */}
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-center text-[11px] font-medium text-slate-500">
                      Notifications refresh automatically every minute.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* PROFILE */}
          <div className="relative border-l border-slate-200 pl-2 sm:pl-4">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((previous) => !previous);
                setNotificationOpen(false);
              }}
              aria-label="Open user profile"
              aria-expanded={profileOpen}
              className="flex cursor-pointer items-center gap-2 rounded-xl p-1.5 transition-all duration-200 hover:bg-slate-100 sm:gap-3 sm:p-2"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-sm font-extrabold text-blue-700 ring-2 ring-blue-50 transition-transform duration-200 hover:scale-105">
                {userInitials || <UserCircle size={25} />}
              </div>

              <div className="hidden max-w-[130px] text-left sm:block">
                <p className="truncate text-sm font-bold tracking-tight text-slate-800">
                  {userName}
                </p>

                <p className="truncate text-[11px] font-semibold capitalize text-slate-500">
                  {userRole}
                </p>
              </div>

              <ChevronDown
                size={16}
                className={`hidden text-slate-400 transition-transform duration-200 sm:block ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {profileOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close profile menu"
                  onClick={() => setProfileOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />

                <div className="navbar-dropdown absolute right-0 z-50 mt-3 w-72 max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                  {/* USER INFORMATION */}
                  <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 font-extrabold text-blue-700 ring-2 ring-white">
                        {userInitials || <UserCircle size={27} />}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold tracking-tight text-slate-900">
                          {userName}
                        </p>

                        <p className="mt-1 truncate text-xs font-medium text-slate-500">
                          {userEmail}
                        </p>

                        <p className="mt-1 text-xs font-bold capitalize text-blue-600">
                          {userRole}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PROFILE ACTIONS */}
                 {/* PROFILE ACTIONS */}
<div className="space-y-1 p-2">
  {/* MY PROFILE */}
  <button
    type="button"
    onClick={() => {
      setProfileOpen(false);
      navigate("/profile");
    }}
    className={dropdownButtonClass}
  >
    <UserCircle size={18} />
    My Profile
  </button>

  {/* SETTINGS */}
  <button
    type="button"
    onClick={() => {
      setProfileOpen(false);
      navigate("/settings");
    }}
    className={dropdownButtonClass}
  >
    <Settings size={18} />
    Settings
  </button>

  <div className="my-2 border-t border-slate-100" />

  {/* LOGOUT */}
  <button
    type="button"
    onClick={handleLogout}
    className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold tracking-tight text-red-600 transition-all duration-200 hover:translate-x-1 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
  >
    <LogOut size={18} />
    Logout
  </button>
</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
