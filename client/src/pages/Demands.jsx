
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Plus,
  Search,
  RefreshCw,
  Filter,
  CalendarDays,
  Package,
  TrendingUp,
  ClipboardList,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

import { toast } from "react-toastify";

import { getDemands, createDemand } from "../services/demandService";
import { getProducts } from "../services/productService";

const PAGE_SIZE = 8;

const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const initialForm = {
  productId: "",
  demandDate: getToday(),
  quantity: "",
  source: "MANUAL",
  notes: "",
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function Demands() {
  const [demands, setDemands] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [form, setForm] = useState(initialForm);

  // ==========================================
  // Load Demands
  // ==========================================

  const loadDemands = useCallback(async (showLoader = true, showSuccess = false) => {
    const startTime = Date.now();

    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await getDemands();

      const result =
        response?.demands ??
        response?.data?.demands ??
        response?.data ??
        response;

      if (!Array.isArray(result)) {
        throw new Error("Invalid demands response from server");
      }

      setDemands(result);

      if (showSuccess) {
        toast.success("Demand records refreshed successfully");
      }
    } catch (error) {
      console.error("Demand API Error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to load demand records"
      );
    } finally {
      const remaining = Math.max(0, 700 - (Date.now() - startTime));

      setTimeout(() => {
        setLoading(false);
        setRefreshing(false);
      }, remaining);
    }
  }, []);

  // ==========================================
  // Load Products
  // ==========================================

  const loadProducts = useCallback(async () => {
    try {
      setProductsLoading(true);

      const response = await getProducts();

      const result =
        response?.products ??
        response?.data?.products ??
        response?.data ??
        response;

      if (!Array.isArray(result)) {
        throw new Error("Invalid products response");
      }

      setProducts(result.filter((product) => product.isActive !== false));
    } catch (error) {
      console.error("Demand Products Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to load products"
      );
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDemands();
    loadProducts();
  }, [loadDemands, loadProducts]);

  // ==========================================
  // Search and Filter
  // ==========================================

  const filteredDemands = useMemo(() => {
    const query = search.trim().toLowerCase();

    return demands.filter((demand) => {
      const productName = demand.product?.name || "";
      const productSku = demand.product?.sku || "";

      const matchesSearch = [
        productName,
        productSku,
        demand.notes,
        demand.source,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      );

      const matchesSource =
        sourceFilter === "ALL" ||
        demand.source === sourceFilter;

      return matchesSearch && matchesSource;
    });
  }, [demands, search, sourceFilter]);

  // ==========================================
  // Pagination
  // ==========================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDemands.length / PAGE_SIZE)
  );

  const paginatedDemands = filteredDemands.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sourceFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // ==========================================
  // Summary
  // ==========================================

  const summary = useMemo(() => {
    const totalQuantity = demands.reduce(
      (total, demand) => total + Number(demand.quantity || 0),
      0
    );

    const manualCount = demands.filter(
      (demand) => demand.source === "MANUAL"
    ).length;

    const uniqueProducts = new Set(
      demands.map((demand) => demand.productId)
    ).size;

    return {
      totalRecords: demands.length,
      totalQuantity,
      manualCount,
      uniqueProducts,
    };
  }, [demands]);

  // ==========================================
  // Modal
  // ==========================================

  const openAddModal = () => {
    setSelectedDemand(null);
    setForm({
      ...initialForm,
      demandDate: getToday(),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setForm(initialForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // Create Demand
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.productId) {
      toast.error("Please select a product");
      return;
    }

    if (!form.demandDate) {
      toast.error("Please select a demand date");
      return;
    }

    const quantity = Number(form.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      toast.error("Quantity must be a positive whole number");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        productId: Number(form.productId),
        demandDate: form.demandDate,
        quantity,
        source: form.source,
        notes: form.notes.trim(),
      };

      await createDemand(payload);

      toast.success("Demand record created successfully");

      setModalOpen(false);
      setForm(initialForm);

      await loadDemands(true, false);
    } catch (error) {
      console.error("Create Demand Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to create demand record"
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // View Demand Details
  // ==========================================

  const openDetails = (demand) => {
    setSelectedDemand(demand);
  };

  const closeDetails = () => {
    setSelectedDemand(null);
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">

      {/* Header */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
            <Activity size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Demand Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Record and monitor product demand history
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              loadDemands(false, true);
              loadProducts();
            }}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={openAddModal}
            disabled={productsLoading || products.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />
            Add Demand
          </button>
        </div>
      </div>

      {/* Summary Cards */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Demand Records"
          value={summary.totalRecords}
          icon={ClipboardList}
          color="blue"
        />

        <SummaryCard
          title="Total Demand Quantity"
          value={summary.totalQuantity.toLocaleString("en-IN")}
          icon={TrendingUp}
          color="green"
        />

        <SummaryCard
          title="Manual Records"
          value={summary.manualCount}
          icon={Activity}
          color="orange"
        />

        <SummaryCard
          title="Products With Demand"
          value={summary.uniqueProducts}
          icon={Package}
          color="purple"
        />
      </div>

      {/* Demand Records */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Search and Filter */}

        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-bold text-slate-800">
              Demand Records
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Showing {filteredDemands.length} of {demands.length} records
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 sm:w-64">
              <Search size={17} className="shrink-0 text-slate-400" />

              <input
                type="search"
                placeholder="Search product, SKU or notes..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-xs font-medium text-blue-600"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 sm:w-44">
              <Filter size={17} className="shrink-0 text-slate-400" />

              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              >
                <option value="ALL">All Sources</option>
                <option value="SALE">Sale</option>
                <option value="ORDER">Order</option>
                <option value="MANUAL">Manual</option>
                <option value="IMPORT">Import</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading */}

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3">
            <RefreshCw
              className="animate-spin text-blue-600"
              size={30}
            />

            <p className="text-sm text-slate-500">
              Loading demand records...
            </p>
          </div>
        ) : filteredDemands.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <div className="rounded-full bg-slate-100 p-4">
              <Activity size={35} className="text-slate-400" />
            </div>

            <h3 className="mt-3 font-semibold text-slate-700">
              {demands.length === 0
                ? "No demand records available"
                : "No matching demand records"}
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              {demands.length === 0
                ? "Start by recording your first product demand."
                : "Try a different search or source filter."}
            </p>

            {demands.length === 0 && products.length > 0 && (
              <button
                type="button"
                onClick={openAddModal}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Add First Demand
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table */}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Product</th>
                    <th className="px-5 py-4">SKU</th>
                    <th className="px-5 py-4">Demand Date</th>
                    <th className="px-5 py-4">Quantity</th>
                    <th className="px-5 py-4">Source</th>
                    <th className="px-5 py-4">Notes</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedDemands.map((demand) => (
                    <tr
                      key={demand.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                            <Package size={19} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {demand.product?.name || `Product #${demand.productId}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-600">
                        {demand.product?.sku || "—"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays size={15} className="text-slate-400" />
                          {formatDate(demand.demandDate)}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {Number(demand.quantity || 0).toLocaleString("en-IN")} units
                      </td>

                      <td className="px-5 py-4">
                        <SourceBadge source={demand.source} />
                      </td>

                      <td className="max-w-48 truncate px-5 py-4 text-slate-500">
                        {demand.notes || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => openDetails(demand)}
                            title="View demand details"
                            className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                          >
                            <Eye size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}

            <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
              <p className="text-xs text-slate-500">
                Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
                {Math.min(currentPage * PAGE_SIZE, filteredDemands.length)}{" "}
                of {filteredDemands.length} records
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                </button>

                <span className="px-3 text-sm font-semibold text-slate-700">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Add Demand Modal */}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-6">
          <div className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Record New Demand
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Enter product demand information
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid max-h-[65vh] grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">

                <FormField label="Product *">
                  <select
                    name="productId"
                    value={form.productId}
                    onChange={handleChange}
                    required
                    disabled={productsLoading}
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  >
                    <option value="">
                      {productsLoading ? "Loading products..." : "Select Product"}
                    </option>

                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Demand Date *">
                  <input
                    type="date"
                    name="demandDate"
                    value={form.demandDate}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </FormField>

                <FormField label="Demand Quantity *">
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    step="1"
                    value={form.quantity}
                    onChange={handleChange}
                    required
                    placeholder="Enter quantity"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </FormField>

                <FormField label="Demand Source *">
                  <select
                    name="source"
                    value={form.source}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="MANUAL">Manual</option>
                    <option value="SALE">Sale</option>
                    <option value="ORDER">Order</option>
                    <option value="IMPORT">Import</option>
                  </select>
                </FormField>

                <div className="sm:col-span-2">
                  <FormField label="Notes">
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Enter additional information..."
                      className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </FormField>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || productsLoading || products.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <RefreshCw size={16} className="animate-spin" />
                  )}

                  {saving ? "Saving..." : "Save Demand"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Demand Details Modal */}

      {selectedDemand && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3">
          <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">
                Demand Details
              </h2>

              <button
                type="button"
                onClick={closeDetails}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <DetailRow
                label="Product"
                value={selectedDemand.product?.name || `Product #${selectedDemand.productId}`}
              />

              <DetailRow
                label="SKU"
                value={selectedDemand.product?.sku || "—"}
              />

              <DetailRow
                label="Demand Date"
                value={formatDate(selectedDemand.demandDate)}
              />

              <DetailRow
                label="Quantity"
                value={`${Number(selectedDemand.quantity || 0)} units`}
              />

              <DetailRow
                label="Source"
                value={selectedDemand.source}
              />

              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Notes
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                  {selectedDemand.notes || "No notes available"}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 p-5 text-right">
              <button
                type="button"
                onClick={closeDetails}
                className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// Summary Card
// ==========================================

function SummaryCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-violet-50 text-violet-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <div className={`rounded-xl p-3 ${colors[color]}`}>
          <Icon size={22} />
        </div>
      </div>

      <h3 className="mt-4 text-3xl font-bold text-slate-900">
        {value}
      </h3>
    </div>
  );
}

// ==========================================
// Source Badge
// ==========================================

function SourceBadge({ source }) {
  const styles = {
    SALE: "bg-emerald-100 text-emerald-700",
    ORDER: "bg-blue-100 text-blue-700",
    MANUAL: "bg-violet-100 text-violet-700",
    IMPORT: "bg-orange-100 text-orange-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[source] || "bg-slate-100 text-slate-600"
      }`}
    >
      {source || "UNKNOWN"}
    </span>
  );
}

// ==========================================
// Form Field
// ==========================================

function FormField({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">
        {label}
      </label>

      {children}
    </div>
  );
}

// ==========================================
// Detail Row
// ==========================================

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-right text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}
