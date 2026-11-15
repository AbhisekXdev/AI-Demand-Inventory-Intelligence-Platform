
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

const formatNumber = (value) =>
  Number(value ?? 0).toLocaleString("en-IN");

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="mt-2 text-2xl font-bold text-slate-900">
          {value}
        </h3>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>

      <div className={`rounded-xl p-3 ${color}`}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

const getStatus = (product) => {
  if (Number(product.availableStock ?? 0) <= 0) return "OUT OF STOCK";
  return "LOW STOCK";
};

export default function InventoryAnalytics() {
  const [analytics, setAnalytics] = useState({});
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
          response?.message || "Unable to load inventory analytics"
        );
      }

      setAnalytics(response.analytics ?? {});
      setLowStockProducts(
        Array.isArray(response.lowStockProducts)
          ? response.lowStockProducts
          : []
      );
      setOutOfStockProducts(
        Array.isArray(response.outOfStockProducts)
          ? response.outOfStockProducts
          : []
      );

      if (isRefresh) {
        toast.success("Inventory analytics refreshed");
      }
    } catch (error) {
      console.error("Inventory Analytics Error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load inventory analytics"
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
        String(product.productName ?? "").toLowerCase().includes(query) ||
        String(product.sku ?? "").toLowerCase().includes(query);

      const matchesFilter =
        filter === "ALL" || product.status === filter;

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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <p className="text-sm font-medium text-slate-500">
          Loading inventory analytics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
              <Activity size={23} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Inventory Analytics
            </h1>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Monitor inventory performance, stock health and inventory value.
          </p>
        </div>

        <button
          onClick={() => loadAnalytics(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh Analytics"}
        </button>
      </div>

      {/* KPI Cards */}
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

      {/* Stock Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-600" size={24} />
            <div>
              <p className="text-sm font-medium text-emerald-700">
                Healthy Stock
              </p>
              <h2 className="text-2xl font-bold text-emerald-800">
                {formatNumber(analytics.healthyStockCount)}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-600" size={24} />
            <div>
              <p className="text-sm font-medium text-amber-700">
                Low Stock
              </p>
              <h2 className="text-2xl font-bold text-amber-800">
                {formatNumber(analytics.lowStockCount)}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-3">
            <XCircle className="text-red-600" size={24} />
            <div>
              <p className="text-sm font-medium text-red-700">
                Out of Stock
              </p>
              <h2 className="text-2xl font-bold text-red-800">
                {formatNumber(analytics.outOfStockCount)}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Chart and Explanation */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Stock Health Distribution
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Distribution of inventory records by stock status.
          </p>

          {hasStockData ? (
            <div className="mt-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockHealthData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={100}
                    innerRadius={58}
                    paddingAngle={3}
                  >
                    {stockHealthData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      formatNumber(value),
                      "Products",
                    ]}
                  />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[300px] flex-col items-center justify-center text-center">
              <Boxes size={38} className="text-slate-300" />
              <p className="mt-3 font-medium text-slate-600">
                No inventory data available
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Add inventory records to view stock distribution.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Inventory Health Overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Current stock status based on available quantity.
          </p>

          <div className="mt-6 space-y-6">
            {stockHealthData.map((item) => {
              const total = stockHealthData.reduce(
                (sum, current) => sum + current.value,
                0
              );

              const percentage =
                total > 0 ? (item.value / total) * 100 : 0;

              return (
                <div key={item.name}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      {item.name}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatNumber(item.value)} (
                      {percentage.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all"
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

          <div className="mt-8 rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">
              How stock health is calculated
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Available stock = current quantity minus reserved quantity.
              Stock is considered out of stock when available quantity is
              zero or less, low stock when it is at or below the reorder
              level, and healthy when it is above the reorder level.
            </p>
          </div>
        </div>
      </div>

      {/* Stock Alerts Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Inventory Stock Alerts
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Products that need inventory attention.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search product or SKU..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-64"
                />
              </div>

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="ALL">All Alerts</option>
                <option value="LOW STOCK">Low Stock</option>
                <option value="OUT OF STOCK">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Product</th>
                <th className="px-5 py-4 font-semibold">SKU</th>
                <th className="px-5 py-4 font-semibold">Current Stock</th>
                <th className="px-5 py-4 font-semibold">Reserved</th>
                <th className="px-5 py-4 font-semibold">Available</th>
                <th className="px-5 py-4 font-semibold">Reorder Level</th>
                <th className="px-5 py-4 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr
                    key={`${product.productId}-${product.status}`}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {product.productName}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {product.sku || "—"}
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">
                      {formatNumber(product.currentStock)}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {formatNumber(product.reservedQuantity)}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {formatNumber(product.availableStock)}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {formatNumber(product.reorderLevel)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          product.status === "OUT OF STOCK"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {getStatus(product)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center">
                    <CheckCircle2
                      size={35}
                      className="mx-auto text-emerald-500"
                    />
                    <p className="mt-3 font-semibold text-slate-700">
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

        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          Showing {filteredProducts.length} of {allAlerts.length} alert records
        </div>
      </div>
    </div>
  );
}
