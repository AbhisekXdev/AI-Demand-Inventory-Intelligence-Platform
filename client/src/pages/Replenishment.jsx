
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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
} from "lucide-react";

import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import { getReplenishmentInsights } from "../services/replenishmentService";

const PAGE_SIZE = 8;

const numberFormat = (value, digits = 0) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
  }).format(Number(value) || 0);

const riskStyles = {
  CRITICAL: "bg-red-50 text-red-700 border-red-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const trendStyles = {
  INCREASING: "text-emerald-600 bg-emerald-50",
  DECREASING: "text-red-600 bg-red-50",
  STABLE: "text-slate-600 bg-slate-100",
};

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </h3>

          <p className="mt-2 text-xs text-slate-500">
            {subtitle}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${iconBg} ${iconColor}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function RiskBadge({ risk }) {
  const value = risk || "LOW";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${riskStyles[value] || riskStyles.LOW}`}
    >
      {value === "CRITICAL" ? (
        <XCircle size={13} />
      ) : value === "LOW" ? (
        <CheckCircle2 size={13} />
      ) : (
        <AlertTriangle size={13} />
      )}

      {value}
    </span>
  );
}

function TrendBadge({ trend, percentage }) {
  const value = trend || "STABLE";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${trendStyles[value] || trendStyles.STABLE}`}
    >
      {value === "INCREASING" ? (
        <TrendingUp size={14} />
      ) : value === "DECREASING" ? (
        <TrendingDown size={14} />
      ) : (
        <Activity size={14} />
      )}

      {value}

      {percentage !== undefined && percentage !== null && (
        <span>
          ({numberFormat(Math.abs(percentage), 1)}%)
        </span>
      )}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white">
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

