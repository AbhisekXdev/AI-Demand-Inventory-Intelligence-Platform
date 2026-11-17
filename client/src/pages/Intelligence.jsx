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
  Activity,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { getInventoryIntelligence } from "../services/intelligenceService";

/* =========================
   FORMATTERS
========================= */

const number = (value) =>
  Number(value ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const riskStyles = {
  CRITICAL: "bg-red-50 text-red-700 border-red-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const riskOrder = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
};

/* =========================
   REUSABLE COMPONENTS
========================= */

function RiskBadge({ level }) {
  const risk = String(level || "LOW").toUpperCase();

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wide ${
        riskStyles[risk] || riskStyles.LOW
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          risk === "CRITICAL"
            ? "bg-red-500"
            : risk === "HIGH"
              ? "bg-orange-500"
              : risk === "MEDIUM"
                ? "bg-amber-500"
                : "bg-emerald-500"
        }`}
      />
      {risk}
    </span>
  );
}

function TrendIndicator({ trend, change }) {
  const value = String(trend || "STABLE").toUpperCase();

  if (value === "INCREASING") {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5 text-sm font-semibold text-emerald-600">
        <TrendingUp size={16} />
        Increasing ({number(change)}%)
      </span>
    );
  }

  if (value === "DECREASING") {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5 text-sm font-semibold text-red-600">
        <TrendingDown size={16} />
        Decreasing ({number(change)}%)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500">
      <Minus size={16} />
      Stable
    </span>
  );
}

function SummaryCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-slate-50 transition-transform duration-300 group-hover:scale-150" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <h3 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-900">
            {number(value)}
          </h3>

          <p className="mt-1.5 text-xs leading-5 text-slate-500">{subtitle}</p>
        </div>

        <div className={`shrink-0 rounded-2xl p-3 ${color}`}>
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, accent = "text-slate-900" }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 transition hover:border-violet-100 hover:bg-violet-50/40">
      <p className="text-[11px] font-medium leading-4 text-slate-500 sm:text-xs">
        {label}
      </p>

      <p className={`mt-1.5 break-words text-lg font-bold ${accent}`}>
        {number(value)}
      </p>
    </div>
  );
}

function RiskOverviewCard({ label, value, style, icon: Icon }) {
  return (
    <div
      className={`rounded-2xl border p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${style}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <h3 className="mt-2 text-2xl font-bold sm:text-3xl">
            {number(value)}
          </h3>
        </div>

        <div className="rounded-xl bg-white/70 p-3">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

/* =========================
   MAIN COMPONENT
========================= */

export default function Intelligence() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState({});
  const [insights, setInsights] = useState([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* =========================
     LOAD INTELLIGENCE
  ========================= */

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
          response?.message || "Unable to load intelligence insights",
        );
      }

      setSummary(response.summary ?? {});

      setInsights(Array.isArray(response.insights) ? response.insights : []);

      if (isRefresh) {
        toast.success("Intelligence insights refreshed");
      }
    } catch (error) {
      console.error("Intelligence Error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load intelligence insights",
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

  /* =========================
     FILTER AND SORT
  ========================= */

  const filteredInsights = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...insights]
      .filter((item) => {
        const matchesSearch =
          !query ||
          String(item.productName ?? "")
            .toLowerCase()
            .includes(query) ||
          String(item.sku ?? "")
            .toLowerCase()
            .includes(query) ||
          String(item.recommendation ?? "")
            .toLowerCase()
            .includes(query);

        const matchesRisk =
          riskFilter === "ALL" ||
          String(item.riskLevel).toUpperCase() === riskFilter;

        return matchesSearch && matchesRisk;
      })
      .sort(
        (a, b) =>
          (riskOrder[String(a.riskLevel).toUpperCase()] ?? 5) -
          (riskOrder[String(b.riskLevel).toUpperCase()] ?? 5),
      );
  }, [insights, search, riskFilter]);

  /* =========================
     CALCULATIONS
  ========================= */

  const recommendedUnits = useMemo(
    () =>
      insights.reduce(
        (total, item) => total + Number(item.recommendedQuantity ?? 0),
        0,
      ),
    [insights],
  );

  const averageDemand = useMemo(() => {
    if (!insights.length) return 0;

    return (
      insights.reduce(
        (total, item) => total + Number(item.averageDailyDemand ?? 0),
        0,
      ) / insights.length
    );
  }, [insights]);

  /* =========================
     LOADING SCREEN
  ========================= */

  if (loading) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600" />
          <BrainCircuit
            size={22}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-violet-600"
          />
        </div>

        <div className="text-center">
          <p className="font-semibold text-slate-800">
            Analysing demand and inventory...
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Preparing product intelligence
          </p>
        </div>
      </div>
    );
  }

  /* =========================
     DASHBOARD UI
  ========================= */

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/60 pb-8">
      {/* ================= HEADER ================= */}

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-violet-950 to-indigo-900 p-5 text-white shadow-xl sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[35px] border-white/5" />
        <div className="pointer-events-none absolute -bottom-28 right-1/4 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-3 shadow-lg backdrop-blur">
                <BrainCircuit size={27} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200 sm:text-xs">
                    AI Demand Intelligence
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Active
                  </span>
                </div>

                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  Inventory Intelligence
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-violet-100/80 sm:text-base">
              Understand demand trends, identify stock risks and make smarter
              replenishment decisions with product-level insights.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-violet-200/80">
              <span className="inline-flex items-center gap-1.5">
                <Activity size={14} />
                Demand analysis
              </span>

              <span className="h-1 w-1 rounded-full bg-violet-300/60" />

              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} />
                Stock risk monitoring
              </span>

              <span className="h-1 w-1 rounded-full bg-violet-300/60" />

              <span className="inline-flex items-center gap-1.5">
                <ShoppingCart size={14} />
                Replenishment insights
              </span>
            </div>
          </div>

          <button
            onClick={() => loadInsights(true)}
            disabled={refreshing}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white px-5 py-3 text-sm font-bold text-violet-950 shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />

            {refreshing ? "Analysing..." : "Refresh Insights"}
          </button>
        </div>
      </section>

      {/* ================= METHODOLOGY NOTICE ================= */}

      <section className="flex gap-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-white p-4 sm:p-5">
        <div className="h-fit shrink-0 rounded-xl bg-violet-100 p-2.5 text-violet-700">
          <Lightbulb size={21} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold text-violet-950">
              Inventory Intelligence Engine
            </h2>

            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
              Methodology
            </span>
          </div>

          <p className="mt-1.5 text-xs leading-6 text-violet-800 sm:text-sm">
            Recommendations are currently generated from demand history, stock
            availability, reorder levels and supplier lead time using backend
            rule-based calculations. A trained ML forecasting model is not yet
            connected.
          </p>
        </div>
      </section>

      {/* ================= KPI CARDS ================= */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
      </section>

      {/* ================= RISK OVERVIEW ================= */}

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Risk Overview</h2>
            <p className="mt-1 text-xs text-slate-500">
              Current inventory risk distribution
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {number(insights.length)} Products
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <RiskOverviewCard
            label="Critical Risk"
            value={summary.criticalAlerts}
            style="border-red-200 bg-gradient-to-br from-red-50 to-white text-red-700"
            icon={AlertTriangle}
          />

          <RiskOverviewCard
            label="High Risk"
            value={summary.highRiskAlerts}
            style="border-orange-200 bg-gradient-to-br from-orange-50 to-white text-orange-700"
            icon={TrendingUp}
          />

          <RiskOverviewCard
            label="Medium Risk"
            value={summary.mediumRiskAlerts}
            style="border-amber-200 bg-gradient-to-br from-amber-50 to-white text-amber-700"
            icon={Activity}
          />

          <RiskOverviewCard
            label="Increasing Demand"
            value={summary.increasingDemandProducts}
            style="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white text-emerald-700"
            icon={TrendingUp}
          />
        </div>
      </section>

      {/* ================= ANALYSIS OVERVIEW ================= */}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* DEMAND ANALYSIS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <TrendingUp size={22} />
            </div>

            <div className="min-w-0">
              <h2 className="font-bold text-slate-900">Demand Analysis</h2>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Average daily demand across analysed products
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {number(averageDemand)}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Average units per product per day
            </p>
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-blue-50/70 p-3">
            <Activity size={15} className="mt-0.5 shrink-0 text-blue-600" />

            <p className="text-xs leading-5 text-blue-800">
              Demand trend compares the latest 30 days with the preceding 30
              days.
            </p>
          </div>
        </div>

        {/* REPLENISHMENT OVERVIEW */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <ShieldCheck size={22} />
            </div>

            <div className="min-w-0">
              <h2 className="font-bold text-slate-900">
                Replenishment Overview
              </h2>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Suggested purchase quantities
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {number(recommendedUnits)}
              <span className="ml-2 text-base font-semibold text-slate-400">
                units
              </span>
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Total recommended replenishment quantity
            </p>
          </div>

          <button
            onClick={() => navigate("/replenishment")}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-50 px-4 py-3 text-sm font-bold text-violet-700 transition hover:bg-violet-100 sm:w-auto"
          >
            View Replenishment Details
            <ArrowUpRight size={16} />
          </button>
        </div>
      </section>

      {/* ================= PRODUCT INTELLIGENCE ================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* SECTION HEADER */}

        <div className="border-b border-slate-100 p-4 sm:p-6">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-xl bg-violet-100 p-2 text-violet-700">
                  <Sparkles size={19} />
                </div>

                <h2 className="text-lg font-bold text-slate-900">
                  Product Intelligence
                </h2>

                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
                  {filteredInsights.length} Results
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
                Review product-level demand, stock risk and recommendations.
              </p>
            </div>

            {/* SEARCH AND FILTER */}

            <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
              <div className="relative min-w-0 flex-1 sm:min-w-[240px]">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search product or SKU..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                />
              </div>

              <select
                value={riskFilter}
                onChange={(event) => setRiskFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 sm:w-auto"
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

        {/* PRODUCT CARDS */}

        <div className="bg-slate-50/50 p-3 sm:p-5">
          {filteredInsights.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
              {filteredInsights.map((item) => (
                <article
                  key={item.productId}
                  className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg sm:p-5"
                >
                  {/* PRODUCT INFORMATION */}

                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="shrink-0 rounded-xl bg-violet-50 p-3 text-violet-700 transition group-hover:bg-violet-100">
                        <Package size={21} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="break-words text-base font-bold text-slate-900 sm:text-lg">
                          {item.productName}
                        </h3>

                        <p className="mt-1 break-all text-xs text-slate-500">
                          SKU: {item.sku || "—"}
                          <span className="mx-1.5 text-slate-300">·</span>
                          ID: {item.productId}
                        </p>
                      </div>
                    </div>

                    <RiskBadge level={item.riskLevel} />
                  </div>

                  {/* PRODUCT METRICS */}

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Metric label="Current Stock" value={item.currentStock} />

                    <Metric
                      label="Available"
                      value={item.availableStock}
                      accent="text-blue-700"
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

                  {/* DEMAND AND REORDER DETAILS */}

                  <div className="mt-5 grid grid-cols-1 gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500">
                        Demand Trend
                      </p>

                      <div className="mt-2">
                        <TrendIndicator
                          trend={item.demandTrend}
                          change={item.demandChangePercent}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Reorder Point</p>

                        <p className="mt-1.5 text-lg font-bold text-slate-900">
                          {number(item.reorderPoint)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Recommended Qty
                        </p>

                        <p className="mt-1.5 text-lg font-bold text-violet-700">
                          {number(item.recommendedQuantity)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* RECOMMENDATION */}

                  <div className="mt-4 rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50/80 to-white p-4">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-amber-100 p-1.5 text-amber-700">
                        <Lightbulb size={15} />
                      </div>

                      <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
                        Recommendation
                      </p>
                    </div>

                    <p className="mt-2 break-words text-sm leading-6 text-slate-700">
                      {item.recommendation || "No recommendation available."}
                    </p>
                  </div>

                  {/* CARD FOOTER */}

                  <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Clock size={15} className="text-slate-400" />
                      Lead time:
                      <span className="font-bold text-slate-800">
                        {number(item.leadTimeDays)} days
                      </span>
                    </div>

                    <button
                      onClick={() => navigate("/replenishment")}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700 hover:shadow-md sm:w-auto"
                    >
                      View Replenishment
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            /* EMPTY STATE */

            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-500">
                <BrainCircuit size={32} />
              </div>

              <h3 className="mt-4 text-base font-bold text-slate-800">
                No matching intelligence records
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                No products match your current search or risk filter. Try
                changing your search term or selecting another risk level.
              </p>

              {(search || riskFilter !== "ALL") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setRiskFilter("ALL");
                  }}
                  className="mt-5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}

        <div className="flex flex-col justify-between gap-2 border-t border-slate-100 bg-white px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-6">
          <span>
            Showing{" "}
            <strong className="text-slate-800">
              {filteredInsights.length}
            </strong>{" "}
            of <strong className="text-slate-800">{insights.length}</strong>{" "}
            analysed products
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Activity size={13} className="text-emerald-500" />
            Intelligence data
          </span>
        </div>
      </section>
    </div>
  );
}
