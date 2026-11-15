
export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
}) {
  const themes = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
      accent: "bg-blue-500",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-600",
      accent: "bg-emerald-500",
    },
    orange: {
      icon: "bg-orange-50 text-orange-600",
      accent: "bg-orange-500",
    },
    red: {
      icon: "bg-red-50 text-red-600",
      accent: "bg-red-500",
    },
    violet: {
      icon: "bg-violet-50 text-violet-600",
      accent: "bg-violet-500",
    },
  };

  const theme = themes[color] ?? themes.blue;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-6">
      <div className={`absolute inset-x-0 top-0 h-1 ${theme.accent}`} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {value ?? "—"}
          </h3>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {subtitle}
          </p>
        </div>

        <div className={`shrink-0 rounded-xl p-3 ${theme.icon}`}>
          {Icon && <Icon size={24} strokeWidth={2} />}
        </div>
      </div>
    </div>
  );
}
