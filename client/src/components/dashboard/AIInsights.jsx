import { useMemo, useState } from "react";
import {
  BrainCircuit,
  Sparkles,
  Search,
  Filter,
  Package,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
  Lightbulb,
} from "lucide-react";

const getRiskStyle = (risk) => {
  switch (String(risk || "").toUpperCase()) {
    case "CRITICAL": return "bg-red-50 text-red-700 border-red-100";
    case "HIGH": return "bg-orange-50 text-orange-700 border-orange-100";
    case "MEDIUM": return "bg-amber-50 text-amber-700 border-amber-100";
    default: return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }
};

const getTrendIcon = (trend) => {
  switch (String(trend || "").toUpperCase()) {
    case "INCREASING": return <TrendingUp size={15} className="text-emerald-600" />;
    case "DECREASING": return <TrendingDown size={15} className="text-red-500" />;
    default: return <Minus size={15} className="text-slate-400" />;
  }
};

export default function AIInsights({ data = [] }) {
  const insights = Array.isArray(data)
    ? data
    : data?.insights ?? data?.recommendations ?? [];

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");

  const filteredInsights = useMemo(() => {
    const text = search.trim().toLowerCase();
    return insights.filter((item) => {
      const matchesSearch = [item.productName, item.name, item.title, item.sku, item.recommendation]
        .some((value) => String(value ?? "").toLowerCase().includes(text));
      const risk = String(item.riskLevel ?? item.priority ?? "LOW").toUpperCase();
      return matchesSearch && (riskFilter === "ALL" || risk === riskFilter);
    });
  }, [insights, search, riskFilter]);

  const criticalCount = insights.filter((item) => String(item.riskLevel ?? item.priority).toUpperCase() === "CRITICAL").length;
  const highCount = insights.filter((item) => String(item.riskLevel ?? item.priority).toUpperCase() === "HIGH").length;
  const mediumCount = insights.filter((item) => String(item.riskLevel ?? item.priority).toUpperCase() === "MEDIUM").length;

  return (
    <section className="overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm transition duration-300 hover:shadow-lg">
      <div className="relative overflow-hidden border-b border-violet-100 bg-gradient-to-r from-violet-950 via-indigo-950 to-slate-900 p-5 text-white sm:p-6">
        <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-violet-200 backdrop-blur"><BrainCircuit size={25} /></div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold sm:text-xl">AI Intelligence Insights</h3>
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-300/20 bg-violet-300/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-violet-200"><Sparkles size={11} /> Smart Analysis</span>
              </div>
              <p className="mt-1 text-xs text-indigo-200">Smart recommendations for your inventory</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-100"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />{insights.length} insights generated</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-4">
        <RiskSummary label="Total Insights" value={insights.length} color="violet" />
        <RiskSummary label="Critical Risk" value={criticalCount} color="red" />
        <RiskSummary label="High Risk" value={highCount} color="orange" />
        <RiskSummary label="Medium Risk" value={mediumCount} color="amber" />
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Inventory Recommendations</h4>
          <p className="mt-1 text-xs text-slate-500">Review AI-generated product risk and replenishment suggestions.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-50 sm:w-60">
            <Search size={16} className="text-slate-400" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product or SKU..." className="w-full min-w-0 bg-transparent text-xs outline-none" />
          </div>
          <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 sm:w-44">
            <Filter size={15} className="text-slate-400" />
            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="w-full bg-transparent text-xs text-slate-700 outline-none">
              <option value="ALL">All Risk Levels</option><option value="CRITICAL">Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {filteredInsights.length > 0 ? <>
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50"><tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-4">Product</th><th className="px-5 py-4">Risk Level</th><th className="px-5 py-4">Current Stock</th><th className="px-5 py-4">Available</th><th className="px-5 py-4">Demand Trend</th><th className="px-5 py-4">Recommended Qty.</th><th className="px-5 py-4">AI Recommendation</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInsights.map((item, index) => {
                const risk = String(item.riskLevel ?? item.priority ?? "LOW").toUpperCase();
                return <tr key={item.productId ?? item.id ?? index} className="ai-insight-row transition-colors hover:bg-violet-50/40" style={{ animationDelay: `${index * 55}ms` }}>
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Package size={19} /></div><div className="max-w-[180px]"><p className="truncate font-bold text-slate-800">{item.productName ?? item.name ?? item.title ?? "AI Recommendation"}</p><p className="mt-1 text-[10px] text-slate-400">SKU: {item.sku ?? "N/A"}</p></div></div></td>
                  <td className="px-5 py-4"><span className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] font-bold ${getRiskStyle(risk)}`}>{risk}</span></td>
                  <td className="px-5 py-4 font-semibold text-slate-700">{Number(item.currentStock ?? 0).toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4 font-semibold text-slate-700">{Number(item.availableStock ?? 0).toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4"><span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">{getTrendIcon(item.demandTrend)}{item.demandTrend ?? "STABLE"}</span></td>
                  <td className="px-5 py-4"><span className="inline-flex rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">{Number(item.recommendedQuantity ?? 0).toLocaleString("en-IN")} units</span></td>
                  <td className="max-w-[280px] px-5 py-4"><p className="line-clamp-2 text-xs leading-5 text-slate-600">{item.recommendation ?? item.message ?? item.description ?? item.insight ?? "Review this inventory recommendation."}</p></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-4 lg:hidden">
          {filteredInsights.map((item, index) => {
            const risk = String(item.riskLevel ?? item.priority ?? "LOW").toUpperCase();
            return <article key={item.productId ?? item.id ?? index} className="ai-insight-row rounded-xl border border-slate-200 bg-white p-4" style={{ animationDelay: `${index * 55}ms` }}>
              <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Package size={19} /></div><div className="min-w-0"><h4 className="truncate text-sm font-bold text-slate-900">{item.productName ?? item.name ?? item.title ?? "AI Recommendation"}</h4><p className="mt-1 text-[10px] text-slate-400">SKU: {item.sku ?? "N/A"}</p></div></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold ${getRiskStyle(risk)}`}>{risk}</span></div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-3 sm:grid-cols-4"><Metric label="Current Stock" value={item.currentStock ?? 0} /><Metric label="Available" value={item.availableStock ?? 0} /><Metric label="Demand Trend" value={item.demandTrend ?? "STABLE"} /><Metric label="Recommended" value={`${item.recommendedQuantity ?? 0} units`} /></div>
              <div className="mt-3 rounded-xl bg-violet-50/70 p-3"><div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-violet-700"><Lightbulb size={13} />AI Recommendation</div><p className="text-xs leading-5 text-slate-600">{item.recommendation ?? item.message ?? item.description ?? item.insight ?? "Review this inventory recommendation."}</p></div>
            </article>;
          })}
        </div>
      </> : <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center"><div className="rounded-2xl bg-violet-50 p-4 text-violet-500"><BrainCircuit size={32} /></div><h4 className="mt-4 font-bold text-slate-800">{insights.length === 0 ? "No AI insights available" : "No matching recommendations"}</h4><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{insights.length === 0 ? "AI inventory recommendations will appear here when data becomes available." : "Try another search term or risk level."}</p></div>}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3"><p className="text-[10px] text-slate-400">Showing {filteredInsights.length} of {insights.length} recommendations</p><span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-violet-600"><ShieldCheck size={13} />AI-assisted inventory analysis</span></div>
      <style>{`
        .ai-insight-row { animation: insightEnter .4s ease-out both; }
        @keyframes insightEnter { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .ai-insight-row { animation: none !important; } }
      `}</style>
    </section>
  );
}

function RiskSummary({ label, value, color }) {
  const styles = { violet: "bg-violet-50 text-violet-700", red: "bg-red-50 text-red-700", orange: "bg-orange-50 text-orange-700", amber: "bg-amber-50 text-amber-700" };
  return <div className="rounded-xl border border-slate-100 bg-white p-3 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"><p className="text-[10px] font-semibold text-slate-500">{label}</p><p className={`mt-2 inline-flex rounded-lg px-2.5 py-1 text-lg font-bold ${styles[color]}`}>{value}</p></div>;
}

function Metric({ label, value }) {
  return <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 truncate text-xs font-bold text-slate-800">{value}</p></div>;
}
