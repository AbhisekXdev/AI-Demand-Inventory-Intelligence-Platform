import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShoppingCart,
  Clock,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  XCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  SlidersHorizontal,
  Sparkles,
  CalendarDays,
  Gauge,
  ArrowRight,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { getReplenishmentInsights } from "../services/replenishmentService";

const PAGE_SIZE = 8;

const numberFormat = (value, digits = 0) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(
    Number(value) || 0,
  );

const riskStyles = {
  CRITICAL: "border-red-200 bg-red-50 text-red-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const trendStyles = {
  INCREASING: "bg-emerald-50 text-emerald-700",
  DECREASING: "bg-red-50 text-red-700",
  STABLE: "bg-slate-100 text-slate-600",
};

function StatCard({ title, value, subtitle, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    red: "bg-red-50 text-red-600 ring-red-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  };
  return (
    <article className="group relative min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 sm:text-sm">
            {title}
          </p>
          <p className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900 sm:mt-3 sm:text-3xl">
            {value}
          </p>
          <p className="mt-1.5 text-[11px] leading-4 text-slate-400 sm:text-xs">
            {subtitle}
          </p>
        </div>
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 sm:h-11 sm:w-11 ${tones[tone]}`}
        >
          <Icon size={20} />
        </span>
      </div>
      <div className="pointer-events-none absolute -bottom-7 -right-5 h-20 w-20 rounded-full bg-slate-50 opacity-0 transition group-hover:opacity-100" />
    </article>
  );
}

function RiskBadge({ risk }) {
  const value = risk || "LOW";
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide sm:text-[11px] ${riskStyles[value] || riskStyles.LOW}`}
    >
      {value === "CRITICAL" ? (
        <XCircle size={12} />
      ) : value === "LOW" ? (
        <CheckCircle2 size={12} />
      ) : (
        <AlertTriangle size={12} />
      )}
      {value}
    </span>
  );
}

