import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Package,
  Boxes,
  IndianRupee,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  TrendingUp,
  Activity,
  SlidersHorizontal,
  ChevronDown,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { toast } from "react-toastify";
import { getInventoryAnalytics } from "../services/analyticsService";

const formatNumber = (value) => Number(value ?? 0).toLocaleString("en-IN");

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

const columns = [
  { key: "productName", label: "Product" },
  { key: "sku", label: "SKU" },
  { key: "currentStock", label: "Current Stock" },
  { key: "reservedQuantity", label: "Reserved" },
  { key: "availableStock", label: "Available" },
  { key: "reorderLevel", label: "Reorder Level" },
  { key: "status", label: "Status" },
];

const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </h3>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className={`shrink-0 rounded-xl p-3 ${color}`}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

const getStatus = (product) => {
  if (Number(product.availableStock ?? 0) <= 0) return "OUT OF STOCK";
  return "LOW STOCK";
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${
      status === "OUT OF STOCK"
        ? "bg-red-50 text-red-700 ring-1 ring-red-200"
        : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
    }`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full ${
        status === "OUT OF STOCK" ? "bg-red-500" : "bg-amber-500"
      }`}
    />
    {status}
  </span>
);

export default function InventoryAnalytics() {
  const [analytics, setAnalytics] = useState({});
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Column visibility settings
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    productName: true,
    sku: true,
    currentStock: true,
    reservedQuantity: true,
    availableStock: true,
    reorderLevel: true,
    status: true,
  });

  const toggleColumn = (key) => {
    setVisibleColumns((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const visibleColumnCount = columns.filter(
    (column) => visibleColumns[column.key],
  ).length;

  const resetColumns = () => {
    setVisibleColumns(
      Object.fromEntries(columns.map((column) => [column.key, true])),
    );
  };

  const loadAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const startTime = Date.now();

    try {
      const response = await getInventoryAnalytics();

      if (!response?.success) {
        throw new Error(
          response?.message || "Unable to load inventory analytics",
        );
      }

      setAnalytics(response.analytics ?? {});
      setLowStockProducts(
        Array.isArray(response.lowStockProducts)
          ? response.lowStockProducts
          : [],
      );
      setOutOfStockProducts(
        Array.isArray(response.outOfStockProducts)
          ? response.outOfStockProducts
          : [],
      );

      if (isRefresh) {
        toast.success("Inventory analytics refreshed");
      }
    } catch (error) {
      console.error("Inventory Analytics Error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load inventory analytics",
      );
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 700 - elapsed);

      setTimeout(() => {
        setLoading(false);
        setRefreshing(false);
      }, remaining);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const allAlerts = useMemo(() => {
    return [
      ...outOfStockProducts.map((product) => ({
        ...product,
        status: "OUT OF STOCK",
      })),
      ...lowStockProducts.map((product) => ({
        ...product,
        status: "LOW STOCK",
      })),
    ];
  }, [lowStockProducts, outOfStockProducts]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allAlerts.filter((product) => {
      const matchesSearch =
        !query ||
        String(product.productName ?? "")
          .toLowerCase()
          .includes(query) ||
        String(product.sku ?? "")
          .toLowerCase()
          .includes(query);

      const matchesFilter = filter === "ALL" || product.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [allAlerts, search, filter]);

  const stockHealthData = [
    {
      name: "Healthy",
      value: Number(analytics.healthyStockCount ?? 0),
      color: "#10b981",
    },
    {
      name: "Low Stock",
      value: Number(analytics.lowStockCount ?? 0),
      color: "#f59e0b",
    },
    {
      name: "Out of Stock",
      value: Number(analytics.outOfStockCount ?? 0),
      color: "#ef4444",
    },
  ];

  const hasStockData = stockHealthData.some((item) => item.value > 0);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <p className="text-sm font-medium text-slate-500">
          Loading inventory analytics...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/60 pb-8">
      {/* HEADER */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-900 p-5 text-white shadow-lg sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                <Activity size={25} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                  Inventory Intelligence
                </p>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  Inventory Analytics
                </h1>
              </div>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-blue-100/80">
              Monitor inventory performance, stock health and inventory value
              from one dashboard.
            </p>
          </div>

          <button
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-950 shadow-md transition hover:bg-blue-50 disabled:opacity-60 sm:w-auto"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh Analytics"}
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active Products"
          value={formatNumber(analytics.totalActiveProducts)}
          subtitle="Total active products"
          icon={Package}
          color="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Inventory Records"
          value={formatNumber(analytics.totalInventoryRecords)}
          subtitle="Products with inventory records"
          icon={Boxes}
          color="bg-violet-50 text-violet-600"
        />

        <StatCard
          title="Total Inventory Units"
          value={formatNumber(analytics.totalInventoryUnits)}
          subtitle="Physical stock quantity"
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Inventory Value"
          value={formatCurrency(analytics.totalInventoryValue)}
          subtitle="Based on product cost price"
          icon={IndianRupee}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* STOCK SUMMARY */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
              <CheckCircle2 size={23} />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-700">
                Healthy Stock
              </p>
              <h2 className="mt-1 text-2xl font-bold text-emerald-900">
                {formatNumber(analytics.healthyStockCount)}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
              <AlertTriangle size={23} />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-700">Low Stock</p>
              <h2 className="mt-1 text-2xl font-bold text-amber-900">
                {formatNumber(analytics.lowStockCount)}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-100 p-3 text-red-700">
              <XCircle size={23} />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-700">Out of Stock</p>
              <h2 className="mt-1 text-2xl font-bold text-red-900">
                {formatNumber(analytics.outOfStockCount)}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Stock Health Distribution
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Distribution of inventory records by stock status.
            </p>
          </div>

          {hasStockData ? (
            <div className="mt-4 h-[280px] min-w-0 sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockHealthData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius="72%"
                    innerRadius="48%"
                    paddingAngle={3}
                  >
                    {stockHealthData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatNumber(value), "Products"]}
                  />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[280px] flex-col items-center justify-center text-center sm:h-[320px]">
              <Boxes size={40} className="text-slate-300" />
              <p className="mt-3 font-semibold text-slate-600">
                No inventory data available
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Add inventory records to view stock distribution.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Inventory Health Overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Current stock status based on available quantity.
          </p>

          <div className="mt-7 space-y-7">
            {stockHealthData.map((item) => {
              const total = stockHealthData.reduce(
                (sum, current) => sum + current.value,
                0,
              );

              const percentage = total > 0 ? (item.value / total) * 100 : 0;

              return (
                <div key={item.name}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-700">
                      {item.name}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {formatNumber(item.value)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
            <p className="text-sm font-bold text-blue-950">
              How stock health is calculated
            </p>
            <p className="mt-2 text-xs leading-6 text-blue-900/70">
              Available stock = current quantity minus reserved quantity. Stock
              is considered out of stock when available quantity is zero or
              less, low stock when it is at or below the reorder level, and
              healthy when it is above the reorder level.
            </p>
          </div>
        </div>
      </div>

      {/* INVENTORY ALERTS */}
      <div className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* TABLE HEADER */}
        <div className="border-b border-slate-100 p-4 sm:p-6">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Inventory Stock Alerts
                </h2>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                  {filteredProducts.length} Products
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Products that need inventory attention.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
              <div className="relative min-w-0 flex-1 sm:min-w-[220px]">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search product or SKU..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:w-auto"
              >
                <option value="ALL">All Alerts</option>
                <option value="LOW STOCK">Low Stock</option>
                <option value="OUT OF STOCK">Out of Stock</option>
              </select>

              {/* COLUMN VISIBILITY MENU */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColumnMenu((previous) => !previous)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 sm:w-auto"
                >
                  <SlidersHorizontal size={16} />
                  Columns
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs">
                    {visibleColumnCount}/{columns.length}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`transition ${showColumnMenu ? "rotate-180" : ""}`}
                  />
                </button>

                {showColumnMenu && (
                  <>
                    <button
                      aria-label="Close column settings"
                      className="fixed inset-0 z-20 cursor-default"
                      onClick={() => setShowColumnMenu(false)}
                    />

                    <div className="absolute right-0 top-full z-30 mt-2 w-full min-w-[260px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:w-72">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            Table Columns
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Choose what you want to display
                          </p>
                        </div>
                        <button
                          onClick={() => setShowColumnMenu(false)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                        >
                          <X size={17} />
                        </button>
                      </div>

                      <div className="space-y-1">
                        {columns.map((column) => (
                          <label
                            key={column.key}
                            className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-slate-50"
                          >
                            <span className="text-sm font-medium text-slate-700">
                              {column.label}
                            </span>
                            <input
                              type="checkbox"
                              checked={visibleColumns[column.key]}
                              onChange={() => toggleColumn(column.key)}
                              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </label>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <button
                          onClick={resetColumns}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800"
                        >
                          Show all columns
                        </button>
                        <button
                          onClick={() => setShowColumnMenu(false)}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                {columns.map(
                  (column) =>
                    visibleColumns[column.key] && (
                      <th
                        key={column.key}
                        className="whitespace-nowrap px-5 py-4 font-bold"
                      >
                        {column.label}
                      </th>
                    ),
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr
                    key={`${product.productId}-${product.status}`}
                    className="transition hover:bg-blue-50/40"
                  >
                    {visibleColumns.productName && (
                      <td className="px-5 py-4 font-bold text-slate-800">
                        {product.productName}
                      </td>
                    )}

                    {visibleColumns.sku && (
                      <td className="px-5 py-4 text-slate-500">
                        {product.sku || "—"}
                      </td>
                    )}

                    {visibleColumns.currentStock && (
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {formatNumber(product.currentStock)}
                      </td>
                    )}

                    {visibleColumns.reservedQuantity && (
                      <td className="px-5 py-4 text-slate-600">
                        {formatNumber(product.reservedQuantity)}
                      </td>
                    )}

                    {visibleColumns.availableStock && (
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {formatNumber(product.availableStock)}
                      </td>
                    )}

                    {visibleColumns.reorderLevel && (
                      <td className="px-5 py-4 text-slate-600">
                        {formatNumber(product.reorderLevel)}
                      </td>
                    )}

                    {visibleColumns.status && (
                      <td className="px-5 py-4">
                        <StatusBadge status={getStatus(product)} />
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={Math.max(visibleColumnCount, 1)}
                    className="px-5 py-14 text-center"
                  >
                    <CheckCircle2
                      size={38}
                      className="mx-auto text-emerald-500"
                    />
                    <p className="mt-3 font-bold text-slate-700">
                      No matching stock alerts
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try changing your search or filter.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE AND TABLET CARDS */}
        <div className="grid grid-cols-1 gap-3 p-3 sm:p-4 lg:hidden">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div
                key={`${product.productId}-${product.status}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {visibleColumns.productName && (
                      <h3 className="break-words font-bold text-slate-900">
                        {product.productName}
                      </h3>
                    )}
                    {visibleColumns.sku && (
                      <p className="mt-1 text-xs text-slate-500">
                        SKU: {product.sku || "—"}
                      </p>
                    )}
                  </div>
                  {visibleColumns.status && (
                    <StatusBadge status={getStatus(product)} />
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {visibleColumns.currentStock && (
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Current Stock</p>
                      <p className="mt-1 font-bold text-slate-900">
                        {formatNumber(product.currentStock)}
                      </p>
                    </div>
                  )}

                  {visibleColumns.reservedQuantity && (
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Reserved</p>
                      <p className="mt-1 font-bold text-slate-900">
                        {formatNumber(product.reservedQuantity)}
                      </p>
                    </div>
                  )}

                  {visibleColumns.availableStock && (
                    <div className="rounded-xl bg-blue-50 p-3">
                      <p className="text-xs text-blue-600">Available</p>
                      <p className="mt-1 font-bold text-blue-800">
                        {formatNumber(product.availableStock)}
                      </p>
                    </div>
                  )}

                  {visibleColumns.reorderLevel && (
                    <div className="rounded-xl bg-amber-50 p-3">
                      <p className="text-xs text-amber-700">Reorder Level</p>
                      <p className="mt-1 font-bold text-amber-800">
                        {formatNumber(product.reorderLevel)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-12 text-center">
              <CheckCircle2 size={38} className="mx-auto text-emerald-500" />
              <p className="mt-3 font-bold text-slate-700">
                No matching stock alerts
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filter.
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex flex-col justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-5">
          <span>
            Showing{" "}
            <strong className="text-slate-700">
              {filteredProducts.length}
            </strong>{" "}
            of <strong className="text-slate-700">{allAlerts.length}</strong>{" "}
            alert records
          </span>
          <span>
            {visibleColumnCount} of {columns.length} columns visible
          </span>
        </div>
      </div>
    </div>
  );
}
