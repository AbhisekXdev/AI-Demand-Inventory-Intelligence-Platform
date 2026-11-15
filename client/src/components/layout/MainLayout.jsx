
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const pageTitles = {
  "/": "Dashboard",
  "/products": "Product Management",
  "/inventory": "Inventory Management",
  "/suppliers": "Supplier Management",
  "/purchase-orders": "Purchase Order Management",
  "/demands": "Demand Management",
  "/replenishment": "Replenishment",
  "/analytics": "Inventory Analytics",
  "/intelligence": "AI Intelligence",
  "/reports": "Reports & Insights",
};

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const currentPage =
    pageTitles[location.pathname] || "AI Inventory Platform";

  return (
    <div className="min-h-screen bg-[#f5f7fb] lg:flex">

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Application */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">

        {/* Navbar */}
        <Navbar
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">

          {/* Page Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Workspace
              </p>

              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {currentPage}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage and monitor your demand and inventory operations.
              </p>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700">
                Platform Active
              </span>
            </div>
          </div>

          {/* Nested Page */}
          <div className="min-w-0">
            <Outlet />
          </div>

        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} AI Demand & Inventory Intelligence Platform.
            </p>

            <p className="text-xs font-medium text-slate-400">
              Smart Inventory • Intelligent Forecasting • Better Decisions
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
