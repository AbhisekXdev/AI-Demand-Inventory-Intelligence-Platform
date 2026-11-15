
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function InventoryChart({ data = [] }) {
  const chartData = Array.isArray(data) ? data : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
        <p className="mb-1 max-w-48 truncate text-xs font-semibold text-slate-700">
          {label}
        </p>
        <p className="text-sm font-bold text-blue-600">
          {Number(payload[0].value ?? 0).toLocaleString("en-IN")} units
        </p>
      </div>
    );
  };

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800">
          Inventory Overview
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Current stock levels by product
        </p>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <div className="rounded-full bg-slate-100 p-4 text-slate-400">
            <BarChart size={28} />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-600">
            No inventory chart data
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Product stock information will appear here.
          </p>
        </div>
      ) : (
        <div className="h-64 w-full sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 8, left: -20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />

              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                tickFormatter={(value) =>
                  value?.length > 12
                    ? `${value.slice(0, 12)}...`
                    : value
                }
              />

              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />

              <Tooltip content={<CustomTooltip />} />

              <Bar
                dataKey="quantity"
                name="Stock"
                fill="#2563eb"
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