export default function Replenishment() {
  const navigate = useNavigate();

  const [insights, setInsights] = useState([]);
  const [summary, setSummary] = useState({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // ==========================================
  // Load Intelligence Data
  // ==========================================

  const loadInsights = useCallback(
    async (showLoader = true, showSuccess = false) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const [response] = await Promise.all([
          getReplenishmentInsights(),
          new Promise((resolve) => setTimeout(resolve, 700)),
        ]);

        if (!response?.success || !Array.isArray(response.insights)) {
          throw new Error(
            response?.message || "Invalid intelligence response"
          );
        }

        setInsights(response.insights);
        setSummary(response.summary || {});

        if (showSuccess) {
          toast.success("Replenishment data refreshed");
        }
      } catch (error) {
        console.error("Replenishment API Error:", error);

        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Unable to load replenishment data"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  // ==========================================
  // Search and Risk Filter
  // ==========================================

  const filteredInsights = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return insights
      .filter((item) => {
        const matchesSearch = [
          item.productName,
          item.sku,
          item.recommendation,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(searchText)
        );

        const matchesRisk =
          riskFilter === "ALL" ||
          item.riskLevel === riskFilter;

        return matchesSearch && matchesRisk;
      })
      .sort((a, b) => {
        const priority = {
          CRITICAL: 1,
          HIGH: 2,
          MEDIUM: 3,
          LOW: 4,
        };

        return (
          (priority[a.riskLevel] || 5) -
          (priority[b.riskLevel] || 5)
        );
      });
  }, [insights, search, riskFilter]);

  // ==========================================
  // Pagination
  // ==========================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInsights.length / PAGE_SIZE)
  );

  const paginatedInsights = filteredInsights.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, riskFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // ==========================================
  // Derived Metrics
  // ==========================================

  const totalRecommendedUnits = useMemo(
    () =>
      insights.reduce(
        (total, item) =>
          total + Number(item.recommendedQuantity || 0),
        0
      ),
    [insights]
  );

  const increasingDemand = Number(
    summary.increasingDemandProducts || 0
  );

  const replenishmentRequired = Number(
    summary.replenishmentRequired ||
      insights.filter((item) => item.recommendedQuantity > 0).length
  );

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="space-y-6">

      {/* Page Introduction */}

      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-700 via-blue-700 to-blue-600 p-5 text-white shadow-lg shadow-blue-200 sm:flex-row sm:items-center sm:p-7">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <BrainCircuit size={19} />

            <span className="text-xs font-bold uppercase tracking-[0.15em] text-blue-100">
              AI Inventory Intelligence
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Forecast & Replenishment
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-100">
            Monitor demand trends, predict stock requirements,
            and identify products that need replenishment.
          </p>
        </div>

        <button
          onClick={() => loadInsights(false, true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60 sm:self-center"
        >
          <RefreshCw
            size={17}
            className={refreshing ? "animate-spin" : ""}
          />

          {refreshing ? "Refreshing..." : "Refresh Analysis"}
        </button>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          {/* KPI Cards */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Products Analyzed"
              value={numberFormat(summary.totalProducts ?? insights.length)}
              subtitle="Active products"
              icon={Package}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />

            <StatCard
              title="Critical Alerts"
              value={numberFormat(summary.criticalAlerts)}
              subtitle="Immediate attention required"
              icon={AlertTriangle}
              iconBg="bg-red-50"
              iconColor="text-red-600"
            />

            <StatCard
              title="Replenishment Required"
              value={numberFormat(replenishmentRequired)}
              subtitle="Products requiring stock"
              icon={ShoppingCart}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />

            <StatCard
              title="Recommended Units"
              value={numberFormat(totalRecommendedUnits)}
              subtitle="Combined recommended quantity"
              icon={Boxes}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
          </div>

          {/* Risk Summary */}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
                  Critical Risk
                </p>

                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {numberFormat(summary.criticalAlerts)}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Stock unavailable or missing inventory
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                <XCircle size={23} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
                  High Risk
                </p>

                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {numberFormat(summary.highRiskAlerts)}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Stock may run out before lead time
                </p>
              </div>

              <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                <AlertTriangle size={23} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                  Medium Risk
                </p>

                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {numberFormat(summary.mediumRiskAlerts)}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Products at reorder point
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <Clock size={23} />
              </div>
            </div>
          </div>

          {/* Demand Intelligence */}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Demand Trend Analysis
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Comparison of the latest 30 days with the previous 30 days
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                  <TrendingUp size={21} />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div>
                  <p className="text-xs text-slate-500">
                    Increasing Demand Products
                  </p>

                  <h3 className="mt-1 text-2xl font-bold text-slate-900">
                    {numberFormat(increasingDemand)}
                  </h3>
                </div>

                <span className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700">
                  Increasing
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Replenishment Overview
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Recommended stock quantities across products
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <ShoppingCart size={21} />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div>
                  <p className="text-xs text-slate-500">
                    Total Recommended Units
                  </p>

                  <h3 className="mt-1 text-2xl font-bold text-slate-900">
                    {numberFormat(totalRecommendedUnits)}
                  </h3>
                </div>

                <span className="rounded-lg bg-blue-100 px-3 py-2 text-xs font-bold text-blue-700">
                  {numberFormat(replenishmentRequired)} Products
                </span>
              </div>
            </div>
          </div>

          {/* Recommendations Table */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* Table Header */}

            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Product Replenishment Recommendations
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  AI-generated product-wise stock recommendations
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">

                {/* Search */}

                <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50">
                  <Search size={17} className="text-slate-400" />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search product or SKU..."
                    className="w-full text-sm outline-none sm:w-52"
                  />
                </div>

                {/* Risk Filter */}

                <select
                  value={riskFilter}
                  onChange={(event) => setRiskFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-400"
                >
                  <option value="ALL">All Risk Levels</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            {/* Table */}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left text-sm">

                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Product</th>
                    <th className="px-4 py-4">Current Stock</th>
                    <th className="px-4 py-4">Available</th>
                    <th className="px-4 py-4">Avg. Demand / Day</th>
                    <th className="px-4 py-4">Coverage</th>
                    <th className="px-4 py-4">Reorder Point</th>
                    <th className="px-4 py-4">Recommended</th>
                    <th className="px-4 py-4">Demand Trend</th>
                    <th className="px-4 py-4">Risk</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {paginatedInsights.map((item) => (
                    <tr
                      key={item.productId}
                      className="transition hover:bg-slate-50/80"
                    >
                      {/* Product */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Package size={19} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {item.productName}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              SKU: {item.sku || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Current Stock */}

                      <td className="px-4 py-4 font-semibold text-slate-800">
                        {numberFormat(item.currentStock)}
                      </td>

                      {/* Available */}

                      <td className="px-4 py-4 font-semibold text-slate-800">
                        {numberFormat(item.availableStock)}
                      </td>

                      {/* Average Demand */}

                      <td className="px-4 py-4 text-slate-700">
                        {numberFormat(item.averageDailyDemand, 2)}
                      </td>

                      {/* Coverage */}

                      <td className="px-4 py-4">
                        <span className="font-semibold text-slate-700">
                          {item.stockCoverageDays === null ||
                          item.stockCoverageDays === undefined
                            ? "—"
                            : `${numberFormat(item.stockCoverageDays, 1)} days`}
                        </span>
                      </td>

                      {/* Reorder Point */}

                      <td className="px-4 py-4 font-medium text-slate-700">
                        {numberFormat(item.reorderPoint)}
                      </td>

                      {/* Recommended Quantity */}

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-lg px-3 py-1.5 font-bold ${
                            Number(item.recommendedQuantity) > 0
                              ? "bg-blue-50 text-blue-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {numberFormat(item.recommendedQuantity)} Units
                        </span>
                      </td>

                      {/* Demand Trend */}

                      <td className="px-4 py-4">
                        <TrendBadge
                          trend={item.demandTrend}
                          percentage={item.demandChangePercent}
                        />
                      </td>

                      {/* Risk */}

                      <td className="px-4 py-4">
                        <RiskBadge risk={item.riskLevel} />
                      </td>

                      {/* Action */}

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => navigate("/purchase-orders")}
                          disabled={Number(item.recommendedQuantity) <= 0}
                          title="Go to Purchase Orders"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                        >
                          <ShoppingCart size={14} />
                          Order
                        </button>
                      </td>
                    </tr>
                  ))}

                  {paginatedInsights.length === 0 && (
                    <tr>
                      <td
                        colSpan="10"
                        className="px-5 py-16 text-center"
                      >
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <Package size={27} />
                        </div>

                        <h4 className="mt-4 font-semibold text-slate-800">
                          No recommendations found
                        </h4>

                        <p className="mt-1 text-xs text-slate-500">
                          Try changing your search or risk filter.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}

            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">
              <p className="text-xs text-slate-500">
                Showing{" "}
                {filteredInsights.length
                  ? (currentPage - 1) * PAGE_SIZE + 1
                  : 0}{" "}
                to{" "}
                {Math.min(
                  currentPage * PAGE_SIZE,
                  filteredInsights.length
                )}{" "}
                of {filteredInsights.length} products
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => page - 1)
                  }
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                </button>

                <span className="px-3 text-xs font-semibold text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) => page + 1)
                  }
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </div>

          {/* Recommendation Explanation */}

          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white p-2.5 text-blue-600 shadow-sm">
                <BrainCircuit size={21} />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  How replenishment recommendations work
                </h4>

                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Recommendations use the latest 30 days of demand,
                  average daily demand, supplier lead time, available
                  stock, and reorder level. The backend calculates
                  reorder point and recommended purchase quantity.
                </p>

                <p className="mt-2 text-[11px] font-medium text-blue-700">
                  These are rule-based inventory intelligence
                  calculations, not a trained machine-learning model.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
