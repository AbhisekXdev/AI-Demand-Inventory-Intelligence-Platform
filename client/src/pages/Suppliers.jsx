import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Users,
  CheckCircle,
  UserX,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  User,
} from "lucide-react";

import { toast } from "react-toastify";

import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deactivateSupplier,
} from "../services/supplierService";

const PAGE_SIZE = 8;

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  contactPerson: "",
  isActive: true,
};

const getSuppliersArray = (response) => {
  if (Array.isArray(response?.suppliers)) {
    return response.suppliers;
  }

  if (Array.isArray(response?.data?.suppliers)) {
    return response.data.suppliers;
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
  error.response?.data?.message ||
  error.message ||
  fallback;

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const [form, setForm] = useState(emptyForm);

  // Load suppliers
  const loadSuppliers = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const startedAt = Date.now();

    try {
      const response = await getSuppliers();

      const remaining = Math.max(
        0,
        700 - (Date.now() - startedAt)
      );

      if (remaining > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, remaining)
        );
      }

      setSuppliers(getSuppliersArray(response));

      if (manual) {
        toast.success("Suppliers refreshed successfully.");
      }
    } catch (error) {
      console.error("Load suppliers error:", error);

      toast.error(
        getErrorMessage(error, "Unable to load suppliers.")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  // Summary
  const totalSuppliers = suppliers.length;

  const activeSuppliers = suppliers.filter(
    (supplier) => supplier.isActive !== false
  ).length;

  const inactiveSuppliers = suppliers.filter(
    (supplier) => supplier.isActive === false
  ).length;

  const suppliersWithEmail = suppliers.filter(
    (supplier) => Boolean(supplier.email)
  ).length;

  // Search and filter
  const filteredSuppliers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      const matchesSearch =
        !term ||
        supplier.name?.toLowerCase().includes(term) ||
        supplier.email?.toLowerCase().includes(term) ||
        supplier.phone?.toLowerCase().includes(term) ||
        supplier.contactPerson?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" &&
          supplier.isActive !== false) ||
        (statusFilter === "INACTIVE" &&
          supplier.isActive === false);

      return matchesSearch && matchesStatus;
    });
  }, [suppliers, search, statusFilter]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredSuppliers.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Open create modal
  const openCreateModal = () => {
    setEditingSupplier(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);

    setForm({
      name: supplier.name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      contactPerson: supplier.contactPerson || "",
      isActive: supplier.isActive !== false,
    });

    setModalOpen(true);
  };

  // Form input handler
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Create or update supplier
  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const address = form.address.trim();
    const contactPerson = form.contactPerson.trim();

    if (!name) {
      toast.error("Supplier name is required.");
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    const supplierData = {
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
      contactPerson: contactPerson || null,
    };

    try {
      setSaving(true);

      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, {
          ...supplierData,
          isActive: form.isActive,
        });

        toast.success("Supplier updated successfully.");
      } else {
        await createSupplier(supplierData);

        toast.success("Supplier created successfully.");
      }

      setModalOpen(false);
      setEditingSupplier(null);
      setForm(emptyForm);

      await loadSuppliers();
    } catch (error) {
      console.error("Save supplier error:", error);

      toast.error(
        getErrorMessage(error, "Unable to save supplier.")
      );
    } finally {
      setSaving(false);
    }
  };

  // Deactivate supplier
  const handleDeactivate = async (supplier) => {
    if (supplier.isActive === false) {
      toast.info("This supplier is already inactive.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${supplier.name}?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(supplier.id);

      await deactivateSupplier(supplier.id);

      toast.success("Supplier deactivated successfully.");

      await loadSuppliers();
    } catch (error) {
      console.error("Deactivate supplier error:", error);

      toast.error(
        getErrorMessage(error, "Unable to deactivate supplier.")
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div className="flex items-center gap-3">

          <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
            <Truck size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Supplier Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage supplier details and supplier relationships
            </p>
          </div>

        </div>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={() => loadSuppliers(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                loading || refreshing ? "animate-spin" : ""
              }
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={17} />
            Add Supplier
          </button>

        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <SummaryCard
          title="Total Suppliers"
          value={totalSuppliers}
          icon={Truck}
          color="blue"
        />

        <SummaryCard
          title="Active Suppliers"
          value={activeSuppliers}
          icon={CheckCircle}
          color="green"
        />

        <SummaryCard
          title="Inactive Suppliers"
          value={inactiveSuppliers}
          icon={UserX}
          color="red"
        />

        <SummaryCard
          title="Suppliers With Email"
          value={suppliersWithEmail}
          icon={Mail}
          color="purple"
        />

      </div>

      {/* Supplier List */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Search and Filter */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h2 className="font-bold text-slate-800">
              Supplier Directory
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredSuppliers.length} supplier records found
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5">
              <Search size={17} className="text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search suppliers..."
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
              <option value="ALL">All Suppliers</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

          </div>
        </div>

        {/* Table */}
        {loading ? (

          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
            <RefreshCw
              size={25}
              className="animate-spin text-blue-600"
            />
            Loading suppliers...
          </div>

        ) : filteredSuppliers.length === 0 ? (

          <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">

            <Truck size={38} className="mb-3 text-slate-300" />

            <p className="font-semibold text-slate-700">
              No suppliers found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {suppliers.length === 0
                ? "Add your first supplier to get started."
                : "Try changing your search or filter."}
            </p>

            {suppliers.length === 0 && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Add Supplier
              </button>
            )}

          </div>

        ) : (

          <>
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px] text-left text-sm">

                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Supplier</th>
                    <th className="px-5 py-4">Contact Person</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Phone</th>
                    <th className="px-5 py-4">Address</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {paginatedSuppliers.map((supplier) => (

                    <tr
                      key={supplier.id}
                      className="hover:bg-slate-50"
                    >

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-600">
                            {supplier.name?.charAt(0)?.toUpperCase() || "S"}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {supplier.name}
                            </p>

                            <p className="text-xs text-slate-400">
                              ID: {supplier.id}
                            </p>
                          </div>

                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {supplier.contactPerson || "—"}
                      </td>

                      <td className="px-5 py-4">
                        {supplier.email ? (
                          <a
                            href={`mailto:${supplier.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {supplier.email}
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {supplier.phone ? (
                          <a
                            href={`tel:${supplier.phone}`}
                            className="text-slate-600 hover:text-blue-600"
                          >
                            {supplier.phone}
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="max-w-48 px-5 py-4 text-slate-600">
                        <p className="truncate">
                          {supplier.address || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          active={supplier.isActive !== false}
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() => openEditModal(supplier)}
                            title="Edit Supplier"
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeactivate(supplier)}
                            disabled={
                              supplier.isActive === false ||
                              deletingId === supplier.id
                            }
                            title="Deactivate Supplier"
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {deletingId === supplier.id ? (
                              <RefreshCw
                                size={16}
                                className="animate-spin"
                              />
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

      {/* Add / Edit Supplier Modal */}
      {modalOpen && (
        <Modal
          title={
            editingSupplier ? "Edit Supplier" : "Add New Supplier"
          }
          onClose={() => !saving && setModalOpen(false)}
        >

          <form onSubmit={handleSubmit} className="space-y-4">

            <FormField label="Supplier Name" required>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Enter supplier name"
                className="form-input"
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <FormField label="Email Address">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="supplier@example.com"
                  className="form-input"
                />
              </FormField>

              <FormField label="Phone Number">
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="form-input"
                />
              </FormField>

              <FormField label="Contact Person">
                <input
                  name="contactPerson"
                  value={form.contactPerson}
                  onChange={handleChange}
                  placeholder="Enter contact person"
                  className="form-input"
                />
              </FormField>

              <FormField label="Address">
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter supplier address"
                  className="form-input"
                />
              </FormField>

            </div>

            {editingSupplier && (
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">

                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 accent-blue-600"
                />

                <span className="text-sm font-medium text-slate-700">
                  Supplier Active
                </span>

              </label>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() => setModalOpen(false)}
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
                  <RefreshCw
                    size={15}
                    className="animate-spin"
                  />
                )}

                {saving
                  ? "Saving..."
                  : editingSupplier
                    ? "Update Supplier"
                    : "Create Supplier"}
              </button>

            </div>

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
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
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

// Supplier Status
function StatusBadge({ active }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-100 text-emerald-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// Modal
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

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