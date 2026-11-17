
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Package,
  Boxes,
  ShoppingCart,
  AlertTriangle,
  Truck,
  RefreshCw,
  ClipboardList,
  TrendingDown,
  XCircle,
  CheckCircle,
  IndianRupee,
  Search,
  Filter,
  Clock3,
  X,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

import {
  getDashboardSummary,
  getInventoryAnalytics,
  getAIInsights,
} from "../services/dashboardService";

import { getInventory } from "../services/inventoryService";

import StatCard from "../components/dashboard/StatCard";
import InventoryChart from "../components/dashboard/InventoryChart";
import StockOverview from "../components/dashboard/StockOverview";
import AIInsights from "../components/dashboard/AIInsights";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount ?? 0));

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusStyle = (status) => {
  switch (String(status ?? "").toUpperCase()) {
    case "RECEIVED":
      return "bg-emerald-50 text-emerald-700";

    case "CANCELLED":
      return "bg-red-50 text-red-700";

    case "APPROVED":
      return "bg-blue-50 text-blue-700";

    case "DRAFT":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-amber-50 text-amber-700";
  }
};

export default function Dashboard() {
  // Logged-in user details
  const { user } = useAuth();

  // Dashboard states
  const [summary, setSummary] = useState({});
  const [inventoryAnalytics, setInventoryAnalytics] = useState({});
  const [inventoryRecords, setInventoryRecords] = useState([]);
  const [insights, setInsights] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [poSearch, setPoSearch] = useState("");
  const [poStatusFilter, setPoStatusFilter] = useState("ALL");

  // Welcome popup state
  const [showWelcome, setShowWelcome] = useState(false);

  // Display welcome popup once per login session
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("authToken");

    if (!token) return;

    const welcomeKey = `welcomeShown_${token}`;

    if (!sessionStorage.getItem(welcomeKey)) {
      setShowWelcome(true);
      sessionStorage.setItem(welcomeKey, "true");
    }
  }, [user]);

  // Load dashboard data
  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [results] = await Promise.all([
        Promise.allSettled([
          getDashboardSummary(),
          getInventoryAnalytics(),
          getAIInsights(),
          getInventory(),
        ]),
        new Promise((resolve) => setTimeout(resolve, 700)),
      ]);

      let failedRequests = 0;

      // Dashboard summary
      if (results[0].status === "fulfilled") {
        setSummary(results[0].value?.dashboard ?? {});
      } else {
        failedRequests++;
        console.error("Dashboard Summary:", results[0].reason);
      }

      // Inventory analytics
      if (results[1].status === "fulfilled") {
        const response = results[1].value;

        setInventoryAnalytics(response?.analytics ?? {});
      } else {
        failedRequests++;
        console.error("Inventory Analytics:", results[1].reason);
      }

      // AI insights
      if (results[2].status === "fulfilled") {
        const response = results[2].value;

        const insightData =
          response?.insights ??
          response?.recommendations ??
          (Array.isArray(response) ? response : []);

        setInsights(Array.isArray(insightData) ? insightData : []);
      } else {
        failedRequests++;
        console.error("AI Insights:", results[2].reason);
      }

      // All inventory records
      if (results[3].status === "fulfilled") {
        const response = results[3].value;

        setInventoryRecords(
          Array.isArray(response?.inventory)
            ? response.inventory
            : []
        );
      } else {
        failedRequests++;
        console.error("Inventory Records:", results[3].reason);
      }

      if (failedRequests === 4) {
        toast.error("Unable to load dashboard data");
      } else if (failedRequests > 0) {
        toast.warning(
          "Some dashboard information could not be loaded"
        );
      } else if (isRefresh) {
        toast.success("Dashboard refreshed successfully");
      }
    } catch (error) {
      console.error("Dashboard loading error:", error);
      toast.error(
        error.userMessage ||
        "Something went wrong while loading dashboard"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const inventory = summary.inventory ?? {};
  const purchaseOrders = summary.purchaseOrders ?? {};

  // Normalize all inventory records for dashboard components.
  const normalizedInventory = useMemo(() => {
    return inventoryRecords.map((item) => {
      const quantity = Number(item.quantity) || 0;
      const reservedQuantity = Number(item.reservedQuantity) || 0;
      const availableStock = Math.max(
        0,
        quantity - reservedQuantity
      );
      const reorderLevel = Number(item.reorderLevel) || 0;

      return {
        id: item.id,
        productId: item.productId,
        name: item.product?.name ?? "Unknown Product",
        productName: item.product?.name ?? "Unknown Product",
        sku: item.product?.sku ?? "N/A",
        quantity,
        currentStock: quantity,
        reservedQuantity,
        availableStock,
        reorderLevel,
        status:
          availableStock <= 0
            ? "OUT_OF_STOCK"
            : availableStock <= reorderLevel
              ? "LOW_STOCK"
              : "HEALTHY",
      };
    });
  }, [inventoryRecords]);

  // Calculate alerts from actual inventory records.
  const lowStockProducts = normalizedInventory.filter(
    (item) => item.status === "LOW_STOCK"
  );

  const outOfStockProducts = normalizedInventory.filter(
    (item) => item.status === "OUT_OF_STOCK"
  );

  const stockAlerts = [
    ...outOfStockProducts,
    ...lowStockProducts,
  ];

  // Chart uses ALL inventory records.
  const chartData = normalizedInventory.map((item) => ({
    name: item.name,
    quantity: item.currentStock,
  }));

  const totalInventoryUnits = normalizedInventory.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalAvailableUnits = normalizedInventory.reduce(
    (total, item) => total + item.availableStock,
    0
  );

  const healthyStockCount = normalizedInventory.filter(
    (item) => item.status === "HEALTHY"
  ).length;

  const totalStockAlerts = stockAlerts.length;

  const recentOrders = summary.recentPurchaseOrders ?? [];

  const filteredRecentOrders = recentOrders.filter((order) => {
    const searchText = poSearch.trim().toLowerCase();
    const matchesSearch = [order.poNumber, order.id, order.status].some((value) =>
      String(value ?? "").toLowerCase().includes(searchText)
    );
    const matchesStatus =
      poStatusFilter === "ALL" ||
      String(order.status ?? "").toUpperCase() === poStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalProducts = summary.products?.total ?? 0;
  const totalSuppliers = summary.suppliers?.total ?? 0;

  // Dashboard loading screen
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
            <RefreshCw
              size={30}
              className="animate-spin text-blue-600"
            />
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-700">
            Preparing your dashboard...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Loading inventory and business insights
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Welcome Popup */}
      {showWelcome && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-title"
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowWelcome(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
              aria-label="Close welcome popup"
            >
              <X size={20} />
            </button>

            {/* Popup Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 px-6 py-10 text-center text-white">

              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

              <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-blue-400/20 blur-2xl" />

              <div className="relative z-10">

                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/30 bg-white/15 shadow-lg">
                  <UserRound size={38} />
                </div>

                <div className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-blue-100">
                  <Sparkles size={16} />
                  Welcome to your workspace
                </div>

                <h2
                  id="welcome-title"
                  className="text-2xl font-bold tracking-tight sm:text-3xl"
                >
                  Hello, {user?.name || "User"}!
                </h2>

                <p className="mt-2 text-sm text-blue-100">
                  We're happy to have you here.
                </p>
              </div>
            </div>

            {/* User Details */}
            <div className="p-6 text-center">

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Logged-in User
                </p>

                <h3 className="mt-2 text-xl font-bold text-slate-800">
                  {user?.name || "User"}
                </h3>

                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold capitalize text-blue-700">
                  <UserRound size={15} />
                  {user?.role || "Staff"}
                </div>

              </div>

              <p className="mt-5 text-sm leading-6 text-slate-500">
                Manage inventory, monitor demand and make
                smarter business decisions with your
                AI-powered intelligence platform.
              </p>

              {/* Continue Button */}
              <button
                type="button"
                onClick={() => setShowWelcome(false)}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
              >
                Continue to Dashboard
              </button>

              <p className="mt-4 text-xs font-medium uppercase tracking-wider text-slate-400">
                AI Demand & Inventory Intelligence Platform
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      <div className="mx-auto max-w-[1600px] space-y-7">

        {/* Header */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-blue-800 p-6 shadow-lg sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />

          <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Business Overview
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Dashboard
              </h1>

              <p className="mt-2 text-sm text-blue-100/80 sm:text-base">
                Monitor demand, inventory and purchasing performance.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-900 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh Dashboard"}
            </button>
          </div>
        </section>

        {/* KPI Cards */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Business Summary
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Key performance indicators
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="Total Products"
              value={totalProducts}
              subtitle="Registered products"
              icon={Package}
              color="blue"
            />

            <StatCard
              title="Inventory Units"
              value={totalInventoryUnits.toLocaleString("en-IN")}
              subtitle={`${totalAvailableUnits.toLocaleString("en-IN")} available units`}
              icon={Boxes}
              color="green"
            />

            <StatCard
              title="Purchase Orders"
              value={purchaseOrders.total ?? 0}
              subtitle={`${purchaseOrders.pending ?? 0} pending orders`}
              icon={ShoppingCart}
              color="orange"
            />

            <StatCard
              title="Stock Alerts"
              value={totalStockAlerts}
              subtitle="Low and out-of-stock products"
              icon={AlertTriangle}
              color="red"
            />

            <StatCard
              title="Total Suppliers"
              value={totalSuppliers}
              subtitle="Registered suppliers"
              icon={Truck}
              color="blue"
            />
          </div>
        </section>

        {/* Inventory Health */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Healthy Stock
                </p>
                <h3 className="mt-2 text-3xl font-bold text-emerald-700">
                  {healthyStockCount}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Products above reorder level
                </p>
              </div>

              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                <CheckCircle size={25} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Low Stock
                </p>
                <h3 className="mt-2 text-3xl font-bold text-amber-700">
                  {lowStockProducts.length}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Products at or below reorder level
                </p>
              </div>

              <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
                <TrendingDown size={25} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Out of Stock
                </p>
                <h3 className="mt-2 text-3xl font-bold text-red-700">
                  {outOfStockProducts.length}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Products with no available units
                </p>
              </div>

              <div className="rounded-xl bg-red-100 p-3 text-red-700">
                <XCircle size={25} />
              </div>
            </div>
          </div>

        </section>

        {/* Purchase Order Value */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Purchase Order Value
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                {formatCurrency(purchaseOrders.totalValue)}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Across all purchase orders
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <IndianRupee size={27} />
            </div>
          </div>
        </section>

        {/* Inventory Analytics */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-800">
              Inventory Analytics
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Stock distribution and product availability
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <InventoryChart data={chartData} />

            <StockOverview data={stockAlerts} />
          </div>

          {inventoryRecords.length === 0 && (
            <div className="mt-4 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-4 text-center">
              <Boxes className="mx-auto text-blue-500" size={24} />

              <p className="mt-2 text-sm font-semibold text-slate-700">
                No inventory records yet
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Add initial stock from Inventory Management to populate
                the inventory chart and stock overview.
              </p>
            </div>
          )}
        </section>

        {/* Recent Purchase Orders */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:shadow-lg">
          <div className="border-b border-slate-100 bg-gradient-to-r from-white to-indigo-50/40 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <ClipboardList size={23} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Recent Purchase Orders</h3>
                  <p className="mt-1 text-xs text-slate-500">Monitor purchasing activity and order status</p>
                </div>
              </div>
              <span className="w-fit rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                {filteredRecentOrders.length} of {recentOrders.length} orders
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <div className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50 sm:max-w-sm">
                <Search size={17} className="shrink-0 text-slate-400" />
                <input type="search" value={poSearch} onChange={(e) => setPoSearch(e.target.value)} placeholder="Search PO number or status..." className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400" />
                {poSearch && <button type="button" onClick={() => setPoSearch("")} className="text-xs font-semibold text-indigo-600">Clear</button>}
              </div>
              <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:w-48">
                <Filter size={16} className="text-slate-400" />
                <select value={poStatusFilter} onChange={(e) => setPoStatusFilter(e.target.value)} className="w-full bg-transparent text-sm text-slate-700 outline-none">
                  <option value="ALL">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="RECEIVED">Received</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Purchase Order</th>
                  <th className="px-5 py-4">Order Date</th>
                  <th className="px-5 py-4">Order Amount</th>
                  <th className="px-5 py-4">Order Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecentOrders.map((order, index) => (
                  <tr key={order.id} className="dashboard-table-row transition-colors hover:bg-indigo-50/40" style={{ animationDelay: `${index * 50}ms` }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><ShoppingCart size={19} /></div>
                        <div><p className="font-bold text-slate-800">{order.poNumber ?? `PO-${order.id}`}</p><p className="mt-1 text-[11px] text-slate-400">Purchase order</p></div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="flex items-center gap-2 text-slate-600"><Clock3 size={15} className="text-slate-400" />{formatDate(order.orderDate)}</div></td>
                    <td className="px-5 py-4 font-bold text-slate-800">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-5 py-4"><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold ${getStatusStyle(order.status)}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{order.status ?? "UNKNOWN"}</span></td>
                  </tr>
                ))}
                {filteredRecentOrders.length === 0 && <tr><td colSpan={4} className="px-5 py-14 text-center"><ClipboardList size={34} className="mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-700">No matching purchase orders</p><p className="mt-1 text-xs text-slate-400">Change your search or status filter.</p></td></tr>}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-3 md:hidden">
            {filteredRecentOrders.map((order, index) => (
              <article key={order.id} className="dashboard-table-row rounded-xl border border-slate-200 bg-white p-4" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><ShoppingCart size={19} /></div>
                    <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{order.poNumber ?? `PO-${order.id}`}</p><p className="mt-1 text-xs text-slate-400">{formatDate(order.orderDate)}</p></div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusStyle(order.status)}`}>{order.status ?? "UNKNOWN"}</span>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order Amount</p><p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(order.totalAmount)}</p></div>
              </article>
            ))}
            {filteredRecentOrders.length === 0 && <div className="py-12 text-center"><ClipboardList size={32} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">No matching purchase orders</p><p className="mt-1 text-xs text-slate-400">Try changing your search or filter.</p></div>}
          </div>
        </section>

        {/* AI Insights */}
        <section>
          <AIInsights data={insights} />
        </section>

        <style>{`
          .dashboard-table-row { animation: dashboardRowIn .4s ease-out both; }
          @keyframes dashboardRowIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            .dashboard-table-row { animation: none !important; }
          }
        `}</style>

        {/* Footer Information */}
        <div className="flex flex-col justify-between gap-2 border-t border-slate-200 pt-4 text-xs text-slate-400 sm:flex-row">
          <p>AI Demand & Inventory Intelligence Platform</p>

          <p>
            {inventoryAnalytics.totalInventoryRecords ?? inventoryRecords.length}{" "}
            inventory records loaded
          </p>
        </div>

      </div>
    </>
  );
}
