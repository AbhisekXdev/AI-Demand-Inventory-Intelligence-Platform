import { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  Package,
  ShoppingCart,
  RefreshCw,
  CheckCircle2,
  FileText,
  Info,
  ArrowDownToLine,
  ShieldCheck,
  Database,
  Filter,
  CalendarDays,
  FileCheck2,
  Sparkles,
  Clock3,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  downloadInventoryReport,
  downloadPurchaseOrderReport,
} from "../services/reportService";

/* =========================
   CSV DOWNLOAD HELPER
========================= */

const saveCSV = (blob, filename) => {
  const file = new Blob([blob], {
    type: "text/csv;charset=utf-8;",
  });

  const url = window.URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
};

/* =========================
   REUSABLE COMPONENTS
========================= */

function FeatureItem({ children }) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-slate-600">
      <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-500" />
      <span className="leading-5">{children}</span>
    </div>
  );
}

function ReportCard({
  title,
  description,
  icon: Icon,
  color,
  iconBg,
  features,
  children,
  onDownload,
  loading,
  reportType,
  tag = "CSV Available",
}) {
  return (
    <div className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
      {/* Card top accent */}
      <div className={`h-1.5 w-full ${color}`} />

      <div className="flex flex-1 flex-col p-5 sm:p-6 lg:p-7">
        {/* Icon and status */}
        <div className="flex items-start justify-between gap-3">
          <div
            className={`rounded-2xl p-3.5 ${iconBg} transition duration-300 group-hover:scale-105`}
          >
            <Icon size={27} />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {tag}
          </span>
        </div>

        {/* Title */}
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
            {reportType}
          </p>

          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        </div>

        {/* Included data */}
        <div className="mt-6 rounded-2xl bg-slate-50/80 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Database size={16} className="text-slate-500" />
            <p className="text-sm font-bold text-slate-800">
              Included in this report
            </p>
          </div>

          <div className="space-y-3">
            {features.map((feature) => (
              <FeatureItem key={feature}>{feature}</FeatureItem>
            ))}
          </div>
        </div>

        {/* Extra controls */}
        <div className="mt-5 flex-1">{children}</div>

        {/* Download */}
        <button
          type="button"
          onClick={onDownload}
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {loading ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              Preparing Report...
            </>
          ) : (
            <>
              <Download size={18} />
              Download CSV
              <ArrowDownToLine size={16} className="ml-auto" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* =========================
   MAIN REPORTS COMPONENT
========================= */

export default function Reports() {
  const [inventoryStatus, setInventoryStatus] = useState("");
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  /* =========================
     INVENTORY REPORT
  ========================= */

  const handleInventoryDownload = async () => {
    setInventoryLoading(true);

    try {
      const blob = await downloadInventoryReport(inventoryStatus);

      saveCSV(blob, "inventory-report.csv");

      toast.success("Inventory report downloaded successfully");
    } catch (error) {
      console.error("Inventory report error:", error);

      toast.error(
        "Failed to download inventory report. Please check your server.",
      );
    } finally {
      setInventoryLoading(false);
    }
  };

  /* =========================
     PURCHASE ORDER REPORT
  ========================= */

  const handlePurchaseOrderDownload = async () => {
    setPurchaseLoading(true);

    try {
      const blob = await downloadPurchaseOrderReport();

      saveCSV(blob, "purchase-orders-report.csv");

      toast.success("Purchase order report downloaded successfully");
    } catch (error) {
      console.error("Purchase order report error:", error);

      toast.error(
        "Failed to download purchase order report. Please check your server.",
      );
    } finally {
      setPurchaseLoading(false);
    }
  };

  /* =========================
     UI
  ========================= */

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/60 pb-8">
      {/* ================= HEADER ================= */}

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-900 p-5 text-white shadow-xl sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[35px] border-white/5" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-3.5 shadow-lg">
                <FileSpreadsheet size={28} />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200 sm:text-xs">
                  Data Management
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  Reports & Exports
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100/80 sm:text-base">
              Generate, export and manage your inventory and purchase order
              reports. Download your business data in spreadsheet-ready CSV
              format.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-blue-200/80">
              <span className="inline-flex items-center gap-1.5">
                <FileCheck2 size={15} />
                CSV Export
              </span>

              <span className="h-1 w-1 rounded-full bg-blue-300/60" />

              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={15} />
                Database Records
              </span>

              <span className="h-1 w-1 rounded-full bg-blue-300/60" />

              <span className="inline-flex items-center gap-1.5">
                <Download size={15} />
                Excel Compatible
              </span>
            </div>
          </div>

          <div className="hidden shrink-0 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm sm:block">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-3">
                <FileSpreadsheet size={27} />
              </div>

              <div>
                <p className="text-sm font-bold text-white">Report Center</p>
                <p className="mt-1 text-xs text-blue-200">
                  Export your business data
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= INFORMATION ================= */}

      <section className="flex gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-4 sm:p-5">
        <div className="h-fit shrink-0 rounded-xl bg-blue-100 p-2.5 text-blue-700">
          <Info size={21} />
        </div>

        <div className="min-w-0">
          <h2 className="text-sm font-bold text-blue-950">
            Report export information
          </h2>

          <p className="mt-1.5 text-xs leading-6 text-blue-800 sm:text-sm">
            Reports are generated from your current database records and
            downloaded in CSV format. You can open CSV files using Microsoft
            Excel, Google Sheets or other spreadsheet applications.
          </p>
        </div>
      </section>

      {/* ================= REPORT SUMMARY ================= */}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Package size={23} />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">Inventory Report</p>
            <p className="mt-1 text-xs text-slate-500">
              Product and stock information
            </p>
          </div>

          <span className="ml-auto rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
            CSV
          </span>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
            <ShoppingCart size={23} />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">
              Purchase Order Report
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Supplier and order information
            </p>
          </div>

          <span className="ml-auto rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">
            CSV
          </span>
        </div>
      </section>

      {/* ================= REPORT CARDS ================= */}

      <section>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Available Reports
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select a report and download the required data.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* INVENTORY REPORT */}

          <ReportCard
            title="Inventory Report"
            reportType="Stock Management"
            description="Export product-level inventory details, stock availability, reorder levels and inventory valuation."
            icon={Package}
            color="bg-blue-600"
            iconBg="bg-blue-50 text-blue-600"
            loading={inventoryLoading}
            onDownload={handleInventoryDownload}
            features={[
              "Product name and SKU",
              "Current and reserved quantity",
              "Available stock and reorder level",
              "Cost price and inventory value",
              "Healthy, low-stock and out-of-stock status",
            ]}
          >
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <Filter size={16} />
                </div>

                <div>
                  <label
                    htmlFor="inventory-status"
                    className="block text-sm font-bold text-slate-800"
                  >
                    Filter by stock status
                  </label>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Choose which inventory records to export
                  </p>
                </div>
              </div>

              <select
                id="inventory-status"
                value={inventoryStatus}
                onChange={(event) => setInventoryStatus(event.target.value)}
                disabled={inventoryLoading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">All Inventory Records</option>
                <option value="HEALTHY">Healthy Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>
                  {inventoryStatus === ""
                    ? "Exporting all inventory records"
                    : `Selected: ${inventoryStatus.replaceAll("_", " ")}`}
                </span>
              </div>
            </div>
          </ReportCard>

          {/* PURCHASE ORDER REPORT */}

          <ReportCard
            title="Purchase Order Report"
            reportType="Procurement Management"
            description="Export purchase order records with supplier details, delivery dates, order status and total amount."
            icon={ShoppingCart}
            color="bg-violet-600"
            iconBg="bg-violet-50 text-violet-600"
            loading={purchaseLoading}
            onDownload={handlePurchaseOrderDownload}
            features={[
              "Purchase order number",
              "Supplier name",
              "Order and expected delivery dates",
              "Purchase order status",
              "Total amount and notes",
            ]}
          >
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-100 p-2.5 text-violet-700">
                  <CalendarDays size={19} />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Export scope
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Exports all purchase orders returned by the backend, newest
                    first. No status filter is currently supported.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-slate-200 pt-3 text-xs text-slate-500">
                <Clock3 size={14} />
                All available purchase order records
              </div>
            </div>
          </ReportCard>
        </div>
      </section>

      {/* ================= ADDITIONAL REPORTS ================= */}

      <section className="overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
          <div className="h-fit shrink-0 rounded-2xl bg-slate-100 p-3 text-slate-500">
            <Sparkles size={25} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-slate-900">Additional Reports</h2>

              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                Coming Later
              </span>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Demand history, forecast performance and AI intelligence reports
              are not yet available as CSV export endpoints in the current
              backend. They can be added in a future backend update.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "Demand History",
                "Forecast Performance",
                "AI Intelligence",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}

      <div className="flex flex-col items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck size={16} className="text-emerald-500" />
          Report data is generated from your connected database.
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <FileSpreadsheet size={14} />
          CSV Export Center
          <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
}
