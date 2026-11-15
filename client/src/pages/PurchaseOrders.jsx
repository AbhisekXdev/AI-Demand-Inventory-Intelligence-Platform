import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Eye,
  X,
  Package,
  Truck,
  IndianRupee,
  ClipboardList,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
} from "../services/purchaseOrderService";

import { getProducts, createProduct } from "../services/productService";
import { getSuppliers, createSupplier } from "../services/supplierService";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getArray = (response, key) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.[key])) return response[key];
  return [];
};

const statusStyles = {
  DRAFT: "bg-slate-100 text-slate-700",
  ORDERED: "bg-blue-100 text-blue-700",
  PARTIALLY_RECEIVED: "bg-amber-100 text-amber-700",
  RECEIVED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
      statusStyles[status] || "bg-slate-100 text-slate-700"
    }`}
  >
    {(status || "UNKNOWN").replaceAll("_", " ")}
  </span>
);

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <h3 className="mt-2 text-2xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

const PurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  // Quick-add popup states
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [quickProductIndex, setQuickProductIndex] = useState(0);
  const [savingQuickItem, setSavingQuickItem] = useState(false);

  const [supplierForm, setSupplierForm] = useState({
    name: "",
    email: "",
    phone: "",
    contactPerson: "",
    address: "",
  });

  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    description: "",
    price: "",
    costPrice: "",
    reorderLevel: 10,
    leadTimeDays: 7,
    categoryId: "1",
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    supplierId: "",
    expectedDeliveryDate: "",
    notes: "",
    items: [
      {
        productId: "",
        quantity: 1,
        unitPrice: "",
      },
    ],
  });

  const [receiveItems, setReceiveItems] = useState([]);

  // Load purchase orders, suppliers and products
  const loadData = useCallback(async (showToast = false) => {
    const startTime = Date.now();

    try {
      const [orderResult, supplierResult, productResult] =
        await Promise.allSettled([
          getPurchaseOrders(),
          getSuppliers(),
          getProducts(),
        ]);

      if (orderResult.status === "fulfilled") {
        setPurchaseOrders(
          getArray(orderResult.value, "purchaseOrders")
        );
      } else {
        throw orderResult.reason;
      }

      if (supplierResult.status === "fulfilled") {
        setSuppliers(getArray(supplierResult.value, "suppliers"));
      } else {
        toast.error("Unable to load suppliers");
      }

      if (productResult.status === "fulfilled") {
        setProducts(getArray(productResult.value, "products"));
      } else {
        toast.error("Unable to load products");
      }

      if (showToast) {
        toast.success("Purchase orders refreshed");
      }
    } catch (error) {
      console.error("Purchase order loading error:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to load purchase orders"
      );
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 700 - elapsed);

      setTimeout(() => {
        setLoading(false);
        setRefreshing(false);
      }, remaining);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const activeSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplier.isActive !== false),
    [suppliers]
  );

  const activeProducts = useMemo(
    () => products.filter((product) => product.isActive !== false),
    [products]
  );

  // Dashboard summary
  const stats = useMemo(() => {
    return {
      total: purchaseOrders.length,
      draft: purchaseOrders.filter((po) => po.status === "DRAFT").length,
      pending: purchaseOrders.filter((po) =>
        ["DRAFT", "ORDERED", "PARTIALLY_RECEIVED"].includes(po.status)
      ).length,
      received: purchaseOrders.filter((po) => po.status === "RECEIVED")
        .length,
      totalValue: purchaseOrders.reduce(
        (sum, po) => sum + Number(po.totalAmount || 0),
        0
      ),
    };
  }, [purchaseOrders]);

  // Search and status filtering
  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const supplier = suppliers.find(
        (item) => Number(item.id) === Number(po.supplierId)
      );

      const matchesSearch =
        String(po.poNumber || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        String(supplier?.name || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || po.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [purchaseOrders, suppliers, search, statusFilter]);

  // Pagination
  const pageSize = 8;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / pageSize)
  );

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(
      (item) => Number(item.id) === Number(supplierId)
    );

    return supplier?.name || `Supplier #${supplierId}`;
  };

  const resetForm = () => {
    setForm({
      supplierId: "",
      expectedDeliveryDate: "",
      notes: "",
      items: [
        {
          productId: "",
          quantity: 1,
          unitPrice: "",
        },
      ],
    });
  };

  // Purchase order product rows
  const updateItem = (index, field, value) => {
    setForm((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      ),
    }));
  };

  const addItem = () => {
    setForm((previous) => ({
      ...previous,
      items: [
        ...previous.items,
        {
          productId: "",
          quantity: 1,
          unitPrice: "",
        },
      ],
    }));
  };

  const removeItem = (index) => {
    setForm((previous) => ({
      ...previous,
      items: previous.items.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const calculateTotal = () =>
    form.items.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0) *
          Number(item.unitPrice || 0),
      0
    );

  // QUICK ADD SUPPLIER
  const handleQuickAddSupplier = async (event) => {
    event.preventDefault();

    if (!supplierForm.name.trim()) {
      toast.warning("Supplier name is required");
      return;
    }

    setSavingQuickItem(true);

    try {
      const response = await createSupplier({
        ...supplierForm,
        name: supplierForm.name.trim(),
      });

      const newSupplier = response?.supplier;

      if (!newSupplier?.id) {
        throw new Error(
          "Supplier was created but its ID was not returned"
        );
      }

      setSuppliers((previous) => [
        newSupplier,
        ...previous.filter(
          (supplier) =>
            Number(supplier.id) !== Number(newSupplier.id)
        ),
      ]);

      // Automatically select the new supplier
      setForm((previous) => ({
        ...previous,
        supplierId: String(newSupplier.id),
      }));

      setSupplierForm({
        name: "",
        email: "",
        phone: "",
        contactPerson: "",
        address: "",
      });

      setShowSupplierModal(false);

      toast.success(
        "Supplier added and selected in this purchase order"
      );
    } catch (error) {
      console.error("Quick supplier creation error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to add supplier"
      );
    } finally {
      setSavingQuickItem(false);
    }
  };

  // QUICK ADD PRODUCT
  const handleQuickAddProduct = async (event) => {
    event.preventDefault();

    if (!productForm.name.trim() || !productForm.sku.trim()) {
      toast.warning("Product name and SKU are required");
      return;
    }

    if (
      productForm.price === "" ||
      productForm.costPrice === "" ||
      !productForm.categoryId
    ) {
      toast.warning(
        "Enter selling price, cost price and category"
      );
      return;
    }

    setSavingQuickItem(true);

    try {
      const payload = {
        ...productForm,
        name: productForm.name.trim(),
        sku: productForm.sku.trim(),
        price: Number(productForm.price),
        costPrice: Number(productForm.costPrice),
        reorderLevel: Number(productForm.reorderLevel),
        leadTimeDays: Number(productForm.leadTimeDays),
        categoryId: Number(productForm.categoryId),
        supplierId: form.supplierId
          ? Number(form.supplierId)
          : null,
        isActive: true,
      };

      const response = await createProduct(payload);
      const newProduct = response?.product;

      if (!newProduct?.id) {
        throw new Error(
          "Product was created but its ID was not returned"
        );
      }

      setProducts((previous) => [
        newProduct,
        ...previous.filter(
          (product) =>
            Number(product.id) !== Number(newProduct.id)
        ),
      ]);

      // Automatically select the new product in the selected row
      setForm((previous) => ({
        ...previous,
        items: previous.items.map((item, index) =>
          index === quickProductIndex
            ? {
                ...item,
                productId: String(newProduct.id),
                unitPrice: String(
                  newProduct.costPrice ?? productForm.costPrice
                ),
              }
            : item
        ),
      }));

      setProductForm({
        name: "",
        sku: "",
        description: "",
        price: "",
        costPrice: "",
        reorderLevel: 10,
        leadTimeDays: 7,
        categoryId: "1",
      });

      setShowProductModal(false);

      toast.success(
        "Product added and selected in this purchase order"
      );
    } catch (error) {
      console.error("Quick product creation error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to add product"
      );
    } finally {
      setSavingQuickItem(false);
    }
  };

  // CREATE PURCHASE ORDER
  const handleCreate = async (event) => {
    event.preventDefault();

    if (!form.supplierId) {
      toast.warning("Please select a supplier");
      return;
    }

    if (!form.items.length) {
      toast.warning("Add at least one product");
      return;
    }

    const validItems = form.items.every(
      (item) =>
        item.productId &&
        Number(item.quantity) > 0 &&
        item.unitPrice !== "" &&
        Number(item.unitPrice) >= 0
    );

    if (!validItems) {
      toast.warning("Please enter valid product details");
      return;
    }

    const productIds = form.items.map((item) =>
      Number(item.productId)
    );

    if (new Set(productIds).size !== productIds.length) {
      toast.warning(
        "A product can only be added once per order"
      );
      return;
    }

    const payload = {
      supplierId: Number(form.supplierId),
      expectedDeliveryDate: form.expectedDeliveryDate || null,
      notes: form.notes.trim(),
      items: form.items.map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
    };

    setSubmitting(true);

    try {
      await createPurchaseOrder(payload);

      toast.success("Purchase order created successfully");

      setShowCreateModal(false);
      resetForm();

      await loadData();
    } catch (error) {
      console.error("Create purchase order error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to create purchase order"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // VIEW PURCHASE ORDER DETAILS
  const openDetails = async (id) => {
    try {
      const response = await getPurchaseOrderById(id);

      setSelectedOrder(response.purchaseOrder);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to load purchase order details"
      );
    }
  };

  // OPEN RECEIVE STOCK MODAL
  const openReceiveModal = async (id) => {
    try {
      const response = await getPurchaseOrderById(id);
      const order = response.purchaseOrder;

      if (!order?.items?.length) {
        toast.error(
          "No products found in this purchase order"
        );
        return;
      }

      setSelectedOrder(order);

      setReceiveItems(
        order.items.map((item) => ({
          productId: item.productId,
          productName:
            item.product?.name || `Product #${item.productId}`,
          orderedQuantity: Number(item.quantity),
          receivedQuantity: Number(item.receivedQuantity || 0),
          remainingQuantity:
            Number(item.quantity) -
            Number(item.receivedQuantity || 0),
          receiveQuantity: 0,
        }))
      );

      setShowReceiveModal(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to load purchase order"
      );
    }
  };

  // RECEIVE STOCK
  const handleReceive = async (event) => {
    event.preventDefault();

    const items = receiveItems
      .filter((item) => Number(item.receiveQuantity) > 0)
      .map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.receiveQuantity),
      }));

    if (!items.length) {
      toast.warning("Enter quantity to receive");
      return;
    }

    const invalid = receiveItems.some(
      (item) =>
        Number(item.receiveQuantity) < 0 ||
        Number(item.receiveQuantity) > item.remainingQuantity
    );

    if (invalid) {
      toast.warning(
        "Received quantity exceeds remaining quantity"
      );
      return;
    }

    setSubmitting(true);

    try {
      await receivePurchaseOrder(selectedOrder.id, items);

      toast.success("Stock received successfully");

      setShowReceiveModal(false);
      setSelectedOrder(null);

      await loadData();
    } catch (error) {
      console.error("Receive purchase order error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to receive stock"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // CANCEL PURCHASE ORDER
  const handleCancel = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this purchase order?"
    );

    if (!confirmed) return;

    try {
      await cancelPurchaseOrder(id);

      toast.success("Purchase order cancelled");

      await loadData();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to cancel purchase order"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2
            className="mx-auto animate-spin text-blue-600"
            size={38}
          />
          <p className="mt-3 text-sm text-slate-500">
            Loading purchase orders...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Purchase Order Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create orders, track deliveries and receive inventory stock.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={17} />
            Create Purchase Order
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Orders"
          value={stats.total}
          icon={ClipboardList}
          color="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Pending Orders"
          value={stats.pending}
          icon={Truck}
          color="bg-amber-50 text-amber-600"
        />

        <StatCard
          title="Received Orders"
          value={stats.received}
          icon={CheckCircle}
          color="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Total Order Value"
          value={formatCurrency(stats.totalValue)}
          icon={IndianRupee}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by PO number or supplier..."
            className={`${inputClass} pl-10`}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setCurrentPage(1);
          }}
          className={`${inputClass} md:w-56`}
        >
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ORDERED">Ordered</option>
          <option value="PARTIALLY_RECEIVED">
            Partially Received
          </option>
          <option value="RECEIVED">Received</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* PURCHASE ORDERS TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">PO Number</th>
                <th className="px-5 py-4">Supplier</th>
                <th className="px-5 py-4">Order Date</th>
                <th className="px-5 py-4">Expected Delivery</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-semibold text-blue-700">
                    {po.poNumber}
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {getSupplierName(po.supplierId)}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {formatDate(po.orderDate || po.createdAt)}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {formatDate(po.expectedDeliveryDate)}
                  </td>

                  <td className="px-5 py-4 font-semibold text-slate-800">
                    {formatCurrency(po.totalAmount)}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={po.status} />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        title="View details"
                        onClick={() => openDetails(po.id)}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                      >
                        <Eye size={17} />
                      </button>

                      {[
                        "DRAFT",
                        "ORDERED",
                        "PARTIALLY_RECEIVED",
                      ].includes(po.status) && (
                        <>
                          <button
                            title="Receive stock"
                            onClick={() => openReceiveModal(po.id)}
                            className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                          >
                            <Package size={17} />
                          </button>

                          <button
                            title="Cancel order"
                            onClick={() => handleCancel(po.id)}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          >
                            <Ban size={17} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {paginatedOrders.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No purchase orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row">
          <p className="text-sm text-slate-500">
            Showing{" "}
            {filteredOrders.length
              ? (currentPage - 1) * pageSize + 1
              : 0}{" "}
            to{" "}
            {Math.min(
              currentPage * pageSize,
              filteredOrders.length
            )}{" "}
            of {filteredOrders.length} orders
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => page - 1)}
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
            >
              <ChevronLeft size={17} />
            </button>

            <span className="text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((page) => page + 1)}
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* CREATE PURCHASE ORDER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Create Purchase Order
                </h2>
                <p className="text-xs text-slate-500">
                  Add supplier and product details
                </p>
              </div>

              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5 p-5">
              {/* SUPPLIER */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">
                      Supplier *
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowSupplierModal(true)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
                    >
                      <Plus size={15} />
                      Add Supplier
                    </button>
                  </div>

                  <select
                    required
                    value={form.supplierId}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        supplierId: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">Select Supplier</option>

                    {activeSuppliers.map((supplier) => (
                      <option
                        key={supplier.id}
                        value={supplier.id}
                      >
                        {supplier.name}
                      </option>
                    ))}
                  </select>

                  {activeSuppliers.length === 0 && (
                    <p className="mt-1 text-xs text-red-500">
                      Add an active supplier before creating an order.
                    </p>
                  )}
                </div>

                {/* EXPECTED DELIVERY */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Expected Delivery Date
                  </label>

                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={form.expectedDeliveryDate}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        expectedDeliveryDate: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              {/* PRODUCT ROWS */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">
                    Products
                  </h3>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setQuickProductIndex(form.items.length - 1);
                        setShowProductModal(true);
                      }}
                      className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      <Plus size={16} />
                      Quick Add Product
                    </button>

                    <button
                      type="button"
                      onClick={addItem}
                      className="flex items-center gap-1 text-sm font-semibold text-blue-600"
                    >
                      <Plus size={16} />
                      Add Product Row
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {form.items.map((item, index) => (
                    <div
                      key={index}
                      className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-12"
                    >
                      {/* PRODUCT SELECT */}
                      <div className="md:col-span-5">
                        <div className="mb-1 flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-500">
                            Product *
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              setQuickProductIndex(index);
                              setShowProductModal(true);
                            }}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                          >
                            + Quick add
                          </button>
                        </div>

                        <select
                          required
                          value={item.productId}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "productId",
                              event.target.value
                            )
                          }
                          className={inputClass}
                        >
                          <option value="">Select Product</option>

                          {activeProducts.map((product) => (
                            <option
                              key={product.id}
                              value={product.id}
                            >
                              {product.name} ({product.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* QUANTITY */}
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          Quantity *
                        </label>

                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "quantity",
                              event.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      {/* UNIT PRICE */}
                      <div className="md:col-span-3">
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          Unit Price (₹) *
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={item.unitPrice}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "unitPrice",
                              event.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      {/* ITEM TOTAL AND REMOVE */}
                      <div className="flex items-end justify-between gap-2 md:col-span-2">
                        <div className="pb-2 text-sm font-semibold text-slate-700">
                          {formatCurrency(
                            Number(item.quantity || 0) *
                              Number(item.unitPrice || 0)
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={form.items.length === 1}
                          onClick={() => removeItem(index)}
                          className="mb-1 rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-30"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* NOTES */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Notes
                </label>

                <textarea
                  rows="3"
                  value={form.notes}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Enter additional notes..."
                  className={inputClass}
                />
              </div>

              {/* TOTAL */}
              <div className="flex flex-col justify-between gap-3 rounded-xl bg-blue-50 p-4 sm:flex-row sm:items-center">
                <span className="font-medium text-slate-700">
                  Total Purchase Amount
                </span>

                <span className="text-xl font-bold text-blue-700">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting || activeSuppliers.length === 0
                  }
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting
                    ? "Creating..."
                    : "Create Purchase Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
            {/* QUICK ADD SUPPLIER MODAL */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Quick Add Supplier
                </h2>
                <p className="text-xs text-slate-500">
                  Add a supplier without closing your purchase order
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSupplierModal(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
                aria-label="Close supplier form"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleQuickAddSupplier}
              className="space-y-4 p-5"
            >
              {[
                ["name", "Supplier Name *", "text"],
                ["contactPerson", "Contact Person", "text"],
                ["email", "Email", "email"],
                ["phone", "Phone", "tel"],
                ["address", "Address", "text"],
              ].map(([field, label, type]) => (
                <div key={field}>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {label}
                  </label>

                  <input
                    type={type}
                    required={field === "name"}
                    value={supplierForm[field]}
                    onChange={(event) =>
                      setSupplierForm((previous) => ({
                        ...previous,
                        [field]: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
              ))}

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingQuickItem}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingQuickItem ? "Saving..." : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Quick Add Product
                </h2>
                <p className="text-xs text-slate-500">
                  Add a product without closing your purchase order
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
                aria-label="Close product form"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleQuickAddProduct}
              className="space-y-4 p-5"
            >
              {[
                ["name", "Product Name *", "text"],
                ["sku", "SKU *", "text"],
                ["price", "Selling Price (₹) *", "number"],
                ["costPrice", "Cost Price (₹) *", "number"],
                ["reorderLevel", "Reorder Level", "number"],
                ["leadTimeDays", "Lead Time (Days)", "number"],
              ].map(([field, label, type]) => (
                <div key={field}>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {label}
                  </label>

                  <input
                    type={type}
                    min={type === "number" ? "0" : undefined}
                    step={
                      field === "price" || field === "costPrice"
                        ? "0.01"
                        : undefined
                    }
                    required={[
                      "name",
                      "sku",
                      "price",
                      "costPrice",
                    ].includes(field)}
                    value={productForm[field]}
                    onChange={(event) =>
                      setProductForm((previous) => ({
                        ...previous,
                        [field]: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
              ))}

              {/* CATEGORY */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Category *
                </label>

                <select
                  required
                  value={productForm.categoryId}
                  onChange={(event) =>
                    setProductForm((previous) => ({
                      ...previous,
                      categoryId: event.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="1">Electronics (ID: 1)</option>
                  <option value="2">Electronics (ID: 2)</option>
                </select>

                <p className="mt-1 text-xs text-slate-500">
                  These are the category IDs currently used in your
                  Products page. Confirm that both IDs exist in your
                  database.
                </p>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingQuickItem}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {savingQuickItem ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PURCHASE ORDER DETAILS MODAL */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {selectedOrder.poNumber}
                </h2>

                <p className="text-sm text-slate-500">
                  Purchase order details
                </p>
              </div>

              <button
                onClick={() => setShowDetailsModal(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Supplier</p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedOrder.supplier?.name ||
                      getSupplierName(selectedOrder.supplierId)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Status</p>

                  <div className="mt-1">
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Order Date</p>

                  <p className="mt-1 font-medium text-slate-800">
                    {formatDate(
                      selectedOrder.orderDate ||
                        selectedOrder.createdAt
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Expected Delivery
                  </p>

                  <p className="mt-1 font-medium text-slate-800">
                    {formatDate(selectedOrder.expectedDeliveryDate)}
                  </p>
                </div>
              </div>

              {/* ORDERED PRODUCTS */}
              <div>
                <h3 className="mb-3 font-semibold text-slate-800">
                  Ordered Products
                </h3>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[500px] text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-3 py-3 text-left">
                          Product
                        </th>
                        <th className="px-3 py-3 text-right">
                          Ordered
                        </th>
                        <th className="px-3 py-3 text-right">
                          Received
                        </th>
                        <th className="px-3 py-3 text-right">
                          Amount
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {(selectedOrder.items || []).map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-3">
                            {item.product?.name ||
                              `Product #${item.productId}`}
                          </td>

                          <td className="px-3 py-3 text-right">
                            {item.quantity}
                          </td>

                          <td className="px-3 py-3 text-right">
                            {item.receivedQuantity || 0}
                          </td>

                          <td className="px-3 py-3 text-right font-medium">
                            {formatCurrency(item.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <p className="text-xs text-slate-500">Notes</p>

                  <p className="mt-1 text-sm text-slate-700">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              <div className="flex justify-between rounded-xl bg-slate-50 p-4">
                <span className="font-semibold text-slate-700">
                  Total Amount
                </span>

                <span className="text-lg font-bold text-slate-900">
                  {formatCurrency(selectedOrder.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECEIVE STOCK MODAL */}
      {showReceiveModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Receive Stock
                </h2>

                <p className="text-sm text-slate-500">
                  {selectedOrder.poNumber}
                </p>
              </div>

              <button
                onClick={() => setShowReceiveModal(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleReceive}
              className="space-y-4 p-5"
            >
              <p className="text-sm text-slate-600">
                Enter the quantity received for each product. Only
                the entered quantity will be added to inventory.
              </p>

              {receiveItems.map((item, index) => (
                <div
                  key={item.productId}
                  className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-4"
                >
                  <div className="sm:col-span-2">
                    <p className="font-semibold text-slate-800">
                      {item.productName}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Ordered: {item.orderedQuantity} · Received:{" "}
                      {item.receivedQuantity} · Remaining:{" "}
                      {item.remainingQuantity}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      Quantity to receive
                    </label>

                    <input
                      type="number"
                      min="0"
                      max={item.remainingQuantity}
                      value={item.receiveQuantity}
                      disabled={item.remainingQuantity <= 0}
                      onChange={(event) => {
                        const value = event.target.value;

                        setReceiveItems((previous) =>
                          previous.map((receiveItem, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...receiveItem,
                                  receiveQuantity: value,
                                }
                              : receiveItem
                          )
                        );
                      }}
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {submitting
                    ? "Processing..."
                    : "Confirm Received Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;