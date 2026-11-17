
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Package, Plus, Search, Pencil, Trash2, X, RefreshCw,
  Filter, AlertCircle, CheckCircle, ChevronLeft, ChevronRight,
  Tag, TrendingUp, Boxes, IndianRupee, Clock3, Sparkles,
  ArrowUpRight, Layers3, SlidersHorizontal
} from "lucide-react";
import { toast } from "react-toastify";
import { getCategories } from "../services/categoryService";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/productService";

const PAGE_SIZE = 8;

const initialForm = {
  name: "",
  sku: "",
  description: "",
  price: "",
  costPrice: "",
  reorderLevel: 10,
  leadTimeDays: 7,
  isActive: true,
  categoryId: "",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(initialForm);

  // Load products
  const loadProducts = useCallback(async (showLoader = true, showSuccess = false) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      const response = await getProducts();

      const result =
        response?.products ??
        response?.data?.products ??
        response?.data ??
        response;

      if (!Array.isArray(result)) {
        throw new Error("Invalid products response from server");
      }

      setProducts(result);

      if (showSuccess) toast.success("Product catalog refreshed");
    } catch (error) {
      console.error("Products API Error:", error);
      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Unable to load products"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);

      const response = await getCategories();

      const result =
        response?.categories ??
        response?.data?.categories ??
        response?.data ??
        response;

      if (!Array.isArray(result)) {
        throw new Error("Invalid categories response");
      }

      setCategories(result);
    } catch (error) {
      console.error("Categories API Error:", error);
      setCategories([]);
      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Unable to load categories"
      );
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  // Search and filters
  const filteredProducts = useMemo(() => {
    const text = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = [
        product.name,
        product.sku,
        product.description,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(text)
      );

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && Boolean(product.isActive)) ||
        (statusFilter === "inactive" && !product.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE)
  );

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // Statistics
  const activeCount = products.filter((p) => Boolean(p.isActive)).length;
  const inactiveCount = products.length - activeCount;

  const categoryCount = new Set(
    products
      .map((p) => p.categoryId)
      .filter((id) => id !== null && id !== undefined)
      .map(String)
  ).size;

  const totalInventoryValue = products.reduce(
    (sum, product) =>
      sum + (Number(product.price) || 0),
    0
  );

  // Category helper
  const getCategoryName = (categoryId) => {
    const category = categories.find(
      (item) => String(item.id) === String(categoryId)
    );
    return category?.name || "Uncategorized";
  };

  // Modal handlers
  const openAddModal = () => {
    setEditingProduct(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);

    setForm({
      name: product.name ?? "",
      sku: product.sku ?? "",
      description: product.description ?? "",
      price: product.price ?? "",
      costPrice: product.costPrice ?? "",
      reorderLevel: product.reorderLevel ?? 10,
      leadTimeDays: product.leadTimeDays ?? 7,
      isActive: Boolean(product.isActive),
      categoryId: String(product.categoryId ?? ""),
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingProduct(null);
    setForm(initialForm);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Create and update
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.sku.trim()) {
      toast.error("Product name and SKU are required");
      return;
    }

    if (!form.categoryId) {
      toast.error("Please select a product category");
      return;
    }

    const price = Number(form.price);
    const costPrice = Number(form.costPrice);
    const reorderLevel = Number(form.reorderLevel);
    const leadTimeDays = Number(form.leadTimeDays);

    if (
      form.price === "" ||
      form.costPrice === "" ||
      !Number.isFinite(price) ||
      !Number.isFinite(costPrice) ||
      price < 0 ||
      costPrice < 0
    ) {
      toast.error("Enter valid selling price and cost price");
      return;
    }

    if (
      !Number.isFinite(reorderLevel) ||
      reorderLevel < 0 ||
      !Number.isFinite(leadTimeDays) ||
      leadTimeDays < 0
    ) {
      toast.error("Enter valid reorder level and lead time");
      return;
    }

    try {
      setSaving(true);

      if (editingProduct) {
        const updatePayload = {
          name: form.name.trim(),
          sku: form.sku.trim(),
          description: form.description.trim(),
          price,
          costPrice,
          reorderLevel,
          isActive: form.isActive,
        };

        await updateProduct(editingProduct.id, updatePayload);
        toast.success("Product updated successfully");
      } else {
        const createPayload = {
          name: form.name.trim(),
          sku: form.sku.trim(),
          description: form.description.trim(),
          price,
          costPrice,
          reorderLevel,
          leadTimeDays,
          categoryId: Number(form.categoryId),
          isActive: form.isActive,
        };

        await createProduct(createPayload);
        toast.success("Product created successfully");
      }

      setModalOpen(false);
      setEditingProduct(null);
      setForm(initialForm);
      await loadProducts();
    } catch (error) {
      console.error("Save Product Error:", error);
      toast.error(
        error.response?.data?.message || "Unable to save product"
      );
    } finally {
      setSaving(false);
    }
  };

  // Deactivate product
  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(product.id);
      await deleteProduct(product.id);
      toast.success("Product deactivated successfully");
      await loadProducts();
    } catch (error) {
      console.error("Delete Product Error:", error);
      toast.error(
        error.response?.data?.message || "Unable to deactivate product"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="product-page mx-auto max-w-[1600px] space-y-6">

      {/* PAGE HEADER */}
      <div className="product-enter flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div className="flex items-start gap-4">
          <div className="product-header-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 text-white shadow-lg shadow-indigo-200">
            <Package size={27} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Product Management
              </h1>
              <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                Catalog
              </span>
            </div>

            <p className="mt-1.5 text-sm text-slate-500">
              Manage products, pricing, categories and product availability.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              loadProducts(false, true);
              loadCategories();
            }}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 disabled:opacity-50"
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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Products"
          value={products.length}
          icon={Package}
          color="blue"
          subtitle="Products in catalog"
          loading={loading}
        />
        <SummaryCard
          title="Active Products"
          value={activeCount}
          icon={CheckCircle}
          color="green"
          subtitle="Available in catalog"
          loading={loading}
        />
        <SummaryCard
          title="Inactive Products"
          value={inactiveCount}
          icon={AlertCircle}
          color="orange"
          subtitle="Currently unavailable"
          loading={loading}
        />
        <SummaryCard
          title="Categories Used"
          value={categoryCount}
          icon={Layers3}
          color="purple"
          subtitle="Categories represented"
          loading={loading}
        />
      </div>

      {/* CATALOG SECTION */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* CATALOG HEADER */}
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/70 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Boxes size={20} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Product Catalog
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {filteredProducts.length} results from {products.length} products
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50 sm:w-72">
              <Search size={17} className="shrink-0 text-slate-400" />
              <input
                type="search"
                placeholder="Search name, SKU or description..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:w-44">
              <SlidersHorizontal size={16} className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE CONTENT */}
        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center px-5 text-center">
            <div className="rounded-2xl bg-slate-100 p-5 text-slate-400">
              <Package size={36} />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-800">
              {products.length === 0
                ? "Your catalog is empty"
                : "No matching products"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {products.length === 0
                ? "Add your first product to start building your catalog."
                : "Try another product name, SKU or status filter."}
            </p>
            {products.length === 0 && (
              <button
                type="button"
                onClick={openAddModal}
                className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                <Plus size={16} className="mr-1 inline" />
                Add First Product
              </button>
            )}
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/90">
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Product Details</th>
                    <th className="px-5 py-4">SKU</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Selling Price</th>
                    <th className="px-5 py-4">Cost Price</th>
                    <th className="px-5 py-4">Reorder Level</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedProducts.map((product, index) => (
                    <tr
                      key={product.id}
                      className="product-row group transition-colors hover:bg-indigo-50/40"
                      style={{ animationDelay: `${index * 45}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 transition group-hover:scale-105">
                            <Package size={21} />
                          </div>
                          <div className="max-w-[230px]">
                            <p className="truncate font-semibold text-slate-800">
                              {product.name}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-400">
                              {product.description || "No description added"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-600">
                          {product.sku || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <Tag size={14} className="text-slate-400" />
                          {getCategoryName(product.categoryId)}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-800">
                        {formatCurrency(product.price)}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-600">
                        {formatCurrency(product.costPrice)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <AlertCircle size={14} className="text-amber-500" />
                          {Number(product.reorderLevel ?? 0)} units
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge active={Boolean(product.isActive)} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionButton
                            title="Edit product"
                            color="blue"
                            onClick={() => openEditModal(product)}
                            disabled={deletingId === product.id}
                          >
                            <Pencil size={16} />
                          </ActionButton>

                          <ActionButton
                            title="Deactivate product"
                            color="red"
                            onClick={() => handleDelete(product)}
                            disabled={deletingId === product.id}
                          >
                            {deletingId === product.id ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE PRODUCT CARDS */}
            <div className="grid gap-3 p-3 md:hidden">
              {paginatedProducts.map((product, index) => (
                <article
                  key={product.id}
                  className="product-row rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Package size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold text-slate-900">
                        {product.name}
                      </h3>
                      <p className="mt-1 truncate font-mono text-xs text-slate-400">
                        SKU: {product.sku || "—"}
                      </p>
                      <div className="mt-2">
                        <StatusBadge active={Boolean(product.isActive)} />
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <ActionButton
                        title="Edit product"
                        color="blue"
                        onClick={() => openEditModal(product)}
                      >
                        <Pencil size={15} />
                      </ActionButton>
                      <ActionButton
                        title="Deactivate product"
                        color="red"
                        onClick={() => handleDelete(product)}
                        disabled={deletingId === product.id}
                      >
                        {deletingId === product.id ? (
                          <RefreshCw size={15} className="animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </ActionButton>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Selling Price
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Cost Price
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {formatCurrency(product.costPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Category
                      </p>
                      <p className="mt-1 truncate text-xs font-medium text-slate-700">
                        {getCategoryName(product.categoryId)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Reorder Level
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-700">
                        {Number(product.reorderLevel ?? 0)} units
                      </p>
                    </div>
                  </div>

                  {product.description && (
                    <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">
                      {product.description}
                    </p>
                  )}
                </article>
              ))}
            </div>

            {/* PAGINATION */}
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-bold text-slate-800">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </span>
                {" "}to{" "}
                <span className="font-bold text-slate-800">
                  {Math.min(currentPage * PAGE_SIZE, filteredProducts.length)}
                </span>
                {" "}of{" "}
                <span className="font-bold text-slate-800">
                  {filteredProducts.length}
                </span>
                {" "}products
              </p>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                </button>

                <span className="text-xs font-semibold text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ADD / EDIT PRODUCT MODAL */}
      {modalOpen && (
        <div className="product-modal fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6">
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-white/50 bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 to-white px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  {editingProduct ? <Pencil size={19} /> : <Plus size={20} />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {editingProduct
                      ? "Update the selected product information"
                      : "Enter the details to create a new catalog item"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid max-h-[65vh] grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2 sm:p-6">

                <div className="sm:col-span-2">
                  <FormSection title="Basic Information" />
                </div>

                <FormField label="Product Name *">
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    maxLength={150}
                    placeholder="Enter product name"
                    className="form-input"
                  />
                </FormField>

                <FormField label="SKU *">
                  <input
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    required
                    placeholder="Example: LAP-001"
                    className="form-input"
                  />
                </FormField>

                <FormField label="Product Category *">
                  <select
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleChange}
                    required
                    disabled={categoriesLoading || Boolean(editingProduct)}
                    className="form-input disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="">
                      {categoriesLoading
                        ? "Loading categories..."
                        : categories.length === 0
                        ? "No categories available"
                        : "Select Category"}
                    </option>

                    {categories
                      .filter(
                        (category) =>
                          category.isActive ||
                          String(category.id) === String(form.categoryId)
                      )
                      .map((category) => (
                        <option key={category.id} value={String(category.id)}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                  {editingProduct && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      Category editing is not supported by the current backend update endpoint.
                    </p>
                  )}
                </FormField>

                <FormField label="Product Status">
                  <label className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={form.isActive}
                      onChange={handleChange}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    Active Product
                  </label>
                </FormField>

                <div className="sm:col-span-2">
                  <FormField label="Description">
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Enter product description..."
                      className="form-input resize-none"
                    />
                  </FormField>
                </div>

                <div className="sm:col-span-2">
                  <FormSection title="Pricing & Inventory Settings" />
                </div>

                <FormField label="Selling Price (₹) *">
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    required
                    placeholder="Enter selling price"
                    className="form-input"
                  />
                </FormField>

                <FormField label="Cost Price (₹) *">
                  <input
                    type="number"
                    name="costPrice"
                    min="0"
                    step="0.01"
                    value={form.costPrice}
                    onChange={handleChange}
                    required
                    placeholder="Enter cost price"
                    className="form-input"
                  />
                </FormField>

                <FormField label="Reorder Level">
                  <input
                    type="number"
                    name="reorderLevel"
                    min="0"
                    step="1"
                    value={form.reorderLevel}
                    onChange={handleChange}
                    className="form-input"
                  />
                </FormField>

                <FormField label="Lead Time (Days)">
                  <input
                    type="number"
                    name="leadTimeDays"
                    min="0"
                    step="1"
                    value={form.leadTimeDays}
                    onChange={handleChange}
                    disabled={Boolean(editingProduct)}
                    className="form-input disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </FormField>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    categoriesLoading ||
                    categories.length === 0
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && <RefreshCw size={16} className="animate-spin" />}
                  {saving
                    ? "Saving..."
                    : editingProduct
                    ? "Update Product"
                    : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAGE ANIMATIONS */}
      <style>{`
        .product-page {
          animation: productPageIn .5s ease-out both;
        }

        .product-enter {
          animation: productPageIn .55s ease-out both;
        }

        .product-header-icon {
          transition: transform .3s ease, box-shadow .3s ease;
        }

        .product-header-icon:hover {
          transform: translateY(-3px) rotate(-4deg);
          box-shadow: 0 15px 28px rgba(79,70,229,.22);
        }

        .product-row {
          animation: productRowIn .35s ease-out both;
        }

        .product-modal {
          animation: modalBackdrop .2s ease-out both;
        }

        .product-modal > div {
          animation: modalEnter .25s ease-out both;
        }

        .form-input {
          display: block;
          width: 100%;
          min-height: 44px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          padding: 10px 12px;
          font-size: 13px;
          color: #334155;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
        }

        .form-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,.10);
        }

        .form-input::placeholder {
          color: #94a3b8;
        }

        @keyframes productPageIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes productRowIn {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes modalBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalEnter {
          from { opacity: 0; transform: translateY(14px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .product-page, .product-enter, .product-row,
          .product-modal, .product-modal > div {
            animation: none !important;
          }

          .product-header-icon {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

// KPI CARD
function SummaryCard({ title, value, icon: Icon, color, subtitle, loading }) {
  const styles = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
      accent: "bg-blue-500",
      glow: "group-hover:shadow-blue-100",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-600",
      accent: "bg-emerald-500",
      glow: "group-hover:shadow-emerald-100",
    },
    orange: {
      icon: "bg-orange-50 text-orange-600",
      accent: "bg-orange-500",
      glow: "group-hover:shadow-orange-100",
    },
    purple: {
      icon: "bg-violet-50 text-violet-600",
      accent: "bg-violet-500",
      glow: "group-hover:shadow-violet-100",
    },
  };

  const style = styles[color];

  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${style.glow}`}>
      <div className={`absolute left-0 top-0 h-full w-1 ${style.accent}`} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {loading ? (
              <span className="inline-block h-9 w-14 animate-pulse rounded-lg bg-slate-100" />
            ) : (
              value
            )}
          </h3>
          <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
        </div>
        <div className={`rounded-2xl p-3.5 transition duration-300 group-hover:scale-110 ${style.icon}`}>
          <Icon size={23} />
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-8 -right-6 h-24 w-24 rounded-full bg-slate-50 opacity-0 transition duration-300 group-hover:opacity-100" />
    </div>
  );
}

// STATUS BADGE
function StatusBadge({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${
      active
        ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
        : "border border-slate-200 bg-slate-100 text-slate-500"
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${
        active ? "bg-emerald-500" : "bg-slate-400"
      }`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ACTION BUTTON
function ActionButton({ children, title, color, onClick, disabled }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    red: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg p-2.5 transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 ${colors[color]}`}
    >
      {children}
    </button>
  );
}

// FORM SECTION HEADING
function FormSection({ title }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
      <Sparkles size={15} className="text-indigo-600" />
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
        {title}
      </h3>
    </div>
  );
}

// FORM FIELD
function FormField({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}
