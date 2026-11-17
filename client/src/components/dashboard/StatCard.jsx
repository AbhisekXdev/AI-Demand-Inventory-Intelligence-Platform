
export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
}) {
  const themes = {
    blue: {
      icon: "bg-blue-50 text-blue-600 ring-blue-100",
      accent: "bg-blue-500",
      glow: "bg-blue-500/5",
      hover: "group-hover:text-blue-600",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-600 ring-emerald-100",
      accent: "bg-emerald-500",
      glow: "bg-emerald-500/5",
      hover: "group-hover:text-emerald-600",
    },
    orange: {
      icon: "bg-orange-50 text-orange-600 ring-orange-100",
      accent: "bg-orange-500",
      glow: "bg-orange-500/5",
      hover: "group-hover:text-orange-600",
    },
    red: {
      icon: "bg-red-50 text-red-600 ring-red-100",
      accent: "bg-red-500",
      glow: "bg-red-500/5",
      hover: "group-hover:text-red-600",
    },
    violet: {
      icon: "bg-violet-50 text-violet-600 ring-violet-100",
      accent: "bg-violet-500",
      glow: "bg-violet-500/5",
      hover: "group-hover:text-violet-600",
    },
  };

  const theme = themes[color] ?? themes.blue;

  return (
    <div
      className="
        group relative isolate overflow-hidden
        rounded-2xl border border-slate-200/80
        bg-white p-5 shadow-sm
        transition-all duration-300 ease-out
        hover:-translate-y-1 hover:border-slate-300
        hover:shadow-xl hover:shadow-slate-200/50
        sm:p-6
      "
    >
      {/* Top accent */}
      <div
        className={`absolute inset-x-0 top-0 h-1 ${theme.accent}`}
      />

      {/* Background decoration */}
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl ${theme.glow} transition-transform duration-500 group-hover:scale-150`}
      />

      <div className="relative flex items-start justify-between gap-4">
        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium tracking-wide text-slate-500">
            {title}
          </p>

          <h3
            className={`mt-3 break-words text-2xl font-bold tracking-tight text-slate-900 transition-colors duration-300 sm:text-3xl ${theme.hover}`}
          >
            {value ?? "—"}
          </h3>

          {subtitle && (
            <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <div
            className={`
              flex h-12 w-12 shrink-0 items-center justify-center
              rounded-xl ring-1 ring-inset
              transition-all duration-300
              group-hover:scale-110 group-hover:rotate-3
              ${theme.icon}
            `}
          >
            <Icon size={23} strokeWidth={2} />
          </div>
        )}
      </div>

      {/* Bottom hover indicator */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 w-0 ${theme.accent} transition-all duration-500 group-hover:w-full`}
      />
    </div>
  );
}
