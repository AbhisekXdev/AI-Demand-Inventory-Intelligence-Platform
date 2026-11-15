
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
} from "lucide-react";
import { toast } from "react-toastify";

import {
  downloadInventoryReport,
  downloadPurchaseOrderReport,
} from "../services/reportService";

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

function ReportCard({
  title,
  description,
  icon: Icon,
  color,
  features,
  children,
  onDownload,
  loading,
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={25} />
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          CSV Available
        </span>
      </div>

      <h2 className="mt-5 text-xl font-bold text-slate-900">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

      <div className="mt-5 flex-1 space-y-3">
        <p className="text-sm font-semibold text-slate-700">
          Included data
        </p>

        {features.map((feature) => (
          <div
            key={feature}
            className="flex items-center gap-2 text-sm text-slate-600"
          >
            <CheckCircle2
              size={16}
              className="shrink-0 text-emerald-500"
            />
            {feature}
          </div>
        ))}
      </div>

      {children}

      <button
        onClick={onDownload}
        disabled={loading}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <RefreshCw size={17} className="animate-spin" />
            Preparing Report...
          </>
        ) : (
          <>
            <Download size={17} />
            Download CSV
          </>
        )}
      </button>
    </div>
  );
}

export default function Reports() {
  const [inventoryStatus, setInventoryStatus] = useState("");
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const handleInventoryDownload = async () => {
    setInventoryLoading(true);

    try {
      const blob = await downloadInventoryReport(inventoryStatus);

      saveCSV(blob, "inventory-report.csv");

      toast.success("Inventory report downloaded successfully");
    } catch (error) {
      console.error("Inventory report error:", error);

      toast.error(
        "Failed to download inventory report. Please check your server."
      );
    } finally {
      setInventoryLoading(false);
    }
  };

  const handlePurchaseOrderDownload = async () => {
    setPurchaseLoading(true);

    try {
      const blob = await downloadPurchaseOrderReport();

      saveCSV(blob, "purchase-orders-report.csv");

      toast.success("Purchase order report downloaded successfully");
    } catch (error) {
      console.error("Purchase order report error:", error);

      toast.error(
        "Failed to download purchase order report. Please check your server."
      );
    } finally {
      setPurchaseLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
            <FileSpreadsheet size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Reports & Exports
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Generate and download reports from your inventory system.
            </p>
          </div>
        </div>
      </div>

      {/* Information */}
      <div className="flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <Info className="mt-0.5 shrink-0 text-blue-600" size={21} />

        <div>
          <p className="text-sm font-semibold text-blue-900">
            Report export information
          </p>
          <p className="mt-1 text-sm leading-6 text-blue-800">
            Reports are generated from your current database records and
            downloaded in CSV format. You can open CSV files using Microsoft
            Excel, Google Sheets or other spreadsheet applications.
          </p>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportCard
          title="Inventory Report"
          description="Export product-level inventory details, stock availability,
          reorder levels and inventory valuation."
          icon={Package}
          color="bg-blue-50 text-blue-600"
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
          <div className="mt-6">
            <label
              htmlFor="inventory-status"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Filter by stock status
            </label>

            <select
              id="inventory-status"
              value={inventoryStatus}
              onChange={(event) => setInventoryStatus(event.target.value)}
              disabled={inventoryLoading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All Inventory Records</option>
              <option value="HEALTHY">Healthy Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </ReportCard>

        <ReportCard
          title="Purchase Order Report"
          description="Export purchase order records with supplier details,
          delivery dates, order status and total amount."
          icon={ShoppingCart}
          color="bg-violet-50 text-violet-600"
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
          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">
              Export scope
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Exports all purchase orders returned by the backend, newest
              first. No status filter is currently supported.
            </p>
          </div>
        </ReportCard>
      </div>

      {/* Not yet available */}
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-slate-100 p-3 text-slate-500">
            <FileText size={23} />
          </div>

          <div>
            <h2 className="font-bold text-slate-800">
              Additional reports
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Demand history, forecast performance and AI intelligence
              reports are not yet available as CSV export endpoints in the
              current backend. They can be added in a future backend update.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
