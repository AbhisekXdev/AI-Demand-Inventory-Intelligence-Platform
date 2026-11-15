import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Package,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Search,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  ChevronLeft,
  ChevronRight,
  Boxes,
} from "lucide-react";

import { toast } from "react-toastify";

import {
  getInventory,
  createInventory,
  adjustStock,
} from "../services/inventoryService";

import { getProducts } from "../services/productService";

const PAGE_SIZE = 8;

const emptyInventoryForm = {
  productId: "",
  quantity: "0",
  reservedQuantity: "0",
  reorderLevel: "10",
  maxStockLevel: "",
};

const emptyMovementForm = {
  type: "STOCK_IN",
  quantity: "",
  notes: "",
};

const getArray = (response, key) => {
  if (Array.isArray(response?.[key])) return response[key];

  if (Array.isArray(response?.data?.[key])) {
    return response.data[key];
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response)) {
    return response;
  }

  return [];
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const getStockStatus = (item) => {
  const quantity = Number(item.quantity || 0);
  const reserved = Number(item.reservedQuantity || 0);
  const available = Math.max(0, quantity - reserved);
  const reorder = Number(item.reorderLevel || 0);

  if (available <= 0) return "OUT_OF_STOCK";

  if (available <= reorder) return "LOW_STOCK";

  return "HEALTHY";
};

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);

  const [selectedInventory, setSelectedInventory] = useState(null);

  const [inventoryForm, setInventoryForm] = useState(
    emptyInventoryForm
  );

  const [movementForm, setMovementForm] = useState(
    emptyMovementForm
  );

  // Load inventory and products
  const loadData = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const startedAt = Date.now();

      const [inventoryResult, productsResult] =
        await Promise.allSettled([
          getInventory(),
          getProducts(),
        ]);

      // Minimum loading visibility: 700 ms
      const remaining = Math.max(
        0,
        700 - (Date.now() - startedAt)
      );

      if (remaining > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, remaining)
        );
      }

      if (inventoryResult.status === "fulfilled") {
        setInventory(
          getArray(inventoryResult.value, "inventory")
        );
      } else {
        throw inventoryResult.reason;
      }

      if (productsResult.status === "fulfilled") {
        setProducts(
          getArray(productsResult.value, "products")
        );
      } else {
        setProducts([]);

        toast.warning(
          "Inventory loaded, but product options could not be loaded."
        );
      }

      if (manual) {
        toast.success("Inventory refreshed successfully.");
      }
    } catch (error) {
      console.error("Inventory load error:", error);

      toast.error(
        getErrorMessage(error, "Unable to load inventory.")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Products without inventory records
  const inventoryProductIds = useMemo(
    () =>
      new Set(
        inventory.map((item) => Number(item.productId))
      ),
    [inventory]
  );

  const productsWithoutInventory = useMemo(
    () =>
      products.filter(
        (product) =>
          product.isActive !== false &&
          !inventoryProductIds.has(Number(product.id))
      ),
    [products, inventoryProductIds]
  );

  // Search and status filtering
  const filteredInventory = useMemo(() => {
    const term = search.trim().toLowerCase();

    return inventory.filter((item) => {
      const name = item.product?.name || "";
      const sku = item.product?.sku || "";

      const matchesSearch =
        !term ||
        name.toLowerCase().includes(term) ||
        sku.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "ALL" ||
        getStockStatus(item) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [inventory, search, statusFilter]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredInventory.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedInventory = filteredInventory.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Summary values
  const totalUnits = inventory.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

  const lowStockCount = inventory.filter(
    (item) => getStockStatus(item) === "LOW_STOCK"
  ).length;

  const outOfStockCount = inventory.filter(
    (item) => getStockStatus(item) === "OUT_OF_STOCK"
  ).length;

  const healthyCount = inventory.filter(
    (item) => getStockStatus(item) === "HEALTHY"
  ).length;

  // Open Add Inventory modal
  const openInventoryModal = () => {
    setInventoryForm(emptyInventoryForm);
    setShowInventoryModal(true);
  };

  // Open Stock In / Stock Out modal
  const openMovementModal = (item, type) => {
    setSelectedInventory(item);

    setMovementForm({
      ...emptyMovementForm,
      type,
    });

    setShowMovementModal(true);
  };

  // Create inventory record
  const handleCreateInventory = async (event) => {
    event.preventDefault();

    if (!inventoryForm.productId) {
      toast.error("Please select a product.");
      return;
    }

    const quantity = Number(inventoryForm.quantity);
    const reservedQuantity = Number(
      inventoryForm.reservedQuantity
    );
    const reorderLevel = Number(
      inventoryForm.reorderLevel
    );

    const maxStockLevel =
      inventoryForm.maxStockLevel === ""
        ? null
        : Number(inventoryForm.maxStockLevel);

    if (
      !Number.isFinite(quantity) ||
      !Number.isFinite(reservedQuantity) ||
      !Number.isFinite(reorderLevel) ||
      quantity < 0 ||
      reservedQuantity < 0 ||
      reorderLevel < 0 ||
      (maxStockLevel !== null &&
        (!Number.isFinite(maxStockLevel) ||
          maxStockLevel < 0))
    ) {
      toast.error("Enter valid non-negative stock values.");
      return;
    }

    if (reservedQuantity > quantity) {
      toast.error(
        "Reserved quantity cannot exceed on-hand quantity."
      );
      return;
    }

    try {
      setSaving(true);

      await createInventory({
        productId: Number(inventoryForm.productId),
        quantity,
        reservedQuantity,
        reorderLevel,
        maxStockLevel,
      });

      toast.success(
        "Inventory record created successfully."
      );

      setShowInventoryModal(false);
      setInventoryForm(emptyInventoryForm);

      await loadData();
    } catch (error) {
      console.error("Create inventory error:", error);

      toast.error(
        getErrorMessage(
          error,
          "Unable to create inventory record."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // Stock In / Stock Out
  const handleStockAdjustment = async (event) => {
    event.preventDefault();

    const quantity = Number(movementForm.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("Enter a quantity greater than zero.");
      return;
    }

    if (!selectedInventory?.productId) {
      toast.error("Product information is missing.");
      return;
    }

    try {
      setSaving(true);

      await adjustStock(selectedInventory.productId, {
        type: movementForm.type,
        quantity,
        notes: movementForm.notes.trim(),
      });

      toast.success(
        movementForm.type === "STOCK_IN"
          ? "Stock added successfully."
          : "Stock removed successfully."
      );

      setShowMovementModal(false);
      setSelectedInventory(null);
      setMovementForm(emptyMovementForm);

      await loadData();
    } catch (error) {
      console.error("Stock adjustment error:", error);

      toast.error(
        getErrorMessage(
          error,
          "Unable to adjust stock."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
            <Package size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Inventory Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor stock levels, availability and stock movements
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                refreshing || loading
                  ? "animate-spin"
                  : ""
              }
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={openInventoryModal}
            disabled={productsWithoutInventory.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} />
            Add Inventory
          </button>

        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <SummaryCard
          title="Total Stock Units"
          value={totalUnits}
          icon={Boxes}
          color="blue"
        />

        <SummaryCard
          title="Healthy Stock"
          value={healthyCount}
          icon={CheckCircle}
          color="green"
        />

        <SummaryCard
          title="Low Stock Products"
          value={lowStockCount}
          icon={AlertTriangle}
          color="orange"
        />

        <SummaryCard
          title="Out of Stock"
          value={outOfStockCount}
          icon={AlertTriangle}
          color="red"
        />

      </div>

      {/* Inventory Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h2 className="font-bold text-slate-800">
              Inventory Records
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Showing{" "}
              {filteredInventory.length === 0
                ? 0
                : (currentPage - 1) * PAGE_SIZE + 1}
              {" "}to{" "}
              {Math.min(
                currentPage * PAGE_SIZE,
                filteredInventory.length
              )}
              {" "}of {filteredInventory.length} records
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5">
              <Search size={17} className="text-slate-400" />

              <input
                type="search"
                placeholder="Search product or SKU..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="w-full text-sm outline-none sm:w-56"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="HEALTHY">Healthy</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>

          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
            <RefreshCw
              className="animate-spin text-blue-600"
              size={26}
            />
            Loading inventory...
          </div>
        ) : filteredInventory.length === 0 ? (

          <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">

            <Package size={36} className="mb-3 text-slate-300" />

            <p className="font-semibold text-slate-700">
              No inventory records found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {inventory.length === 0
                ? "Create an inventory record for an existing product to get started."
                : "Try changing your search or status filter."}
            </p>

            {productsWithoutInventory.length > 0 && (
              <button
                type="button"
                onClick={openInventoryModal}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Add Inventory
              </button>
            )}

          </div>

        ) : (

          <>
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1050px] text-left text-sm">

                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Product</th>
                    <th className="px-5 py-4">On Hand</th>
                    <th className="px-5 py-4">Reserved</th>
                    <th className="px-5 py-4">Available</th>
                    <th className="px-5 py-4">Reorder Level</th>
                    <th className="px-5 py-4">Max Stock</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {paginatedInventory.map((item) => {
                    const quantity = Number(item.quantity || 0);
                    const reserved = Number(item.reservedQuantity || 0);
                    const available = Math.max(0, quantity - reserved);
                    const reorder = Number(item.reorderLevel || 0);
                    const status = getStockStatus(item);

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50"
                      >

                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">
                            {item.product?.name || "Unknown Product"}
                          </p>

                          <p className="text-xs text-slate-400">
                            SKU: {item.product?.sku || "N/A"}
                          </p>
                        </td>

                        <td className="px-5 py-4 font-semibold">
                          {quantity}
                        </td>

                        <td className="px-5 py-4">
                          {reserved}
                        </td>

                        <td className="px-5 py-4 font-semibold text-blue-600">
                          {available}
                        </td>

                        <td className="px-5 py-4">
                          {reorder}
                        </td>

                        <td className="px-5 py-4">
                          {item.maxStockLevel ?? "—"}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={status} />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openMovementModal(item, "STOCK_IN")
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                            >
                              <ArrowDownToLine size={15} />
                              In
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openMovementModal(item, "STOCK_OUT")
                              }
                              disabled={quantity <= 0}
                              className="inline-flex items-center gap-1 rounded-lg border border-orange-200 px-2.5 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ArrowUpFromLine size={15} />
                              Out
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })}

                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-xs text-slate-500">
                Page {currentPage} of {totalPages}
              </p>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setPage((value) => Math.max(1, value - 1))
                  }
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((value) =>
                      Math.min(totalPages, value + 1)
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>

              </div>
            </div>
          </>

        )}

      </section>

      {/* Add Inventory Modal */}
      {showInventoryModal && (
        <Modal
          title="Add Inventory"
          onClose={() =>
            !saving && setShowInventoryModal(false)
          }
        >

          <form
            onSubmit={handleCreateInventory}
            className="space-y-4"
          >

            <FormField label="Product" required>
              <select
                required
                value={inventoryForm.productId}
                onChange={(event) => {
                  const product = productsWithoutInventory.find(
                    (item) =>
                      String(item.id) === event.target.value
                  );

                  setInventoryForm((current) => ({
                    ...current,
                    productId: event.target.value,
                    reorderLevel: String(
                      product?.reorderLevel ?? 10
                    ),
                  }));
                }}
                className="form-input"
              >
                <option value="">Select a product</option>

                {productsWithoutInventory.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name} ({product.sku})
                  </option>
                ))}

              </select>
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <FormField
                label="Initial On-Hand Quantity"
                required
              >
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={inventoryForm.quantity}
                  onChange={(event) =>
                    setInventoryForm({
                      ...inventoryForm,
                      quantity: event.target.value,
                    })
                  }
                />
              </FormField>

              <FormField label="Reserved Quantity">
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="1"
                  value={inventoryForm.reservedQuantity}
                  onChange={(event) =>
                    setInventoryForm({
                      ...inventoryForm,
                      reservedQuantity: event.target.value,
                    })
                  }
                />
              </FormField>

              <FormField label="Reorder Level" required>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={inventoryForm.reorderLevel}
                  onChange={(event) =>
                    setInventoryForm({
                      ...inventoryForm,
                      reorderLevel: event.target.value,
                    })
                  }
                />
              </FormField>

              <FormField label="Maximum Stock Level">
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Optional"
                  value={inventoryForm.maxStockLevel}
                  onChange={(event) =>
                    setInventoryForm({
                      ...inventoryForm,
                      maxStockLevel: event.target.value,
                    })
                  }
                />
              </FormField>

            </div>

            <ModalActions
              onCancel={() => setShowInventoryModal(false)}
              saving={saving}
              submitLabel="Create Inventory"
            />

          </form>
        </Modal>
      )}

      {/* Stock Movement Modal */}
      {showMovementModal && selectedInventory && (
        <Modal
          title={
            movementForm.type === "STOCK_IN"
              ? "Stock In"
              : "Stock Out"
          }
          onClose={() =>
            !saving && setShowMovementModal(false)
          }
        >

          <form
            onSubmit={handleStockAdjustment}
            className="space-y-4"
          >

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="font-semibold text-slate-800">
                {selectedInventory.product?.name || "Selected Product"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                SKU: {selectedInventory.product?.sku || "N/A"}
              </p>

              <p className="mt-2 text-sm text-slate-600">
                Current on-hand stock:{" "}
                <strong>
                  {Number(selectedInventory.quantity || 0)}
                </strong>
              </p>

            </div>

            <FormField label="Movement Type">
              <select
                value={movementForm.type}
                onChange={(event) =>
                  setMovementForm({
                    ...movementForm,
                    type: event.target.value,
                  })
                }
                className="form-input"
              >
                <option value="STOCK_IN">
                  Stock In — Add quantity
                </option>

                <option value="STOCK_OUT">
                  Stock Out — Remove quantity
                </option>
              </select>
            </FormField>

            <FormField label="Quantity" required>
              <input
                className="form-input"
                type="number"
                min="1"
                step="1"
                required
                value={movementForm.quantity}
                onChange={(event) =>
                  setMovementForm({
                    ...movementForm,
                    quantity: event.target.value,
                  })
                }
                placeholder="Enter quantity"
              />
            </FormField>

            <FormField label="Notes">
              <textarea
                className="form-input min-h-24 resize-y"
                value={movementForm.notes}
                onChange={(event) =>
                  setMovementForm({
                    ...movementForm,
                    notes: event.target.value,
                  })
                }
                placeholder="Reason or reference (optional)"
              />
            </FormField>

            <ModalActions
              onCancel={() => setShowMovementModal(false)}
              saving={saving}
              submitLabel={
                movementForm.type === "STOCK_IN"
                  ? "Add Stock"
                  : "Remove Stock"
              }
            />

          </form>
        </Modal>
      )}

    </div>
  );
}

// Summary Card
function SummaryCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

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

// Stock Status Badge
function StatusBadge({ status }) {
  const config = {
    HEALTHY: "bg-emerald-100 text-emerald-700",
    LOW_STOCK: "bg-orange-100 text-orange-700",
    OUT_OF_STOCK: "bg-red-100 text-red-700",
  };

  const label = {
    HEALTHY: "Healthy",
    LOW_STOCK: "Low Stock",
    OUT_OF_STOCK: "Out of Stock",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${config[status]}`}
    >
      {label[status]}
    </span>
  );
}

// Modal
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

          <h2 className="text-lg font-bold text-slate-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>

        </div>

        <div className="p-5">
          {children}
        </div>

      </div>
    </div>
  );
}

// Form Field
function FormField({ label, required = false, children }) {
  return (
    <label className="block space-y-1.5">

      <span className="text-sm font-medium text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      {children}

    </label>
  );
}

// Modal Actions
function ModalActions({
  onCancel,
  saving,
  submitLabel,
}) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">

      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {saving && (
          <RefreshCw size={15} className="animate-spin" />
        )}

        {saving ? "Saving..." : submitLabel}
      </button>

    </div>
  );
}