function TrendBadge({ trend, percentage }) {
  const value = trend || "STABLE";
  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-semibold sm:text-xs ${trendStyles[value] || trendStyles.STABLE}`}
    >
      {value === "INCREASING" ? (
        <TrendingUp size={13} />
      ) : value === "DECREASING" ? (
        <TrendingDown size={13} />
      ) : (
        <Activity size={13} />
      )}
      {value}
      {percentage !== undefined && percentage !== null && (
        <span>({numberFormat(Math.abs(percentage), 1)}%)</span>
      )}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-center">
      <div className="h-11 w-11 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
      <p className="mt-4 text-sm font-semibold text-slate-700">
        Analyzing inventory...
      </p>
      <p className="mt-1 text-xs text-slate-400">
        Generating replenishment recommendations
      </p>
    </div>
  );
}

function Metric({ label, value, suffix }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
      <p className="text-[10px] font-medium text-slate-400 sm:text-[11px]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-bold text-slate-800 sm:text-base">
        {value}
        {suffix || ""}
      </p>
    </div>
  );
}

export default function Replenishment() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const loadInsights = useCallback(
    async (showLoader = true, showSuccess = false) => {
      try {
        if (showLoader) setLoading(true);
        else setRefreshing(true);
        const [response] = await Promise.all([
          getReplenishmentInsights(),
          new Promise((resolve) => setTimeout(resolve, 500)),
        ]);
        if (!response?.success || !Array.isArray(response.insights)) {
          throw new Error(response?.message || "Invalid intelligence response");
        }
        setInsights(response.insights);
        setSummary(response.summary || {});
        if (showSuccess) toast.success("Replenishment data refreshed");
      } catch (error) {
        console.error("Replenishment API Error:", error);
        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Unable to load replenishment data",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const filteredInsights = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    const priority = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
    return insights
      .filter((item) => {
        const matchesSearch = [
          item.productName,
          item.sku,
          item.recommendation,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(searchText),
        );
        return (
          matchesSearch &&
          (riskFilter === "ALL" || item.riskLevel === riskFilter)
        );
      })
      .sort(
        (a, b) => (priority[a.riskLevel] || 5) - (priority[b.riskLevel] || 5),
      );
  }, [insights, search, riskFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInsights.length / PAGE_SIZE),
  );
  const paginatedInsights = filteredInsights.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, riskFilter]);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const totalRecommendedUnits = useMemo(
    () =>
      insights.reduce(
        (total, item) => total + Number(item.recommendedQuantity || 0),
        0,
      ),
    [insights],
  );
  const increasingDemand = Number(summary.increasingDemandProducts || 0);
  const replenishmentRequired = Number(
    summary.replenishmentRequired ||
      insights.filter((item) => item.recommendedQuantity > 0).length,
  );

  return (
    <main className="mx-auto flex w-full max-w-[1700px] min-w-0 flex-col gap-5 p-3 sm:gap-6 sm:p-5 lg:p-7">
      {/* Page header */}
      <section className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-800 px-5 py-6 text-white shadow-xl shadow-blue-950/10 sm:rounded-3xl sm:px-7 sm:py-8 lg:px-9">
        <div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 -z-10 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100 sm:text-xs">
              <BrainCircuit size={15} /> AI inventory intelligence
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Forecast & Replenishment
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-blue-100/85 sm:text-sm">
              Understand demand signals, monitor stock risk, and prioritize
              replenishment decisions with product-level insights.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadInsights(false, true)}
            disabled={refreshing}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:text-sm"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing analysis..." : "Refresh analysis"}
          </button>
        </div>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-[10px] text-blue-100/75 sm:text-xs">
          <span className="inline-flex items-center gap-1.5">
            <Activity size={13} /> Inventory health monitoring
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={13} /> Risk-prioritized insights
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={13} /> Demand-led planning
          </span>
        </div>
      </section>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          {/* KPI overview */}
          <section className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4 sm:gap-4">
            <StatCard
              title="Products analyzed"
              value={numberFormat(summary.totalProducts ?? insights.length)}
              subtitle="Active products evaluated"
              icon={Package}
              tone="blue"
            />
            <StatCard
              title="Critical alerts"
              value={numberFormat(summary.criticalAlerts)}
              subtitle="Immediate attention required"
              icon={AlertTriangle}
              tone="red"
            />
            <StatCard
              title="Replenishment required"
              value={numberFormat(replenishmentRequired)}
              subtitle="Products requiring stock"
              icon={ShoppingCart}
              tone="amber"
            />
            <StatCard
              title="Recommended units"
              value={numberFormat(totalRecommendedUnits)}
              subtitle="Combined suggested quantity"
              icon={Boxes}
              tone="emerald"
            />
          </section>

          {/* Risk overview */}
          <section className="grid grid-cols-1 gap-3 md:grid-cols-3 sm:gap-4">
            <RiskSummary
              title="Critical risk"
              value={summary.criticalAlerts}
              description="Stock unavailable or missing inventory"
              icon={XCircle}
              tone="red"
            />
            <RiskSummary
              title="High risk"
              value={summary.highRiskAlerts}
              description="Stock may run out before lead time"
              icon={AlertTriangle}
              tone="orange"
            />
            <RiskSummary
              title="Medium risk"
              value={summary.mediumRiskAlerts}
              description="Products at reorder point"
              icon={Clock}
              tone="amber"
            />
          </section>

          {/* Intelligence panels */}
          <section className="grid grid-cols-1 gap-3 lg:grid-cols-2 sm:gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Demand trend analysis
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-xs">
                    Latest 30 days compared with the previous 30 days
                  </p>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp size={20} />
                </span>
              </div>
              <div className="mt-5 flex flex-wrap items-end justify-between gap-3 rounded-xl bg-slate-50 p-4">
                <div>
                  <p className="text-xs text-slate-500">
                    Increasing demand products
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                    {numberFormat(increasingDemand)}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-2 text-[11px] font-bold text-emerald-700">
                  <TrendingUp size={14} /> Increasing
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Replenishment overview
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-xs">
                    Recommended stock quantities across products
                  </p>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <ShoppingCart size={20} />
                </span>
              </div>
              <div className="mt-5 flex flex-wrap items-end justify-between gap-3 rounded-xl bg-slate-50 p-4">
                <div>
                  <p className="text-xs text-slate-500">
                    Total recommended units
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                    {numberFormat(totalRecommendedUnits)}
                  </p>
                </div>
                <span className="rounded-lg bg-blue-100 px-3 py-2 text-[11px] font-bold text-blue-700">
                  {numberFormat(replenishmentRequired)} products
                </span>
              </div>
            </div>
          </section>

          {/* Recommendation list */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600">
                  <Sparkles size={13} /> Action center
                </div>
                <h2 className="mt-1 text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                  Product replenishment recommendations
                </h2>
                <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
                  AI-assisted, product-wise stock recommendations
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                <label className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400 transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 sm:w-64 sm:flex-none">
                  <Search size={16} className="shrink-0" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search product or SKU..."
                    className="w-full min-w-0 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      className="text-slate-400 hover:text-slate-700"
                    >
                      ×
                    </button>
                  )}
                </label>
                <label className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-500 focus-within:border-blue-400 sm:w-44">
                  <SlidersHorizontal size={15} className="shrink-0" />
                  <select
                    value={riskFilter}
                    onChange={(event) => setRiskFilter(event.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-slate-700 outline-none"
                  >
                    <option value="ALL">All risk levels</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </label>
              </div>
            </div>

            {filteredInsights.length === 0 ? (
              <div className="flex min-h-[250px] flex-col items-center justify-center px-5 py-12 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                  <Package size={26} />
                </span>
                <h3 className="mt-4 text-sm font-bold text-slate-800">
                  No recommendations found
                </h3>
                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                  Try changing your search term or selecting a different risk
                  level.
                </p>
                {(search || riskFilter !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setRiskFilter("ALL");
                    }}
                    className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop / tablet table */}
                <div className="hidden overflow-x-auto xl:block">
                  <table className="w-full min-w-[1120px] text-left text-xs">
                    <thead className="bg-slate-50/90 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      <tr>
                        {[
                          "Product",
                          "Current stock",
                          "Available",
                          "Avg. demand / day",
                          "Coverage",
                          "Reorder point",
                          "Recommended",
                          "Trend",
                          "Risk",
                          "",
                        ].map((label, index) => (
                          <th
                            key={index}
                            className="whitespace-nowrap px-4 py-3.5 first:pl-5 last:pr-5"
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedInsights.map((item) => (
                        <tr
                          key={item.productId}
                          className="transition hover:bg-blue-50/30"
                        >
                          <td className="px-5 py-4">
                            <ProductIdentity item={item} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-700">
                            {numberFormat(item.currentStock)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-700">
                            {numberFormat(item.availableStock)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                            {numberFormat(item.averageDailyDemand, 2)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-600">
                            {item.stockCoverageDays == null
                              ? "—"
                              : `${numberFormat(item.stockCoverageDays, 1)} days`}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                            {numberFormat(item.reorderPoint)}
                          </td>
                          <td className="px-4 py-4">
                            <RecommendedQuantity
                              value={item.recommendedQuantity}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <TrendBadge
                              trend={item.demandTrend}
                              percentage={item.demandChangePercent}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <RiskBadge risk={item.riskLevel} />
                          </td>
                          <td className="px-5 py-4 text-right">
                            <OrderButton item={item} navigate={navigate} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Compact tablet layout */}
                <div className="hidden md:grid md:grid-cols-2 md:gap-3 md:p-4 xl:hidden">
                  {paginatedInsights.map((item) => (
                    <RecommendationCard
                      key={item.productId}
                      item={item}
                      navigate={navigate}
                    />
                  ))}
                </div>

                {/* Mobile layout */}
                <div className="grid grid-cols-1 gap-3 p-3 md:hidden">
                  {paginatedInsights.map((item) => (
                    <RecommendationCard
                      key={item.productId}
                      item={item}
                      navigate={navigate}
                    />
                  ))}
                </div>

                <footer className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <p className="text-[11px] text-slate-400">
                    Showing{" "}
                    <strong className="text-slate-600">
                      {filteredInsights.length
                        ? (currentPage - 1) * PAGE_SIZE + 1
                        : 0}
                      –
                      {Math.min(
                        currentPage * PAGE_SIZE,
                        filteredInsights.length,
                      )}
                    </strong>{" "}
                    of {filteredInsights.length} products
                  </p>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                      className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={17} />
                    </button>
                    <span className="text-xs text-slate-500">
                      Page{" "}
                      <strong className="text-slate-800">{currentPage}</strong>{" "}
                      of{" "}
                      <strong className="text-slate-800">{totalPages}</strong>
                    </span>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((page) => Math.min(totalPages, page + 1))
                      }
                      className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="Next page"
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </footer>
              </>
            )}
          </section>

          {/* Methodology note */}
          <section className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
                <BrainCircuit size={20} />
              </span>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-slate-800 sm:text-sm">
                  How replenishment recommendations work
                </h3>
                <p className="mt-1 text-[11px] leading-5 text-slate-600 sm:text-xs">
                  Recommendations use the latest 30 days of demand, average
                  daily demand, supplier lead time, available stock, and reorder
                  level. The backend calculates the reorder point and
                  recommended purchase quantity.
                </p>
                <p className="mt-2 text-[10px] font-semibold text-blue-700 sm:text-[11px]">
                  These are rule-based inventory intelligence calculations, not
                  a trained machine-learning model.
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function ProductIdentity({ item }) {
  return (
    <div className="flex min-w-[175px] items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
        <Package size={17} />
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <strong className="max-w-[190px] truncate text-xs font-bold text-slate-800">
          {item.productName}
        </strong>
        <small className="text-[10px] text-slate-400">
          SKU: {item.sku || "—"}
        </small>
      </span>
    </div>
  );
}

function RecommendedQuantity({ value }) {
  const quantity = Number(value || 0);
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${quantity > 0 ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}
    >
      {numberFormat(quantity)} units
    </span>
  );
}

function OrderButton({ item, navigate }) {
  const disabled = Number(item.recommendedQuantity) <= 0;
  return (
    <button
      type="button"
      onClick={() => navigate("/purchase-orders")}
      disabled={disabled}
      title="Go to Purchase Orders"
      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
    >
      <ShoppingCart size={13} /> Create order <ArrowRight size={12} />
    </button>
  );
}

function RecommendationCard({ item, navigate }) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <ProductIdentity item={item} />
        </div>
        <RiskBadge risk={item.riskLevel} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Metric label="Current stock" value={numberFormat(item.currentStock)} />
        <Metric
          label="Available stock"
          value={numberFormat(item.availableStock)}
        />
        <Metric
          label="Avg. demand / day"
          value={numberFormat(item.averageDailyDemand, 2)}
        />
        <Metric
          label="Stock coverage"
          value={
            item.stockCoverageDays == null
              ? "—"
              : numberFormat(item.stockCoverageDays, 1)
          }
          suffix={item.stockCoverageDays == null ? "" : " days"}
        />
        <Metric label="Reorder point" value={numberFormat(item.reorderPoint)} />
        <div className="min-w-0 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
          <p className="text-[10px] font-medium text-blue-500">Recommended</p>
          <p className="mt-1 break-words text-sm font-bold text-blue-800">
            {numberFormat(item.recommendedQuantity)} units
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <TrendBadge
          trend={item.demandTrend}
          percentage={item.demandChangePercent}
        />
        <OrderButton item={item} navigate={navigate} />
      </div>
    </article>
  );
}

function RiskSummary({ title, value, description, icon: Icon, tone }) {
  const tones = {
    red: {
      border: "border-red-100",
      icon: "bg-red-50 text-red-600",
      label: "text-red-600",
    },
    orange: {
      border: "border-orange-100",
      icon: "bg-orange-50 text-orange-600",
      label: "text-orange-600",
    },
    amber: {
      border: "border-amber-100",
      icon: "bg-amber-50 text-amber-600",
      label: "text-amber-600",
    },
  };
  const style = tones[tone];
  return (
    <article
      className={`flex min-w-0 items-center justify-between gap-3 rounded-2xl border ${style.border} bg-white p-4 shadow-sm sm:p-5`}
    >
      <div className="min-w-0">
        <p
          className={`text-[10px] font-bold uppercase tracking-[0.12em] ${style.label}`}
        >
          {title}
        </p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {numberFormat(value)}
        </p>
        <p className="mt-1 text-[10px] leading-4 text-slate-400 sm:text-xs">
          {description}
        </p>
      </div>
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${style.icon}`}
      >
        <Icon size={21} />
      </span>
    </article>
  );
}
