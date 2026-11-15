
import {
  BrainCircuit,
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react";

export default function AIInsights({ data = [] }) {
  const insights = Array.isArray(data)
    ? data
    : data?.insights ?? data?.recommendations ?? [];

  const getSeverity = (item) => {
    const severity = String(
      item.severity ?? item.priority ?? "medium"
    ).toLowerCase();

    if (["high", "critical", "urgent"].includes(severity)) {
      return {
        label: "High Priority",
        style: "bg-red-50 text-red-700",
        icon: AlertTriangle,
      };
    }

    if (["low", "info"].includes(severity)) {
      return {
        label: "Information",
        style: "bg-blue-50 text-blue-700",
        icon: Info,
      };
    }

    return {
      label: "Recommendation",
      style: "bg-violet-50 text-violet-700",
      icon: CheckCircle2,
    };
  };

  return (
    <section className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-violet-100 p-3 text-violet-600">
          <BrainCircuit size={24} />
        </div>

        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-800">
            AI Intelligence Insights
          </h3>

          <p className="text-sm text-slate-500">
            Smart recommendations for your inventory
          </p>
        </div>

        <Sparkles className="ml-auto shrink-0 text-violet-500" size={22} />
      </div>

      {insights.length === 0 ? (
        <div className="rounded-xl bg-slate-50 px-4 py-8 text-center">
          <BrainCircuit className="mx-auto text-slate-300" size={30} />

          <p className="mt-3 text-sm font-semibold text-slate-700">
            No new AI insights available
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Recommendations will appear when intelligence data is available.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((item, index) => {
            const severity = getSeverity(item);
            const SeverityIcon = severity.icon;

            return (
              <div
                key={item.id ?? index}
                className="flex gap-3 rounded-xl border border-violet-100 bg-violet-50/50 p-4"
              >
                <div className="mt-1 shrink-0 text-violet-600">
                  <SeverityIcon size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-900">
                      {item.productName ??
                        item.name ??
                        item.title ??
                        "AI Recommendation"}
                    </h4>

                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${severity.style}`}
                    >
                      {severity.label}
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.message ??
                      item.description ??
                      item.insight ??
                      "Review this inventory recommendation."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
