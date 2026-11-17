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
  Boxes,
  ArrowUpRight,
  FileText,
  Hash,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import { getDemands, createDemand } from "../services/demandService";
import { getProducts } from "../services/productService";
import "./Demands.css";

const PAGE_SIZE = 8;
const getToday = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
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
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};
const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN");
const extractArray = (response, key) => {
  const result =
    response?.[key] ?? response?.data?.[key] ?? response?.data ?? response;
  return Array.isArray(result) ? result : null;
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

  const loadDemands = useCallback(
    async (showLoader = true, showSuccess = false) => {
      if (showLoader) setLoading(true);
      else setRefreshing(true);
      try {
        const result = extractArray(await getDemands(), "demands");
        if (!result) throw new Error("Invalid demands response from server");
        setDemands(result);
        if (showSuccess) toast.success("Demand records refreshed successfully");
      } catch (error) {
        console.error("Demand API Error:", error);
        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Unable to load demand records",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  const loadProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      const result = extractArray(await getProducts(), "products");
      if (!result) throw new Error("Invalid products response");
      setProducts(result.filter((product) => product.isActive !== false));
    } catch (error) {
      console.error("Demand Products Error:", error);
      toast.error(error.response?.data?.message || "Unable to load products");
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDemands();
    loadProducts();
  }, [loadDemands, loadProducts]);

  const filteredDemands = useMemo(() => {
    const query = search.trim().toLowerCase();
    return demands.filter((demand) => {
      const matchesSearch = [
        demand.product?.name,
        demand.product?.sku,
        demand.notes,
        demand.source,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      );
      return (
        matchesSearch &&
        (sourceFilter === "ALL" || demand.source === sourceFilter)
      );
    });
  }, [demands, search, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDemands.length / PAGE_SIZE));
  const paginatedDemands = filteredDemands.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sourceFilter]);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const summary = useMemo(
    () => ({
      totalRecords: demands.length,
      totalQuantity: demands.reduce(
        (total, demand) => total + Number(demand.quantity || 0),
        0,
      ),
      manualCount: demands.filter((demand) => demand.source === "MANUAL")
        .length,
      uniqueProducts: new Set(demands.map((demand) => demand.productId)).size,
    }),
    [demands],
  );

  const openAddModal = () => {
    setSelectedDemand(null);
    setForm({ ...initialForm, demandDate: getToday() });
    setModalOpen(true);
  };
  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setForm({ ...initialForm, demandDate: getToday() });
  };
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.productId) return toast.error("Please select a product");
    if (!form.demandDate) return toast.error("Please select a demand date");
    const quantity = Number(form.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0)
      return toast.error("Quantity must be a positive whole number");
    try {
      setSaving(true);
      await createDemand({
        productId: Number(form.productId),
        demandDate: form.demandDate,
        quantity,
        source: form.source,
        notes: form.notes.trim(),
      });
      toast.success("Demand record created successfully");
      setModalOpen(false);
      setForm({ ...initialForm, demandDate: getToday() });
      await loadDemands(true, false);
    } catch (error) {
      console.error("Create Demand Error:", error);
      toast.error(
        error.response?.data?.message || "Unable to create demand record",
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedProduct = products.find(
    (product) => String(product.id) === String(form.productId),
  );

  return (
    <main className="demands-page">
      <section className="demands-hero">
        <div className="demands-hero-copy">
          <div className="demands-eyebrow">
            <Sparkles size={14} /> DEMAND INTELLIGENCE
          </div>
          <div className="flex items-start gap-3">
            <div className="demands-hero-icon">
              <Activity size={25} />
            </div>
            <div className="min-w-0">
              <h1>Demand Management</h1>
              <p>
                Capture demand signals, review historical activity, and keep
                your planning data organized.
              </p>
            </div>
          </div>
        </div>
        <div className="demands-actions">
          <button
            className="demands-btn demands-btn-secondary"
            type="button"
            onClick={() => {
              loadDemands(false, true);
              loadProducts();
            }}
            disabled={loading || refreshing}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />{" "}
            <span>{refreshing ? "Refreshing" : "Refresh data"}</span>
          </button>
          <button
            className="demands-btn demands-btn-primary"
            type="button"
            onClick={openAddModal}
            disabled={productsLoading || products.length === 0}
          >
            <Plus size={18} /> <span>Add demand</span>
          </button>
        </div>
      </section>

      <section className="demands-stats">
        <SummaryCard
          title="Demand records"
          value={formatNumber(summary.totalRecords)}
          icon={ClipboardList}
          tone="blue"
          hint="All recorded entries"
        />
        <SummaryCard
          title="Total demand quantity"
          value={formatNumber(summary.totalQuantity)}
          icon={TrendingUp}
          tone="green"
          hint="Units requested"
        />
        <SummaryCard
          title="Manual records"
          value={formatNumber(summary.manualCount)}
          icon={Activity}
          tone="orange"
          hint="Manually captured"
        />
        <SummaryCard
          title="Products with demand"
          value={formatNumber(summary.uniqueProducts)}
          icon={Package}
          tone="purple"
          hint="Unique products"
        />
      </section>

      <section className="demands-panel">
        <div className="demands-panel-head">
          <div>
            <div className="demands-section-kicker">RECORDS OVERVIEW</div>
            <h2>Demand records</h2>
            <p>
              Showing {formatNumber(filteredDemands.length)} of{" "}
              {formatNumber(demands.length)} records
            </p>
          </div>
          <div className="demands-filters">
            <label className="demands-search">
              <Search size={17} />
              <input
                type="search"
                placeholder="Search product, SKU or notes..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </label>
            <label className="demands-select-wrap">
              <Filter size={16} />
              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
              >
                <option value="ALL">All sources</option>
                <option value="SALE">Sale</option>
                <option value="ORDER">Order</option>
                <option value="MANUAL">Manual</option>
                <option value="IMPORT">Import</option>
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="demands-state">
            <RefreshCw className="animate-spin" size={28} />
            <span>Loading demand records...</span>
          </div>
        ) : filteredDemands.length === 0 ? (
          <div className="demands-empty">
            <div className="demands-empty-icon">
              <Boxes size={30} />
            </div>
            <h3>
              {demands.length === 0
                ? "No demand records yet"
                : "No matching records"}
            </h3>
            <p>
              {demands.length === 0
                ? "Create your first demand entry to start building demand history."
                : "Try another search term or change the source filter."}
            </p>
            {demands.length === 0 && products.length > 0 && (
              <button
                className="demands-btn demands-btn-primary"
                type="button"
                onClick={openAddModal}
              >
                <Plus size={17} /> Add first demand
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="demands-table-wrap">
              <table className="demands-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Demand date</th>
                    <th>Quantity</th>
                    <th>Source</th>
                    <th>Notes</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDemands.map((demand) => (
                    <tr key={demand.id}>
                      <td>
                        <div className="demands-product-cell">
                          <span className="demands-product-icon">
                            <Package size={17} />
                          </span>
                          <span>
                            <strong>
                              {demand.product?.name ||
                                `Product #${demand.productId}`}
                            </strong>
                            <small>Product demand</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="demands-sku">
                          {demand.product?.sku || "—"}
                        </span>
                      </td>
                      <td>
                        <span className="demands-date">
                          <CalendarDays size={15} />
                          {formatDate(demand.demandDate)}
                        </span>
                      </td>
                      <td>
                        <strong className="demands-quantity">
                          {formatNumber(demand.quantity)} <small>units</small>
                        </strong>
                      </td>
                      <td>
                        <SourceBadge source={demand.source} />
                      </td>
                      <td>
                        <span
                          className="demands-notes"
                          title={demand.notes || ""}
                        >
                          {demand.notes || "—"}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className="demands-view-btn"
                            onClick={() => setSelectedDemand(demand)}
                            aria-label="View demand details"
                          >
                            <Eye size={17} />
                            <span>View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="demands-mobile-list">
              {paginatedDemands.map((demand) => (
                <article className="demands-mobile-card" key={demand.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="demands-product-cell">
                      <span className="demands-product-icon">
                        <Package size={17} />
                      </span>
                      <span>
                        <strong>
                          {demand.product?.name ||
                            `Product #${demand.productId}`}
                        </strong>
                        <small>
                          {demand.product?.sku || "SKU unavailable"}
                        </small>
                      </span>
                    </div>
                    <SourceBadge source={demand.source} />
                  </div>
                  <div className="demands-mobile-meta">
                    <span>
                      <CalendarDays size={14} />
                      {formatDate(demand.demandDate)}
                    </span>
                    <strong>{formatNumber(demand.quantity)} units</strong>
                  </div>
                  {demand.notes && (
                    <p className="demands-mobile-notes">{demand.notes}</p>
                  )}
                  <button
                    type="button"
                    className="demands-mobile-view"
                    onClick={() => setSelectedDemand(demand)}
                  >
                    <Eye size={16} /> View details
                  </button>
                </article>
              ))}
            </div>

            <footer className="demands-pagination">
              <p>
                Showing{" "}
                <strong>
                  {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filteredDemands.length)}
                </strong>{" "}
                of {filteredDemands.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                >
                  <ChevronLeft size={17} />
                </button>
                <span>
                  Page <strong>{currentPage}</strong> of{" "}
                  <strong>{totalPages}</strong>
                </span>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </footer>
          </>
        )}
      </section>

      {modalOpen && (
        <div
          className="demands-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="demands-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="demand-modal-title"
          >
            <header className="demands-modal-head">
              <div className="demands-modal-title-icon">
                <TrendingUp size={21} />
              </div>
              <div className="min-w-0">
                <div className="demands-section-kicker">NEW ENTRY</div>
                <h2 id="demand-modal-title">Record new demand</h2>
                <p>Add a product demand signal to your records.</p>
              </div>
              <button
                type="button"
                className="demands-icon-btn"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </header>
            <form onSubmit={handleSubmit}>
              <div className="demands-modal-body">
                <div className="demands-form-intro">
                  <FileText size={17} />
                  <span>Demand information</span>
                  <small>Fields marked * are required</small>
                </div>
                <div className="demands-form-grid">
                  <FormField label="Product" required className="span-2">
                    <select
                      name="productId"
                      value={form.productId}
                      onChange={handleChange}
                      required
                      disabled={productsLoading}
                      className="demands-input"
                    >
                      <option value="">
                        {productsLoading
                          ? "Loading products..."
                          : "Choose a product"}
                      </option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </option>
                      ))}
                    </select>
                  </FormField>
                  {selectedProduct && (
                    <div className="demands-selected-product span-2">
                      <span className="demands-product-icon">
                        <Package size={17} />
                      </span>
                      <div>
                        <strong>{selectedProduct.name}</strong>
                        <small>SKU: {selectedProduct.sku || "—"}</small>
                      </div>
                      <span className="selected-check">Selected</span>
                    </div>
                  )}
                  <FormField label="Demand date" required>
                    <div className="demands-input-icon">
                      <CalendarDays size={16} />
                      <input
                        type="date"
                        name="demandDate"
                        value={form.demandDate}
                        onChange={handleChange}
                        required
                        className="demands-input"
                      />
                    </div>
                  </FormField>
                  <FormField label="Demand quantity" required>
                    <div className="demands-input-icon">
                      <Hash size={16} />
                      <input
                        type="number"
                        name="quantity"
                        min="1"
                        step="1"
                        value={form.quantity}
                        onChange={handleChange}
                        required
                        placeholder="e.g. 250"
                        className="demands-input"
                      />
                    </div>
                  </FormField>
                  <FormField label="Demand source" required className="span-2">
                    <select
                      name="source"
                      value={form.source}
                      onChange={handleChange}
                      required
                      className="demands-input"
                    >
                      <option value="MANUAL">Manual entry</option>
                      <option value="SALE">Sales</option>
                      <option value="ORDER">Customer order</option>
                      <option value="IMPORT">Data import</option>
                    </select>
                  </FormField>
                  <FormField label="Notes" className="span-2">
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      rows={3}
                      maxLength={1000}
                      placeholder="Add context, reason, or additional demand information..."
                      className="demands-input demands-textarea"
                    />
                    <small className="demands-helper">
                      {form.notes.length}/1000 characters
                    </small>
                  </FormField>
                </div>
                <div className="demands-form-tip">
                  <Sparkles size={16} />
                  <span>
                    Accurate demand records help improve forecasting and
                    replenishment decisions.
                  </span>
                </div>
              </div>
              <footer className="demands-modal-foot">
                <button
                  type="button"
                  className="demands-btn demands-btn-secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="demands-btn demands-btn-primary"
                  disabled={saving || productsLoading || products.length === 0}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={17} /> Save demand record
                    </>
                  )}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {selectedDemand && (
        <div
          className="demands-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedDemand(null);
          }}
        >
          <section
            className="demands-modal demands-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="demand-details-title"
          >
            <header className="demands-modal-head">
              <div className="demands-modal-title-icon">
                <Eye size={21} />
              </div>
              <div className="min-w-0">
                <div className="demands-section-kicker">RECORD INFORMATION</div>
                <h2 id="demand-details-title">Demand details</h2>
                <p>Review the selected demand record.</p>
              </div>
              <button
                type="button"
                className="demands-icon-btn"
                onClick={() => setSelectedDemand(null)}
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </header>
            <div className="demands-details-body">
              <div className="demands-details-product">
                <span className="demands-product-icon">
                  <Package size={20} />
                </span>
                <div>
                  <strong>
                    {selectedDemand.product?.name ||
                      `Product #${selectedDemand.productId}`}
                  </strong>
                  <small>SKU: {selectedDemand.product?.sku || "—"}</small>
                </div>
                <SourceBadge source={selectedDemand.source} />
              </div>
              <div className="demands-detail-grid">
                <DetailItem
                  label="Demand date"
                  value={formatDate(selectedDemand.demandDate)}
                  icon={CalendarDays}
                />
                <DetailItem
                  label="Demand quantity"
                  value={`${formatNumber(selectedDemand.quantity)} units`}
                  icon={TrendingUp}
                />
                <DetailItem
                  label="Source"
                  value={selectedDemand.source || "—"}
                  icon={Activity}
                />
                <DetailItem
                  label="Record ID"
                  value={`#${selectedDemand.id}`}
                  icon={Hash}
                />
              </div>
              <div className="demands-detail-notes">
                <span>Notes</span>
                <p>
                  {selectedDemand.notes ||
                    "No notes available for this record."}
                </p>
              </div>
            </div>
            <footer className="demands-modal-foot">
              <button
                type="button"
                className="demands-btn demands-btn-secondary"
                onClick={() => setSelectedDemand(null)}
              >
                Close details
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}

function SummaryCard({ title, value, icon: Icon, tone, hint }) {
  return (
    <article className={`demands-stat-card tone-${tone}`}>
      <div className="demands-stat-top">
        <span>{title}</span>
        <span className="demands-stat-icon">
          <Icon size={20} />
        </span>
      </div>
      <strong>{value}</strong>
      <small>{hint}</small>
      <ArrowUpRight className="demands-stat-arrow" size={16} />
    </article>
  );
}
function SourceBadge({ source }) {
  const normalized = source || "UNKNOWN";
  return (
    <span className={`demands-source source-${normalized.toLowerCase()}`}>
      {normalized.replaceAll("_", " ")}
    </span>
  );
}
function FormField({ label, required, children, className = "" }) {
  return (
    <label className={`demands-field ${className}`}>
      <span>
        {label}
        {required && <b> *</b>}
      </span>
      {children}
    </label>
  );
}
function DetailItem({ label, value, icon: Icon }) {
  return (
    <div className="demands-detail-item">
      <span className="demands-detail-icon">
        <Icon size={16} />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
