
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Tags,
  CheckCircle,
  Ban,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/categoryService";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  const pageSize = 8;

  const loadCategories = useCallback(async (showToast = false) => {
    const startTime = Date.now();

    try {
      const response = await getCategories();

      setCategories(
        Array.isArray(response.categories)
          ? response.categories
          : []
      );

      if (showToast) {
        toast.success("Categories refreshed successfully");
      }
    } catch (error) {
      console.error("Load categories error:", error);
      toast.error(
        error.response?.data?.message || "Failed to load categories"
      );
    } finally {
      const remaining = Math.max(0, 700 - (Date.now() - startTime));

      setTimeout(() => {
        setLoading(false);
        setRefreshing(false);
      }, remaining);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadCategories(true);
  };

  const stats = useMemo(() => ({
    total: categories.length,
    active: categories.filter((item) => item.isActive !== false).length,
    inactive: categories.filter((item) => item.isActive === false).length,
  }), [categories]);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const matchesSearch =
        (category.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (category.description || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && category.isActive !== false) ||
        (statusFilter === "INACTIVE" && category.isActive === false);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / pageSize)
  );

  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const openAddModal = () => {
    setEditingCategory(null);
    setForm({
      name: "",
      description: "",
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name || "",
      description: category.description || "",
      isActive: category.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.warning("Category name is required");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      isActive: form.isActive,
    };

    setSaving(true);

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        toast.success("Category updated successfully");
      } else {
        await createCategory({
          name: payload.name,
          description: payload.description,
        });
        toast.success("Category created successfully");
      }

      setModalOpen(false);
      await loadCategories();
    } catch (error) {
      console.error("Save category error:", error);
      toast.error(
        error.response?.data?.message || "Unable to save category"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (category) => {
    const confirmed = window.confirm(
      `Deactivate category "${category.name}"?`
    );

    if (!confirmed) return;

    try {
      await deleteCategory(category.id);
      toast.success("Category deactivated successfully");
      await loadCategories();
    } catch (error) {
      console.error("Deactivate category error:", error);
      toast.error(
        error.response?.data?.message || "Unable to deactivate category"
      );
    }
  };

  const handleReactivate = async (category) => {
    try {
      await updateCategory(category.id, {
        isActive: true,
      });

      toast.success("Category reactivated successfully");
      await loadCategories();
    } catch (error) {
      console.error("Reactivate category error:", error);
      toast.error(
        error.response?.data?.message || "Unable to reactivate category"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 size={38} className="mx-auto animate-spin text-blue-600" />
          <p className="mt-3 text-sm text-slate-500">
            Loading categories...
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
            Category Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage product categories.
          </p>
        </div>

        <div className="flex gap-2">
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
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={17} />
            Add Category
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Categories"
          value={stats.total}
          icon={Tags}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Active Categories"
          value={stats.active}
          icon={CheckCircle}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Inactive Categories"
          value={stats.inactive}
          icon={Ban}
          color="bg-red-50 text-red-600"
        />
      </div>

      {/* FILTERS */}
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
            placeholder="Search category..."
            className={`${inputClass} pl-10`}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setCurrentPage(1);
          }}
          className={`${inputClass} md:w-52`}
        >
          <option value="ALL">All Categories</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Category Name</th>
                <th className="px-5 py-4">Description</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedCategories.map((category) => (
                <tr key={category.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-800">
                      {category.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      ID: {category.id}
                    </div>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {category.description || "—"}
                  </td>

                  <td className="px-5 py-4">
                    {category.isActive !== false ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        Inactive
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        title="Edit category"
                        onClick={() => openEditModal(category)}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil size={17} />
                      </button>

                      {category.isActive !== false ? (
                        <button
                          title="Deactivate category"
                          onClick={() => handleDeactivate(category)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={17} />
                        </button>
                      ) : (
                        <button
                          title="Reactivate category"
                          onClick={() => handleReactivate(category)}
                          className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                        >
                          <RotateCcw size={17} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {paginatedCategories.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No categories found. Add your first category.
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
            {filteredCategories.length
              ? (currentPage - 1) * pageSize + 1
              : 0}{" "}
            to{" "}
            {Math.min(currentPage * pageSize, filteredCategories.length)}{" "}
            of {filteredCategories.length} categories
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

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {editingCategory ? "Edit Category" : "Add Category"}
                </h2>
                <p className="text-xs text-slate-500">
                  Enter category information
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Category Name *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Electronics"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Enter category description..."
                  className={inputClass}
                />
              </div>

              {editingCategory && (
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        isActive: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-blue-600"
                  />
                  Active Category
                </label>
              )}

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingCategory
                      ? "Update Category"
                      : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <h3 className="mt-2 text-2xl font-bold text-slate-800">
          {value}
        </h3>
      </div>
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

export default Categories;
