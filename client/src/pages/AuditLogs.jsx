
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Search,
  RefreshCw,
  Download,
  ShieldCheck,
  ShieldAlert,
  Clock3,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  CalendarDays,
  Filter,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  ClipboardList,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../services/api";

const PAGE_SIZE = 10;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const getLogs = (response) => {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.logs)) return data.logs;
  if (Array.isArray(data?.auditLogs)) return data.auditLogs;
  if (Array.isArray(data?.data?.logs)) return data.data.logs;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

const getTotal = (response, logs) => {
  const data = response?.data ?? response;

  return Number(
    data?.total ??
    data?.count ??
    data?.pagination?.total ??
    data?.data?.total ??
    logs.length
  );
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatValue = (value) => {
  if (value === null || value === undefined) return "—";

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
};

const getStatus = (log) =>
  String(log?.status || "SUCCESS").toUpperCase();

const statusStyles = {
  SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
};

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {value.toLocaleString("en-IN")}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const value = getStatus({ status });

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
        statusStyles[value] || statusStyles.SUCCESS
      }`}
    >
      {value === "FAILED" ? (
        <XCircle size={12} />
      ) : (
        <CheckCircle2 size={12} />
      )}
      {value}
    </span>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 sm:flex-row sm:justify-between">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="break-all text-sm font-medium text-slate-700 sm:max-w-[65%] sm:text-right">
        {value || "—"}
      </span>
    </div>
  );
}

function ValuePanel({ title, value, type }) {
  return (
    <div
      className={`min-w-0 rounded-xl border p-4 ${
        type === "old"
          ? "border-amber-200 bg-amber-50/50"
          : "border-emerald-200 bg-emerald-50/50"
      }`}
    >
      <h4
        className={`mb-3 text-sm font-bold ${
          type === "old" ? "text-amber-800" : "text-emerald-800"
        }`}
      >
        {title}
      </h4>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-700">
        {value ? formatValue(value) : "No data available"}
      </pre>
    </div>
  );
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [module, setModule] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadLogs = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      const params = {
        page,
        limit: PAGE_SIZE,
      };

      if (search.trim()) params.search = search.trim();
      if (action) params.action = action;
      if (module) params.module = module;
      if (status) params.status = status;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get("/audit-logs", { params });
      const result = getLogs(response.data);

      setLogs(result);
      setTotal(getTotal(response.data, result));
    } catch (error) {
      console.error("Audit Logs API Error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to load audit logs"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search, action, module, status, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadLogs]);

  const successfulCount = useMemo(
    () => logs.filter((item) => getStatus(item) === "SUCCESS").length,
    [logs]
  );

  const failedCount = useMemo(
    () => logs.filter((item) => getStatus(item) === "FAILED").length,
    [logs]
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const openDetails = async (log) => {
    setSelectedLog(log);

    if (!log?.id) return;

    try {
      setDetailLoading(true);
      const response = await api.get(`/audit-logs/${log.id}`);
      const data = response.data?.log ??
        response.data?.auditLog ??
        response.data?.data?.log ??
        response.data?.data ??
        response.data;

      if (data && typeof data === "object") {
        setSelectedLog(data);
      }
    } catch (error) {
      console.error("Audit Log Detail Error:", error);
      // Keep the row data available if detail endpoint fails.
    } finally {
      setDetailLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setAction("");
    setModule("");
    setStatus("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const exportCSV = () => {
    if (!logs.length) {
      toast.info("There are no audit records to export");
      return;
    }

    const columns = [
      "id",
      "userName",
      "userEmail",
      "userRole",
      "action",
      "module",
      "entityId",
      "description",
      "status",
      "ipAddress",
      "createdAt",
    ];

    const escapeCSV = (value) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;

    const rows = [
      columns.join(","),
      ...logs.map((log) =>
        columns.map((key) => escapeCSV(log[key])).join(",")
      ),
    ];

    const blob = new Blob(
      ["\uFEFF" + rows.join("\n")],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `audit-logs-page-${page}.csv`;
    anchor.click();

    URL.revokeObjectURL(url);
    toast.success("Current page exported successfully");
  };

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
            <ShieldCheck size={15} />
            Administration
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Audit Logs
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor user activities and track changes across your platform.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => loadLogs(false)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            onClick={exportCSV}
            disabled={!logs.length}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Activities"
          value={total}
          subtitle="Matching audit records"
          icon={Activity}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Successful"
          value={successfulCount}
          subtitle="On this page"
          icon={ShieldCheck}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Failed"
          value={failedCount}
          subtitle="On this page"
          icon={ShieldAlert}
          color="bg-red-50 text-red-600"
        />
        <StatCard
          title="Current Page"
          value={page}
          subtitle={`Of ${totalPages} pages`}
          icon={Clock3}
          color="bg-violet-50 text-violet-600"
        />
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Filter size={17} className="text-slate-500" />
            <h2 className="font-bold text-slate-800">Activity Filters</h2>
          </div>
          <button
            onClick={clearFilters}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            Clear all filters
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search user, email or activity..."
              className={`${inputClass} pl-10`}
            />
          </div>

          <select
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All Actions</option>
            <option value="LOGIN">Login</option>
            <option value="LOGIN_FAILED">Failed Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="EMPLOYEE_ACTIVATED">Employee Activated</option>
            <option value="EMPLOYEE_DEACTIVATED">Employee Deactivated</option>
          </select>

          <select
            value={module}
            onChange={(event) => {
              setModule(event.target.value);
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All Modules</option>
            <option value="AUTHENTICATION">Authentication</option>
            <option value="EMPLOYEES">Employees</option>
            <option value="PRODUCTS">Products</option>
            <option value="INVENTORY">Inventory</option>
            <option value="SUPPLIERS">Suppliers</option>
            <option value="PURCHASE_ORDERS">Purchase Orders</option>
          </select>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Successful</option>
            <option value="FAILED">Failed</option>
          </select>

          <div className="relative">
            <CalendarDays
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => {
                setStartDate(event.target.value);
                setPage(1);
              }}
              className={`${inputClass} pl-10`}
              aria-label="Start date"
            />
          </div>

          <div className="relative">
            <CalendarDays
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => {
                setEndDate(event.target.value);
                setPage(1);
              }}
              className={`${inputClass} pl-10`}
              aria-label="End date"
            />
          </div>
        </div>
      </section>

      {/* Activity table */}
     
{/* ODOO-STYLE ACTIVITY HISTORY */}
<section className="overflow-hidden rounded-xl border border-slate-200 bg-white">

  {/* Header */}
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
    <div>
      <h2 className="text-base font-semibold text-slate-900">
        Activity History
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Track employee actions and system changes
      </p>
    </div>

    <div className="flex items-center gap-2">
      <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
        {total.toLocaleString("en-IN")} activities
      </span>
      <span className="text-xs text-slate-400">
        {page}/{totalPages}
      </span>
    </div>
  </div>

  {/* Chatter Timeline */}
  <div className="bg-white px-4 py-5 sm:px-7">

    {loading ? (
      <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 size={19} className="animate-spin text-purple-600" />
        Loading activities...
      </div>
    ) : logs.length === 0 ? (
      <div className="flex min-h-64 flex-col items-center justify-center text-center">
        <div className="rounded-full bg-slate-100 p-4 text-slate-400">
          <ClipboardList size={28} />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-slate-800">
          No activities yet
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Employee activities will appear here.
        </p>
      </div>
    ) : (
      <div className="relative">

        {/* Timeline vertical line */}
        <div className="absolute bottom-5 left-[17px] top-3 w-px bg-slate-200" />

        <div className="space-y-7">
          {logs.map((log, index) => {
            const userName = log.userName || log.userEmail || "Unknown User";
            const initials = userName
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((word) => word[0]?.toUpperCase())
              .join("");

            const action = (log.action || "ACTIVITY").replaceAll("_", " ");
            const module = (log.module || "GENERAL").replaceAll("_", " ");

            const actionStyles = {
              CREATE: "bg-emerald-50 text-emerald-700",
              UPDATE: "bg-blue-50 text-blue-700",
              DELETE: "bg-red-50 text-red-700",
              STOCK_IN: "bg-emerald-50 text-emerald-700",
              STOCK_OUT: "bg-orange-50 text-orange-700",
              LOGIN: "bg-purple-50 text-purple-700",
              LOGOUT: "bg-slate-100 text-slate-700",
            };

            return (
              <div key={log.id ?? index} className="relative flex gap-4">

                {/* Employee Avatar */}
                <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white bg-purple-100 text-xs font-bold text-purple-700 ring-1 ring-slate-200">
                  {initials || "U"}
                </div>

                {/* Activity Content */}
                <div className="min-w-0 flex-1">

                  {/* Employee + Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-slate-900">
                        {userName}
                      </span>
                      <span className="ml-2 text-xs text-slate-400">
                        {log.userRole || "Employee"}
                      </span>
                    </div>

                    <span className="whitespace-nowrap text-[11px] text-slate-400">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>

                  {/* Activity Card */}
                  <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-slate-300">

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded px-2 py-1 text-[10px] font-bold ${actionStyles[log.action] || "bg-slate-100 text-slate-700"}`}>
                        {action}
                      </span>

                      <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                        {module}
                      </span>

                      <StatusBadge status={log.status} />
                    </div>

                    {/* Description */}
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      {log.description || "Activity performed"}
                    </p>

                    {/* Entity Details */}
                    {log.entityId && (
                      <p className="mt-2 text-xs text-slate-400">
                        Record ID: #{log.entityId}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <span className="truncate text-xs text-slate-400">
                        {log.userEmail || "No email available"}
                      </span>

                      <button
                        type="button"
                        onClick={() => openDetails(log)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 transition hover:text-purple-900"
                      >
                        <Eye size={14} />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </div>

  {/* Pagination */}
  {!loading && logs.length > 0 && (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3">
      <p className="text-xs text-slate-500">
        Showing {(page - 1) * PAGE_SIZE + 1}–
        {Math.min(page * PAGE_SIZE, total)} of {total} activities
      </p>

      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage((current) => current - 1)}
          className="rounded-md border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="text-xs font-medium text-slate-600">
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page >= totalPages}
          onClick={() => setPage((current) => current + 1)}
          className="rounded-md border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )}
</section>

{/* ODOO-STYLE ACTIVITY DETAILS */}
{selectedLog && (
  <div
    className="fixed inset-0 z-[100] flex justify-end bg-slate-950/40"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        setSelectedLog(null);
      }
    }}
  >
    <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">

      {/* Drawer Header */}
      <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
            Activity Record
          </p>

          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            {(selectedLog.action || "Activity").replaceAll("_", " ")}
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            Reference #{selectedLog.id || "—"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedLog(null)}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
        >
          <X size={19} />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 space-y-6 overflow-y-auto p-5">

        {detailLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 size={15} className="animate-spin" />
            Loading activity details...
          </div>
        )}

        {/* Employee Profile */}
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">
              {(selectedLog.userName || "U").charAt(0).toUpperCase()}
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                {selectedLog.userName || "Unknown User"}
              </p>
              <p className="text-xs text-slate-500">
                {selectedLog.userEmail || "—"}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {selectedLog.userRole || "Employee"}
              </p>
            </div>
          </div>
        </div>

        {/* Activity Information */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-900">
            Activity Information
          </h4>

          <div className="rounded-lg border border-slate-200 px-4">
            <DetailRow label="Action" value={selectedLog.action} />
            <DetailRow label="Module" value={selectedLog.module} />
            <DetailRow label="Record ID" value={selectedLog.entityId} />
            <DetailRow label="Status" value={selectedLog.status} />
            <DetailRow label="Date & Time" value={formatDate(selectedLog.createdAt)} />
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-900">
            Description
          </h4>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            {selectedLog.description || "No description available"}
          </div>
        </div>

        {/* Previous and New Values */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-900">
            Field Changes
          </h4>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ValuePanel
              title="Previous Values"
              value={selectedLog.oldValues}
              type="old"
            />

            <ValuePanel
              title="New Values"
              value={selectedLog.newValues}
              type="new"
            />
          </div>
        </div>

        {/* Request Details */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-900">
            Technical Information
          </h4>

          <div className="rounded-lg border border-slate-200 px-4">
            <DetailRow label="User ID" value={selectedLog.userId} />
            <DetailRow label="IP Address" value={selectedLog.ipAddress} />
            <DetailRow label="User Agent" value={selectedLog.userAgent} />
          </div>
        </div>
      </div>

      {/* Drawer Footer */}
      <div className="flex justify-end border-t border-slate-200 px-5 py-4">
        <button
          type="button"
          onClick={() => setSelectedLog(null)}
          className="rounded-md bg-purple-700 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-800"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


      {/* Activity detail modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedLog(null);
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
                  <FileText size={14} />
                  Activity Details
                </div>
                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  {(selectedLog.action || "Activity").replaceAll("_", " ")}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Audit record #{selectedLog.id || "—"}
                </p>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[calc(90vh-80px)] space-y-5 overflow-y-auto p-5 sm:p-6">
              {detailLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 size={15} className="animate-spin" />
                  Loading full activity details...
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <User size={15} className="text-blue-600" />
                    User Information
                  </h4>
                  <div className="rounded-xl border border-slate-100 px-4">
                    <DetailRow label="Name" value={selectedLog.userName} />
                    <DetailRow label="Email" value={selectedLog.userEmail} />
                    <DetailRow label="Role" value={selectedLog.userRole} />
                    <DetailRow label="User ID" value={selectedLog.userId} />
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Activity size={15} className="text-blue-600" />
                    Activity Information
                  </h4>
                  <div className="rounded-xl border border-slate-100 px-4">
                    <DetailRow label="Action" value={selectedLog.action} />
                    <DetailRow label="Module" value={selectedLog.module} />
                    <DetailRow label="Entity ID" value={selectedLog.entityId} />
                    <DetailRow label="Status" value={getStatus(selectedLog)} />
                    <DetailRow label="Date" value={formatDate(selectedLog.createdAt)} />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-bold text-slate-800">
                  Description
                </h4>
                <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {selectedLog.description || "No description available"}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ValuePanel
                  title="Previous Values"
                  value={selectedLog.oldValues}
                  type="old"
                />
                <ValuePanel
                  title="New Values"
                  value={selectedLog.newValues}
                  type="new"
                />
              </div>

              <div>
                <h4 className="mb-2 text-sm font-bold text-slate-800">
                  Request Information
                </h4>
                <div className="rounded-xl border border-slate-100 px-4">
                  <DetailRow label="IP Address" value={selectedLog.ipAddress} />
                  <DetailRow label="User Agent" value={selectedLog.userAgent} />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
