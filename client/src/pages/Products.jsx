
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Filter,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Tag,
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

  // ==========================================
  // Load Products
  // ==========================================

  const loadProducts = useCallback(
    async (showLoader = true, showSuccess = false) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const [response] = await Promise.all([
          getProducts(),
          new Promise((resolve) => setTimeout(resolve, 700)),
        ]);

        const result =
          response?.products ??
          response?.data?.products ??
          response?.data ??
          response;

        if (!Array.isArray(result)) {
          throw new Error("Invalid products response from server");
        }

        setProducts(result);

        if (showSuccess) {
          toast.success("Products refreshed successfully");
        }
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
    },
    []
  );

  // ==========================================
  // Load Categories
  // ==========================================

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

  // ==========================================
  // Search and Filter
  // ==========================================

  const filteredProducts = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = [
        product.name,
        product.sku,
        product.description,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(searchText)
      );

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && Boolean(product.isActive)) ||
        (statusFilter === "inactive" && !product.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  // ==========================================
  // Pagination
  // ==========================================

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
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // ==========================================
  // Summary
  // ==========================================

  const activeCount = products.filter(
    (product) => Boolean(product.isActive)
  ).length;

  const inactiveCount = products.length - activeCount;

  const categoryCount = new Set(
    products
      .map((product) => product.categoryId)
      .filter((id) => id !== null && id !== undefined)
      .map(String)
  ).size;

  // ==========================================
  // Modal
  // ==========================================

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

  // ==========================================
  // Form Change
  // ==========================================

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ==========================================
  // Create / Update Product
  // ==========================================

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
        // Existing backend update controller supports these fields.
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
        // Existing create controller accepts these fields.
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

      await loadProducts(true, false);
    } catch (error) {
      console.error("Save Product Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to save product"
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // Delete / Deactivate Product
  // ==========================================

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(product.id);

      await deleteProduct(product.id);

      toast.success("Product deactivated successfully");

      await loadProducts(true, false);
    } catch (error) {
      console.error("Delete Product Error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to deactivate product"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // Category Name
  // ==========================================

  const getCategoryName = (categoryId) => {
    const category = categories.find(
      (item) => String(item.id) === String(categoryId)
    );

    return category?.name || "Category unavailable";
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
            <Package size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Product Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your product catalog and product information
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              loadProducts(false, true);
              loadCategories();
            }}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      {/* Summary Cards */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Products"
          value={products.length}
          icon={Package}
          color="blue"
        />

        <SummaryCard
          title="Active Products"
          value={activeCount}
          icon={CheckCircle}
          color="green"
        />

        <SummaryCard
          title="Inactive Products"
          value={inactiveCount}
          icon={AlertCircle}
          color="orange"
        />

        <SummaryCard
          title="Categories Used"
          value={categoryCount}
          icon={Tag}
          color="purple"
        />
      </div>

      {/* Product Catalog */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Search and Filter */}

        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-bold text-slate-800">
              Product Catalog
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 sm:w-64">
              <Search size={17} className="shrink-0 text-slate-400" />

              <input
                type="search"
                placeholder="Search name, SKU or description..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              />

              {search && (
                <button
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
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
              Loading products...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <div className="rounded-full bg-slate-100 p-4">
              <Package size={35} className="text-slate-400" />
            </div>

            <h3 className="mt-3 font-semibold text-slate-700">
              {products.length === 0
                ? "No products available"
                : "No matching products"}
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              {products.length === 0
                ? "Start by adding your first product."
                : "Try a different search or status filter."}
            </p>

            {products.length === 0 && (
              <button
                onClick={openAddModal}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Add Your First Product
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Product Table */}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">

                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Product</th>
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
                  {paginatedProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                            <Package size={20} />
                          </div>

                          <div className="max-w-56">
                            <p className="truncate font-semibold text-slate-800">
                              {product.name}
                            </p>

                            <p className="truncate text-xs text-slate-400">
                              {product.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-600">
                        {product.sku || "—"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {getCategoryName(product.categoryId)}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {formatCurrency(product.price)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatCurrency(product.costPrice)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {Number(product.reorderLevel ?? 0)} units
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge active={Boolean(product.isActive)} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">

                          <button
                            onClick={() => openEditModal(product)}
                            disabled={deletingId === product.id}
                            title="Edit product"
                            className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100 disabled:opacity-40"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => handleDelete(product)}
                            disabled={deletingId === product.id}
                            title="Deactivate product"
                            className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:opacity-40"
                          >
                            {deletingId === product.id ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
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
                Showing{" "}
                {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
                {Math.min(
                  currentPage * PAGE_SIZE,
                  filteredProducts.length
                )}{" "}
                of {filteredProducts.length} products
              </p>

              <div className="flex items-center gap-2">
                <button
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
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1)
                    )
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

      {/* Add / Edit Product Modal */}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-6">
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Enter product information below
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

            {/* Product Form */}

            <form onSubmit={handleSubmit}>

              <div className="grid max-h-[65vh] grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2 sm:p-6">

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

                {/* Actual Categories from API */}

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
                        <option
                          key={category.id}
                          value={String(category.id)}
                        >
                          {category.name}
                        </option>
                      ))}
                  </select>

                  {editingProduct && (
                    <p className="mt-1 text-xs text-slate-500">
                      Category editing is not supported by the current backend update endpoint.
                    </p>
                  )}
                </FormField>

                <FormField label="Product Status">
                  <label className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 px-3 text-sm">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={form.isActive}
                      onChange={handleChange}
                      className="h-4 w-4 accent-blue-600"
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
                      placeholder="Enter product description"
                      className="form-input resize-none"
                    />
                  </FormField>
                </div>
              </div>

              {/* Modal Footer */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-5 sm:flex-row sm:justify-end sm:px-6">
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
                  disabled={
                    saving ||
                    categoriesLoading ||
                    categories.length === 0
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <RefreshCw size={16} className="animate-spin" />
                  )}

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
// Status Badge
// ==========================================

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {active ? "Active" : "Inactive"}
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
