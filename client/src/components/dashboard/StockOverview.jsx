
import {
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Boxes,
  ShieldCheck,
} from "lucide-react";

export default function StockOverview({ data = [] }) {
  const products = Array.isArray(data) ? data : [];

  const getStockStatus = (product) => {
    const quantity = Number(product.quantity ?? product.currentStock ?? 0);
    const reserved = Number(product.reservedQuantity ?? 0);

    const available =
      product.availableStock !== undefined
        ? Number(product.availableStock)
        : Math.max(0, quantity - reserved);

    const reorderLevel = Number(product.reorderLevel ?? 0);

    if (available <= 0) {
      return {
        label: "Out of Stock",
        style: "bg-red-50 text-red-700 border-red-100",
        icon: XCircle,
        bar: "bg-red-500",
      };
    }

    if (available <= reorderLevel) {
      return {
        label: "Low Stock",
        style: "bg-amber-50 text-amber-700 border-amber-100",
        icon: AlertTriangle,
        bar: "bg-amber-500",
      };
    }

    return {
      label: "Healthy",
      style: "bg-emerald-50 text-emerald-700 border-emerald-100",
      icon: CheckCircle2,
      bar: "bg-emerald-500",
    };
  };

  const outOfStockCount = products.filter(
    (product) => getStockStatus(product).label === "Out of Stock"
  ).length;

  const lowStockCount = products.filter(
    (product) => getStockStatus(product).label === "Low Stock"
  ).length;

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            Stock Overview
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Product availability and stock alerts
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <Boxes size={23} />
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-2 gap-3 p-5 pb-0 sm:p-6 sm:pb-0">
        <div className="rounded-xl border border-red-100 bg-red-50/60 p-3">
          <div className="flex items-center gap-2">
            <XCircle size={17} className="text-red-600" />
            <span className="text-xs font-medium text-red-700">
              Out of Stock
            </span>
          </div>

          <p className="mt-2 text-2xl font-bold text-red-700">
            {outOfStockCount}
          </p>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={17} className="text-amber-600" />
            <span className="text-xs font-medium text-amber-700">
              Low Stock
            </span>
          </div>

          <p className="mt-2 text-2xl font-bold text-amber-700">
            {lowStockCount}
          </p>
        </div>
      </div>

      {/* Products */}
      <div className="p-5 sm:p-6">

        {products.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 text-center">
            <div className="rounded-full bg-emerald-50 p-4">
              <ShieldCheck size={30} className="text-emerald-500" />
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-700">
              No stock alerts
            </p>

            <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
              Great! No low-stock or out-of-stock products were returned.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.slice(0, 6).map((product, index) => {
              const quantity = Number(
                product.quantity ?? product.currentStock ?? 0
              );

              const reserved = Number(
                product.reservedQuantity ?? 0
              );

              const available =
                product.availableStock !== undefined
                  ? Number(product.availableStock)
                  : Math.max(0, quantity - reserved);

              const reorderLevel = Number(
                product.reorderLevel ?? 0
              );

              const status = getStockStatus(product);
              const StatusIcon = status.icon;

              const progress =
                reorderLevel > 0
                  ? Math.min((available / reorderLevel) * 100, 100)
                  : available > 0
                    ? 100
                    : 0;

              return (
                <div
                  key={
                    product.productId ??
                    product.id ??
                    product.sku ??
                    index
                  }
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-blue-100 hover:bg-blue-50/30"
                >
                  {/* Product Info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="shrink-0 rounded-lg bg-white p-2.5 text-blue-600 shadow-sm">
                        <Package size={19} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {product.name ??
                            product.productName ??
                            "Unnamed Product"}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          SKU: {product.sku ?? "N/A"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${status.style}`}
                    >
                      <StatusIcon size={12} />
                      {status.label}
                    </span>
                  </div>

                  {/* Stock Information */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        Total
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {quantity.toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        Reserved
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-600">
                        {reserved.toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        Available
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {available.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {/* Stock Progress */}
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        Available stock
                      </span>

                      <span className="text-[11px] font-semibold text-slate-600">
                        Reorder: {reorderLevel}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${status.bar}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {products.length > 6 && (
          <p className="mt-4 text-center text-xs font-medium text-slate-500">
            Showing 6 of {products.length} stock alerts
          </p>
        )}
      </div>
    </section>
  );
}
