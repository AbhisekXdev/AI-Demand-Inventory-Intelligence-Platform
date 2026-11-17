
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
  Warehouse,
  TrendingUp,
  Layers3,
  SlidersHorizontal,
  PackagePlus,
  Minus,
  Info,
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
  if (Array.isArray(response?.data?.[key])) return response.data[key];
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
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

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN");

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
  const [inventoryForm, setInventoryForm] = useState(emptyInventoryForm);
  const [movementForm, setMovementForm] = useState(emptyMovementForm);

  // Load inventory and products
  const loadData = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [inventoryResult, productsResult] = await Promise.allSettled([
        getInventory(),
        getProducts(),
      ]);

      if (inventoryResult.status === "fulfilled") {
        setInventory(getArray(inventoryResult.value, "inventory"));
      } else {
        throw inventoryResult.reason;
      }

      if (productsResult.status === "fulfilled") {
        setProducts(getArray(productsResult.value, "products"));
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
      toast.error(getErrorMessage(error, "Unable to load inventory."));
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
    () => new Set(inventory.map((item) => Number(item.productId))),
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
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  const totalAvailable = inventory.reduce(
    (total, item) =>
      total +
      Math.max(
        0,
        Number(item.quantity || 0) -
          Number(item.reservedQuantity || 0)
      ),
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

  // Selected product for add inventory preview
  const selectedProduct = productsWithoutInventory.find(
    (product) => String(product.id) === inventoryForm.productId
  );

  const initialQuantity = Number(inventoryForm.quantity || 0);
  const initialReserved = Number(inventoryForm.reservedQuantity || 0);
  const initialAvailable = Math.max(
    0,
    initialQuantity - initialReserved
  );

  // Open Add Inventory modal
  const openInventoryModal = () => {
    setInventoryForm(emptyInventoryForm);
    setShowInventoryModal(true);
  };

  // Close Add Inventory modal
  const closeInventoryModal = () => {
    if (saving) return;
    setShowInventoryModal(false);
    setInventoryForm(emptyInventoryForm);
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

  const closeMovementModal = () => {
    if (saving) return;
    setShowMovementModal(false);
    setSelectedInventory(null);
    setMovementForm(emptyMovementForm);
  };

  // Update inventory form
  const updateInventoryField = (field, value) => {
    setInventoryForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  // Create inventory record
  const handleCreateInventory = async (event) => {
    event.preventDefault();

    if (!inventoryForm.productId) {
      toast.error("Please select a product.");
      return;
    }

    const quantity = Number(inventoryForm.quantity);
    const reservedQuantity = Number(inventoryForm.reservedQuantity);
    const reorderLevel = Number(inventoryForm.reorderLevel);

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
        (!Number.isFinite(maxStockLevel) || maxStockLevel < 0))
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

    if (maxStockLevel !== null && maxStockLevel < quantity) {
      toast.error(
        "Maximum stock level cannot be less than on-hand quantity."
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

      toast.success("Inventory record created successfully.");

      setShowInventoryModal(false);
      setInventoryForm(emptyInventoryForm);

      await loadData();
    } catch (error) {
      console.error("Create inventory error:", error);
      toast.error(
        getErrorMessage(error, "Unable to create inventory record.")
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

    if (!Number.isInteger(quantity)) {
      toast.error("Please enter a whole-number quantity.");
      return;
    }

    if (!selectedInventory?.productId) {
      toast.error("Product information is missing.");
      return;
    }

    if (
      movementForm.type === "STOCK_OUT" &&
      quantity > Number(selectedInventory.quantity || 0)
    ) {
      toast.error("Stock out quantity exceeds current on-hand stock.");
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
        getErrorMessage(error, "Unable to adjust stock.")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="inventory-page mx-auto max-w-[1600px] space-y-7 pb-8">

      {/* PAGE HEADER */}
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-200">
            <Warehouse size={27} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Inventory
              </h1>

              <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Management
              </span>
            </div>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Monitor stock levels, availability and inventory movements.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                refreshing || loading ? "animate-spin" : ""
              }
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={openInventoryModal}
            disabled={productsWithoutInventory.length === 0}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />
            Add Inventory
          </button>
        </div>
      </section>

      {/* SUMMARY CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Stock Units"
          value={formatNumber(totalUnits)}
          subtitle="Total physical inventory"
          icon={Boxes}
          color="blue"
        />

        <SummaryCard
          title="Available Units"
          value={formatNumber(totalAvailable)}
          subtitle="Stock after reservations"
          icon={Package}
          color="violet"
        />

        <SummaryCard
          title="Healthy Stock"
          value={healthyCount}
          subtitle="Products above reorder level"
          icon={CheckCircle}
          color="green"
        />

        <SummaryCard
          title="Stock Alerts"
          value={lowStockCount + outOfStockCount}
          subtitle={`${lowStockCount} low stock · ${outOfStockCount} out of stock`}
          icon={AlertTriangle}
          color="orange"
        />
      </section>

      {/* INVENTORY TABLE */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">

        {/* TABLE HEADER */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Layers3 size={19} className="text-blue-600" />
              <h2 className="text-base font-bold tracking-tight text-slate-900">
                Inventory Records
              </h2>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                {inventory.length}
              </span>
            </div>

            <p className="mt-1 text-xs font-medium text-slate-500">
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
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 transition-all focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
              <Search size={17} className="shrink-0 text-slate-400" />

              <input
                type="search"
                placeholder="Search product or SKU..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="w-full cursor-text bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:font-normal placeholder:text-slate-400 sm:w-56"
              />
            </div>

            <div className="relative">
              <SlidersHorizontal
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 sm:w-auto"
              >
                <option value="ALL">All Status</option>
                <option value="HEALTHY">Healthy</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-sm font-medium text-slate-500">
            <div className="rounded-2xl bg-blue-50 p-4 text-blue-600">
              <RefreshCw className="animate-spin" size={27} />
            </div>
            Loading inventory records...
          </div>
        ) : filteredInventory.length === 0 ? (
          <EmptyState
            title="No inventory records found"
            description={
              inventory.length === 0
                ? "Add an inventory record for an existing product to get started."
                : "Try changing your search or status filter."
            }
            action={
              inventory.length === 0 &&
              productsWithoutInventory.length > 0
            }
            onAction={openInventoryModal}
          />
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-5 py-4">On Hand</th>
                    <th className="px-5 py-4">Reserved</th>
                    <th className="px-5 py-4">Available</th>
                    <th className="px-5 py-4">Reorder Level</th>
                    <th className="px-5 py-4">Max Stock</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
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
                        className="group transition-colors duration-150 hover:bg-blue-50/40"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-blue-100 group-hover:text-blue-600">
                              <Package size={19} />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[220px] truncate font-bold text-slate-800">
                                {item.product?.name || "Unknown Product"}
                              </p>
                              <p className="mt-1 text-xs font-medium text-slate-400">
                                SKU: {item.product?.sku || "N/A"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 font-bold tabular-nums text-slate-800">
                          {formatNumber(quantity)}
                        </td>

                        <td className="px-5 py-4 font-medium tabular-nums text-slate-600">
                          {formatNumber(reserved)}
                        </td>

                        <td className="px-5 py-4 font-bold tabular-nums text-blue-700">
                          {formatNumber(available)}
                        </td>

                        <td className="px-5 py-4 font-medium tabular-nums text-slate-600">
                          {formatNumber(reorder)}
                        </td>

                        <td className="px-5 py-4 font-medium tabular-nums text-slate-600">
                          {item.maxStockLevel ?? "—"}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={status} />
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openMovementModal(item, "STOCK_IN")
                              }
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2 text-xs font-bold text-emerald-700 transition-all hover:border-emerald-300 hover:bg-emerald-100"
                            >
                              <ArrowDownToLine size={14} />
                              Stock In
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openMovementModal(item, "STOCK_OUT")
                              }
                              disabled={quantity <= 0}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50/50 px-3 py-2 text-xs font-bold text-orange-700 transition-all hover:border-orange-300 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ArrowUpFromLine size={14} />
                              Stock Out
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="grid gap-3 p-4 md:hidden">
              {paginatedInventory.map((item) => {
                const quantity = Number(item.quantity || 0);
                const reserved = Number(item.reservedQuantity || 0);
                const available = Math.max(0, quantity - reserved);
                const status = getStockStatus(item);

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <Package size={19} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {item.product?.name || "Unknown Product"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            SKU: {item.product?.sku || "N/A"}
                          </p>
                        </div>
                      </div>

                      <StatusBadge status={status} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MobileValue label="On Hand" value={quantity} />
                      <MobileValue label="Reserved" value={reserved} />
                      <MobileValue
                        label="Available"
                        value={available}
                        highlight
                      />
                      <MobileValue
                        label="Reorder Level"
                        value={item.reorderLevel}
                      />
                    </div>

                    <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() =>
                          openMovementModal(item, "STOCK_IN")
                        }
                        className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <ArrowDownToLine size={15} />
                        Stock In
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openMovementModal(item, "STOCK_OUT")
                        }
                        disabled={quantity <= 0}
                        className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-50 px-3 py-2.5 text-xs font-bold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowUpFromLine size={15} />
                        Stock Out
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PAGINATION */}
            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-slate-500">
                Page <strong className="text-slate-800">{currentPage}</strong>{" "}
                of <strong className="text-slate-800">{totalPages}</strong>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPage((value) => Math.max(1, value - 1))
                  }
                  disabled={currentPage === 1}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                  className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ADD INVENTORY MODAL */}
      {showInventoryModal && (
        <Modal
          title="Add Inventory"
          subtitle="Create a stock record for an existing product."
          icon={PackagePlus}
          onClose={closeInventoryModal}
          accent="blue"
          wide
        >
          <form onSubmit={handleCreateInventory} className="space-y-6">

            {/* PRODUCT SELECTION */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-xs font-extrabold text-blue-700">
                  01
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Product Information
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <FormField label="Select Product" required>
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
                    className="form-input h-12"
                  >
                    <option value="">Choose a product to add...</option>

                    {productsWithoutInventory.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku || "No SKU"})
                      </option>
                    ))}
                  </select>
                </FormField>

                {selectedProduct ? (
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-blue-100 bg-white p-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Package size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {selectedProduct.name}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        SKU: {selectedProduct.sku || "Not available"}
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                      Selected
                    </span>
                  </div>
                ) : (
                  <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <Info size={14} />
                    Select a product to configure its inventory.
                  </p>
                )}
              </div>
            </div>

            {/* STOCK CONFIGURATION */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-extrabold text-indigo-700">
                  02
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Stock Configuration
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Initial On-Hand Quantity"
                  required
                  hint="Total physical stock"
                >
                  <input
                    className="form-input h-12"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={inventoryForm.quantity}
                    onChange={(event) =>
                      updateInventoryField("quantity", event.target.value)
                    }
                    placeholder="Enter quantity"
                  />
                </FormField>

                <FormField
                  label="Reserved Quantity"
                  hint="Stock already committed"
                >
                  <input
                    className="form-input h-12"
                    type="number"
                    min="0"
                    step="1"
                    value={inventoryForm.reservedQuantity}
                    onChange={(event) =>
                      updateInventoryField(
                        "reservedQuantity",
                        event.target.value
                      )
                    }
                    placeholder="0"
                  />
                </FormField>

                <FormField
                  label="Reorder Level"
                  required
                  hint="Alert threshold for low stock"
                >
                  <input
                    className="form-input h-12"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={inventoryForm.reorderLevel}
                    onChange={(event) =>
                      updateInventoryField(
                        "reorderLevel",
                        event.target.value
                      )
                    }
                    placeholder="10"
                  />
                </FormField>

                <FormField
                  label="Maximum Stock Level"
                  hint="Optional stock capacity"
                >
                  <input
                    className="form-input h-12"
                    type="number"
                    min="0"
                    step="1"
                    value={inventoryForm.maxStockLevel}
                    onChange={(event) =>
                      updateInventoryField(
                        "maxStockLevel",
                        event.target.value
                      )
                    }
                    placeholder="No limit"
                  />
                </FormField>
              </div>
            </div>

            {/* LIVE STOCK PREVIEW */}
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/70 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Stock Overview
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Live preview based on your entries
                  </p>
                </div>

                <div className="rounded-lg bg-white p-2 text-blue-600 shadow-sm">
                  <TrendingUp size={18} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <PreviewValue
                  label="On Hand"
                  value={formatNumber(initialQuantity)}
                />
                <PreviewValue
                  label="Reserved"
                  value={formatNumber(initialReserved)}
                />
                <PreviewValue
                  label="Available"
                  value={formatNumber(initialAvailable)}
                  highlight
                />
              </div>

              {initialReserved > initialQuantity && (
                <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-600">
                  <AlertTriangle size={14} />
                  Reserved stock cannot exceed on-hand stock.
                </p>
              )}

              {inventoryForm.maxStockLevel !== "" &&
                Number(inventoryForm.maxStockLevel) < initialQuantity && (
                  <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-600">
                    <AlertTriangle size={14} />
                    Maximum stock must be at least the on-hand quantity.
                  </p>
                )}
            </div>

            {/* FORM ACTIONS */}
            <ModalActions
              onCancel={closeInventoryModal}
              saving={saving}
              submitLabel="Create Inventory"
              savingLabel="Creating Inventory..."
              submitIcon={PackagePlus}
            />
          </form>
        </Modal>
      )}

      {/* STOCK MOVEMENT MODAL */}
      {showMovementModal && selectedInventory && (
        <Modal
          title={
            movementForm.type === "STOCK_IN"
              ? "Stock In"
              : "Stock Out"
          }
          subtitle="Record an inventory stock movement."
          icon={
            movementForm.type === "STOCK_IN"
              ? ArrowDownToLine
              : ArrowUpFromLine
          }
          onClose={closeMovementModal}
          accent={
            movementForm.type === "STOCK_IN" ? "green" : "orange"
          }
        >
          <form onSubmit={handleStockAdjustment} className="space-y-5">

            {/* PRODUCT SUMMARY */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <Package size={21} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {selectedInventory.product?.name || "Selected Product"}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    SKU: {selectedInventory.product?.sku || "N/A"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <PreviewValue
                  label="Current On Hand"
                  value={formatNumber(selectedInventory.quantity)}
                />
                <PreviewValue
                  label="Available"
                  value={formatNumber(
                    Math.max(
                      0,
                      Number(selectedInventory.quantity || 0) -
                        Number(selectedInventory.reservedQuantity || 0)
                    )
                  )}
                />
              </div>
            </div>

            {/* MOVEMENT TYPE */}
            <FormField label="Movement Type" required>
              <select
                value={movementForm.type}
                onChange={(event) =>
                  setMovementForm({
                    ...movementForm,
                    type: event.target.value,
                  })
                }
                className="form-input h-12"
              >
                <option value="STOCK_IN">Stock In — Add quantity</option>
                <option value="STOCK_OUT">Stock Out — Remove quantity</option>
              </select>
            </FormField>

            {/* QUANTITY */}
            <FormField
              label="Quantity"
              required
              hint="Enter a whole number greater than zero"
            >
              <input
                className="form-input h-12"
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

            {/* NOTES */}
            <FormField label="Notes" hint="Optional reference or reason">
              <textarea
                className="form-input min-h-24 resize-y"
                value={movementForm.notes}
                onChange={(event) =>
                  setMovementForm({
                    ...movementForm,
                    notes: event.target.value,
                  })
                }
                placeholder="Enter movement notes..."
              />
            </FormField>

            <ModalActions
              onCancel={closeMovementModal}
              saving={saving}
              submitLabel={
                movementForm.type === "STOCK_IN"
                  ? "Confirm Stock In"
                  : "Confirm Stock Out"
              }
              savingLabel="Processing..."
              submitIcon={
                movementForm.type === "STOCK_IN"
                  ? ArrowDownToLine
                  : ArrowUpFromLine
              }
              variant={
                movementForm.type === "STOCK_IN" ? "green" : "orange"
              }
            />
          </form>
        </Modal>
      )}
    </div>
  );
}

// SUMMARY CARD
function SummaryCard({ title, value, subtitle, icon: Icon, color }) {
  const themes = {
    blue: {
      icon: "bg-blue-50 text-blue-600 ring-blue-100",
      glow: "bg-blue-500/5",
      accent: "bg-blue-500",
    },
    violet: {
      icon: "bg-violet-50 text-violet-600 ring-violet-100",
      glow: "bg-violet-500/5",
      accent: "bg-violet-500",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-600 ring-emerald-100",
      glow: "bg-emerald-500/5",
      accent: "bg-emerald-500",
    },
    orange: {
      icon: "bg-orange-50 text-orange-600 ring-orange-100",
      glow: "bg-orange-500/5",
      accent: "bg-orange-500",
    },
  };

  const theme = themes[color] || themes.blue;

  return (
    <div className="group relative isolate overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg sm:p-6">
      <div
        className={`absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl ${theme.glow} transition-transform duration-500 group-hover:scale-150`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-slate-500">
            {title}
          </p>

          <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            {value}
          </h3>

          <p className="mt-2 text-xs font-medium text-slate-400">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${theme.icon}`}
        >
          <Icon size={23} strokeWidth={2} />
        </div>
      </div>

      <div
        className={`absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-500 group-hover:w-full ${theme.accent}`}
      />
    </div>
  );
}

// STATUS BADGE
function StatusBadge({ status }) {
  const config = {
    HEALTHY: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    LOW_STOCK: "bg-orange-50 text-orange-700 ring-orange-100",
    OUT_OF_STOCK: "bg-red-50 text-red-700 ring-red-100",
  };

  const labels = {
    HEALTHY: "Healthy",
    LOW_STOCK: "Low Stock",
    OUT_OF_STOCK: "Out of Stock",
  };

  const dots = {
    HEALTHY: "bg-emerald-500",
    LOW_STOCK: "bg-orange-500",
    OUT_OF_STOCK: "bg-red-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold ring-1 ring-inset ${
        config[status] || config.HEALTHY
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status] || dots.HEALTHY}`} />
      {labels[status] || "Unknown"}
    </span>
  );
}

// MODAL
function Modal({
  title,
  subtitle,
  icon: Icon = Package,
  onClose,
  children,
  accent = "blue",
  wide = false,
}) {
  const accentThemes = {
    blue: "from-blue-600 to-indigo-700",
    green: "from-emerald-600 to-teal-700",
    orange: "from-orange-500 to-amber-600",
  };

  return (
    <div
      className="inventory-modal-overlay fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-modal-title"
        className={`inventory-modal my-auto w-full ${
          wide ? "max-w-2xl" : "max-w-lg"
        } overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl shadow-slate-950/20`}
      >
        {/* MODAL HEADER */}
        <div
          className={`relative overflow-hidden bg-gradient-to-r ${
            accentThemes[accent] || accentThemes.blue
          } px-5 py-5 text-white sm:px-7 sm:py-6`}
        >
          <div className="absolute -right-8 -top-16 h-48 w-48 rounded-full border-[28px] border-white/10" />
          <div className="absolute -bottom-16 right-24 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-inner backdrop-blur-sm">
                <Icon size={24} />
              </div>

              <div>
                <h2
                  id="inventory-modal-title"
                  className="text-xl font-extrabold tracking-tight sm:text-2xl"
                >
                  {title}
                </h2>
                <p className="mt-1 text-xs font-medium text-white/80 sm:text-sm">
                  {subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:rotate-90 hover:bg-white/20 disabled:cursor-not-allowed"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="max-h-[calc(100dvh-170px)] overflow-y-auto p-5 sm:p-7">
          {children}
        </div>
      </div>
    </div>
  );
}

// FORM FIELD
function FormField({ label, required = false, hint, children }) {
  return (
    <label className="block min-w-0 space-y-2">
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold tracking-wide text-slate-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </span>

        {hint && (
          <span className="text-[10px] font-medium text-slate-400">
            {hint}
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

// PREVIEW VALUE
function PreviewValue({ label, value, highlight = false }) {
  return (
    <div
      className={`min-w-0 rounded-xl border p-3 ${
        highlight
          ? "border-blue-200 bg-white shadow-sm"
          : "border-slate-200/70 bg-white/70"
      }`}
    >
      <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 truncate text-xl font-extrabold tabular-nums ${
          highlight ? "text-blue-700" : "text-slate-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// MOBILE VALUE
function MobileValue({ label, value, highlight = false }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 text-base font-extrabold tabular-nums ${
          highlight ? "text-blue-700" : "text-slate-800"
        }`}
      >
        {formatNumber(value)}
      </p>
    </div>
  );
}

// EMPTY STATE
function EmptyState({ title, description, action, onAction }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Package size={31} />
      </div>

      <h3 className="mt-4 text-base font-bold text-slate-800">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>

      {action && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-700"
        >
          <Plus size={17} />
          Add Inventory
        </button>
      )}
    </div>
  );
}

// MODAL ACTIONS
function ModalActions({
  onCancel,
  saving,
  submitLabel,
  savingLabel = "Saving...",
  submitIcon: SubmitIcon = CheckCircle,
  variant = "blue",
}) {
  const variants = {
    blue: "from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-200",
    green: "from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-200",
    orange: "from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-orange-200",
  };

  return (
    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={saving}
        className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant] || variants.blue}`}
      >
        {saving ? (
          <RefreshCw size={17} className="animate-spin" />
        ) : (
          <SubmitIcon size={17} />
        )}

        {saving ? savingLabel : submitLabel}
      </button>
    </div>
  );
}
