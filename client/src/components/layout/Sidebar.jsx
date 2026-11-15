
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Truck,
  ShoppingCart,
  RefreshCw,
  BarChart3,
  BrainCircuit,
  FileText,
  X,
  BoxesIcon,
  TrendingUp,
  ChevronRight,
  Activity,
  Sparkles,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Products",
    path: "/products",
    icon: Package,
  },
  {
    name: "Inventory",
    path: "/inventory",
    icon: Boxes,
  },
  {
    name: "Suppliers",
    path: "/suppliers",
    icon: Truck,
  },
  {
    name: "Purchase Orders",
    path: "/purchase-orders",
    icon: ShoppingCart,
  },
  {
    name: "Demand",
    path: "/demands",
    icon: TrendingUp,
  },
  {
    name: "Replenishment",
    path: "/replenishment",
    icon: RefreshCw,
  },
];

const intelligenceItems = [
  {
  name: "Inventory Analytics",
  path: "/analytics",
  icon: BarChart3,
},
  {
    name: "AI Intelligence",
    path: "/intelligence",
    icon: BrainCircuit,
  },
  {
    name: "Reports",
    path: "/reports",
    icon: FileText,
  },
];

function NavigationSection({ title, items, onClose }) {
  return (
    <div className="mb-7">
      <p className="mb-3 px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>

      <nav className="space-y-1.5">
        {items.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            onClick={onClose}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950/30"
                  : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-white" />
                )}

                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.3 : 1.8}
                  className={`shrink-0 transition-transform duration-200 ${
                    isActive
                      ? "text-white"
                      : "text-slate-500 group-hover:scale-110 group-hover:text-blue-400"
                  }`}
                />

                <span className="flex-1">{name}</span>

                <ChevronRight
                  size={15}
                  className={`transition-all ${
                    isActive
                      ? "translate-x-0 text-blue-100 opacity-100"
                      : "-translate-x-1 text-slate-600 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                  }`}
                />
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[280px] shrink-0 flex-col border-r border-slate-800/80 bg-[#0b1220] text-white shadow-2xl transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:z-30 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/[0.07] px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-950/50">
              <BoxesIcon size={23} strokeWidth={2.2} />
            </div>

            <div>
              <h1 className="text-[15px] font-bold tracking-tight text-white">
                AI Inventory
              </h1>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500">
                Intelligence Platform
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
          <NavigationSection
            title="Workspace"
            items={menuItems}
            onClose={onClose}
          />

          <NavigationSection
            title="Intelligence & Reports"
            items={intelligenceItems}
            onClose={onClose}
          />
        </div>

        {/* Platform Status */}
        <div className="shrink-0 border-t border-white/[0.07] p-4">
          <div className="relative overflow-hidden rounded-2xl border border-blue-400/15 bg-gradient-to-br from-blue-950/80 to-indigo-950/70 p-4">
            <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-blue-500/10 blur-2xl" />

            <div className="relative">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                  <Sparkles size={17} />
                </div>

                <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online
                </span>
              </div>

              <h3 className="text-xs font-bold text-white">
                AI Powered Platform
              </h3>

              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                Smarter demand forecasting and inventory decisions.
              </p>

              <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
                <Activity size={13} className="text-blue-400" />
                <span className="text-[10px] font-medium text-slate-400">
                  Intelligence services active
                </span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-[9px] font-medium tracking-wider text-slate-600">
            AI DEMAND & INVENTORY PLATFORM
          </p>
        </div>
      </aside>
    </>
  );
}
