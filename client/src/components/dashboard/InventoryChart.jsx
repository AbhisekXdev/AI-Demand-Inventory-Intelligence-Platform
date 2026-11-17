
import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import {
  BarChart3,
  Boxes,
  TrendingUp,
  Package,
  Search,
  Maximize2,
} from "lucide-react";

export default function InventoryChart({ data = [] }) {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data
      .map((item) => ({
        name: String(item.name ?? "Unnamed Product"),
        quantity: Math.max(0, Number(item.quantity) || 0),
      }))
      .filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => b.quantity - a.quantity);
  }, [data, search]);

  const totalStock = chartData.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const averageStock = chartData.length
    ? Math.round(totalStock / chartData.length)
    : 0;

  const highestStock = chartData.length
    ? Math.max(...chartData.map((item) => item.quantity))
    : 0;

  const visibleData = showAll
    ? chartData
    : chartData.slice(0, 8);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    const quantity = Number(payload[0].value) || 0;

    return (
      <div className="min-w-[170px] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
        <p className="mb-3 max-w-48 truncate text-xs font-semibold text-slate-500">
          {label}
        </p>

        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
          <span className="text-xs text-slate-500">
            Current Stock
          </span>
        </div>

        <p className="mt-2 text-xl font-bold text-slate-900">
          {quantity.toLocaleString("en-IN")}
          <span className="ml-1 text-xs font-medium text-slate-400">
            units
          </span>
        </p>
      </div>
    );
  };

  const summaryCards = [
    {
      title: "Total Stock",
      value: totalStock.toLocaleString("en-IN"),
      icon: Boxes,
      color: "blue",
      description: "Units in displayed results",
    },
    {
      title: "Products",
      value: chartData.length,
      icon: Package,
      color: "violet",
      description: "Products in chart",
    },
    {
      title: "Average Stock",
      value: averageStock.toLocaleString("en-IN"),
      icon: TrendingUp,
      color: "emerald",
      description: "Units per product",
    },
    {
      title: "Highest Stock",
      value: highestStock.toLocaleString("en-IN"),
      icon: BarChart3,
      color: "orange",
      description: "Maximum product quantity",
    },
  ];

  const colorStyles = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <section className="inventory-chart space-y-5">

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="inventory-summary-card group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-500 sm:text-sm">
                  {card.title}
                </p>

                <div
                  className={`rounded-xl p-2.5 transition duration-300 group-hover:scale-110 ${colorStyles[card.color]}`}
                >
                  <Icon size={19} />
                </div>
              </div>

              <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {card.value}
              </h3>

              <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">
                {card.description}
              </p>

              <div className="absolute -bottom-8 -right-8 h-20 w-20 rounded-full bg-slate-50 opacity-0 transition group-hover:opacity-100" />
            </div>
          );
        })}
      </div>

      {/* MAIN CHART */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:shadow-lg">

        {/* HEADER */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-white to-indigo-50/40 p-5 sm:flex-row sm:items-center sm:p-6">

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 text-white shadow-md shadow-indigo-200">
              <BarChart3 size={24} />
            </div>

            <div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900">
                Inventory Overview
              </h3>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Current stock levels by product
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Inventory Data
            </span>

            <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
              {chartData.length} Products
            </span>
          </div>
        </div>

        {/* SEARCH AND CONTROLS */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

          <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50 sm:w-72">
            <Search size={16} className="shrink-0 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product..."
              className="w-full min-w-0 bg-transparent text-xs outline-none placeholder:text-slate-400"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-xs font-semibold text-indigo-600"
              >
                Clear
              </button>
            )}
          </div>

          {chartData.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAll((previous) => !previous)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <Maximize2 size={14} />
              {showAll ? "Show Top 8" : "Show All Products"}
            </button>
          )}
        </div>

        {/* CHART */}
        {chartData.length === 0 ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center px-5 text-center">
            <div className="rounded-2xl bg-slate-100 p-5 text-slate-400">
              <BarChart3 size={34} />
            </div>

            <h4 className="mt-4 text-sm font-bold text-slate-800">
              {data.length === 0
                ? "No inventory data available"
                : "No matching products"}
            </h4>

            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
              {data.length === 0
                ? "Product stock information will appear here when inventory data is available."
                : "Try searching with a different product name."}
            </p>
          </div>
        ) : (
          <>
            <div className="px-3 pb-3 pt-6 sm:px-6">
              <div className="mb-4 flex items-center justify-between px-2">
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    Stock Distribution
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Products sorted by stock quantity
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-semibold text-indigo-600">
                  <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
                  Stock Units
                </div>
              </div>

              <div className="h-[280px] w-full sm:h-[350px] lg:h-[390px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={visibleData}
                    margin={{
                      top: 15,
                      right: 12,
                      left: -15,
                      bottom: 8,
                    }}
                    barCategoryGap="25%"
                  >
                    <defs>
                      <linearGradient
                        id="inventoryBarGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#2563eb" />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="4 5"
                      vertical={false}
                      stroke="#e9edf5"
                    />

                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      height={55}
                      tickMargin={12}
                      tick={{
                        fontSize: 10,
                        fill: "#64748b",
                      }}
                      tickFormatter={(value) =>
                        value.length > 11
                          ? `${value.slice(0, 11)}...`
                          : value
                      }
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      width={48}
                      tick={{
                        fontSize: 10,
                        fill: "#94a3b8",
                      }}
                      tickFormatter={(value) =>
                        Number(value).toLocaleString("en-IN")
                      }
                    />

                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{
                        fill: "#eef2ff",
                        opacity: 0.55,
                      }}
                    />

                    <Bar
                      dataKey="quantity"
                      name="Stock"
                      radius={[7, 7, 0, 0]}
                      maxBarSize={48}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    >
                      {visibleData.map((item, index) => (
                        <Cell
                          key={`${item.name}-${index}`}
                          fill="url(#inventoryBarGradient)"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART FOOTER */}
            <div className="flex flex-col justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
              <p className="text-[11px] text-slate-500">
                Showing {visibleData.length} of {chartData.length} products
              </p>

              <p className="text-[11px] font-semibold text-slate-600">
                Total displayed stock:{" "}
                <span className="text-indigo-600">
                  {visibleData
                    .reduce((sum, item) => sum + item.quantity, 0)
                    .toLocaleString("en-IN")} units
                </span>
              </p>
            </div>
          </>
        )}
      </div>

      {/* ANIMATIONS */}
      <style>{`
        .inventory-chart {
          animation: inventoryChartEnter .5s ease-out both;
        }

        .inventory-summary-card {
          animation: inventoryCardEnter .45s ease-out both;
        }

        @keyframes inventoryChartEnter {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes inventoryCardEnter {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .inventory-chart,
          .inventory-summary-card {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}
