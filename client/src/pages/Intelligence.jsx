
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BrainCircuit,
  RefreshCw,
  Search,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  Boxes,
  ShoppingCart,
  Clock,
  Lightbulb,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { getInventoryIntelligence } from "../services/intelligenceService";

const number = (value) =>
  Number(value ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const riskStyles = {
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  LOW: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const riskOrder = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
};

function RiskBadge({ level }) {
  const risk = String(level || "LOW").toUpperCase();

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
        riskStyles[risk] || riskStyles.LOW
      }`}
    >
      {risk}
    </span>
  );
}

function TrendIndicator({ trend, change }) {
  const value = String(trend || "STABLE").toUpperCase();

  if (value === "INCREASING") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
        <TrendingUp size={16} />
        Increasing ({number(change)}%)
      </span>
    );
  }

  if (value === "DECREASING") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600">
        <TrendingDown size={16} />
        Decreasing ({number(change)}%)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500">
      <Minus size={16} />
      Stable
    </span>
  );
}

function SummaryCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900">
            {number(value)}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function Intelligence() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState({});
  const [insights, setInsights] = useState([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInsights = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const startTime = Date.now();

    try {
      const response = await getInventoryIntelligence();

      if (!response?.success) {
        throw new Error(
          response?.message || "Unable to load intelligence insights"
        );
      }

      setSummary(response.summary ?? {});
      setInsights(
        Array.isArray(response.insights) ? response.insights : []
      );

      if (isRefresh) {
        toast.success("Intelligence insights refreshed");
      }
    } catch (error) {
      console.error("Intelligence Error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load intelligence insights"
      );
    } finally {
      const remaining = Math.max(0, 700 - (Date.now() - startTime));

      setTimeout(() => {
        setLoading(false);
        setRefreshing(false);
      }, remaining);
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const filteredInsights = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...insights]
      .filter((item) => {
        const matchesSearch =
          !query ||
          String(item.productName ?? "").toLowerCase().includes(query) ||
          String(item.sku ?? "").toLowerCase().includes(query) ||
          String(item.recommendation ?? "").toLowerCase().includes(query);

        const matchesRisk =
          riskFilter === "ALL" ||
          String(item.riskLevel).toUpperCase() === riskFilter;

        return matchesSearch && matchesRisk;
      })
      .sort(
        (a, b) =>
          (riskOrder[String(a.riskLevel).toUpperCase()] ?? 5) -
          (riskOrder[String(b.riskLevel).toUpperCase()] ?? 5)
      );
  }, [insights, search, riskFilter]);

  const recommendedUnits = useMemo(
    () =>
      insights.reduce(
        (total, item) =>
          total + Number(item.recommendedQuantity ?? 0),
        0
      ),
    [insights]
  );

  const averageDemand = useMemo(() => {
    if (!insights.length) return 0;

    return (
      insights.reduce(
        (total, item) =>
          total + Number(item.averageDailyDemand ?? 0),
        0
      ) / insights.length
    );
  }, [insights]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600" />
        <p className="text-sm font-medium text-slate-500">
          Analysing demand and inventory...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-100 p-3 text-violet-700">
              <BrainCircuit size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                AI Inventory Intelligence
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Demand trends, stock risks and replenishment recommendations.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => loadInsights(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          {refreshing ? "Analysing..." : "Refresh Insights"}
        </button>
      </div>

      {/* Methodology notice */}
      <div className="flex gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4">
        <Lightbulb className="mt-0.5 shrink-0 text-violet-700" size={21} />
        <div>
          <p className="text-sm font-semibold text-violet-900">
            Inventory intelligence engine
          </p>
          <p className="mt-1 text-sm leading-6 text-violet-800">
            Recommendations are currently generated from demand history,
            stock availability, reorder levels and supplier lead time using
            backend rule-based calculations. A trained ML forecasting model
            is not yet connected.
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Analysed Products"
          value={summary.totalProducts}
          subtitle="Active products analysed"
          icon={Package}
          color="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          title="Critical Alerts"
          value={summary.criticalAlerts}
          subtitle="Immediate attention required"
          icon={AlertTriangle}
          color="bg-red-50 text-red-600"
        />

        <SummaryCard
          title="Replenishment Required"
          value={summary.replenishmentRequired}
          subtitle="Products with recommended quantity"
          icon={ShoppingCart}
          color="bg-amber-50 text-amber-600"
        />

        <SummaryCard
          title="Recommended Units"
          value={recommendedUnits}
          subtitle="Combined suggested quantity"
          icon={Boxes}
          color="bg-violet-50 text-violet-600"
        />
      </div>

      {/* Risk overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Critical Risk",
            value: summary.criticalAlerts,
            style: "border-red-200 bg-red-50 text-red-700",
          },
          {
            label: "High Risk",
            value: summary.highRiskAlerts,
            style: "border-orange-200 bg-orange-50 text-orange-700",
          },
          {
            label: "Medium Risk",
            value: summary.mediumRiskAlerts,
            style: "border-amber-200 bg-amber-50 text-amber-700",
          },
          {
            label: "Increasing Demand",
            value: summary.increasingDemandProducts,
            style: "border-emerald-200 bg-emerald-50 text-emerald-700",
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-2xl border p-5 ${item.style}`}
          >
            <p className="text-sm font-semibold">{item.label}</p>
            <h3 className="mt-2 text-3xl font-bold">
              {number(item.value)}
            </h3>
          </div>
        ))}
      </div>

      {/* Analysis overview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <TrendingUp size={22} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">
                Demand Analysis
              </h2>
              <p className="text-sm text-slate-500">
                Average daily demand across analysed products
              </p>
            </div>
          </div>

          <h3 className="mt-5 text-3xl font-bold text-slate-900">
            {number(averageDemand)}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Average units per product per day
          </p>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            Demand trend compares the latest 30 days with the preceding
            30 days.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">
                Replenishment Overview
              </h2>
              <p className="text-sm text-slate-500">
                Suggested purchase quantities
              </p>
            </div>
          </div>

          <h3 className="mt-5 text-3xl font-bold text-slate-900">
            {number(recommendedUnits)} units
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Total recommended replenishment quantity
          </p>
          <button
            onClick={() => navigate("/replenishment")}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900"
          >
            View replenishment details
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Product Intelligence
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review product-level demand, stock risk and recommendations.
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
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-500 sm:w-64"
              />
            </div>

            <select
              value={riskFilter}
              onChange={(event) => setRiskFilter(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product cards */}
      {filteredInsights.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {filteredInsights.map((item) => (
            <div
              key={item.productId}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-slate-900">
                    {item.productName}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    SKU: {item.sku || "—"} · Product ID: {item.productId}
                  </p>
                </div>

                <RiskBadge level={item.riskLevel} />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric
                  label="Current Stock"
                  value={item.currentStock}
                />
                <Metric
                  label="Available"
                  value={item.availableStock}
                />
                <Metric
                  label="Avg. Daily Demand"
                  value={item.averageDailyDemand}
                />
                <Metric
                  label="Coverage Days"
                  value={
                    item.stockCoverageDays == null
                      ? "—"
                      : item.stockCoverageDays
                  }
                />
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-slate-500">
                    Demand trend
                  </p>
                  <div className="mt-1">
                    <TrendIndicator
                      trend={item.demandTrend}
                      change={item.demandChangePercent}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs text-slate-500">
                      Reorder Point
                    </p>
                    <p className="mt-1 font-bold text-slate-900">
                      {number(item.reorderPoint)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Recommended Qty
                    </p>
                    <p className="mt-1 font-bold text-violet-700">
                      {number(item.recommendedQuantity)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-700">
                  <Lightbulb size={16} className="text-amber-500" />
                  <p className="text-xs font-bold uppercase">
                    Recommendation
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.recommendation ||
                    "No recommendation available."}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={14} />
                  Lead time: {number(item.leadTimeDays)} days
                </div>

                <button
                  onClick={() => navigate("/replenishment")}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"
                >
                  View Replenishment
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center">
          <BrainCircuit size={40} className="mx-auto text-slate-300" />
          <h3 className="mt-3 font-semibold text-slate-700">
            No matching intelligence records
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Try another search term or risk filter.
          </p>
        </div>
      )}

      <p className="text-right text-xs text-slate-400">
        Showing {filteredInsights.length} of {insights.length} analysed products
      </p>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">
        {number(value)}
      </p>
    </div>
  );
}
