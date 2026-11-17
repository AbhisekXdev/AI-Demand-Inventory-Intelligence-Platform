
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  CheckCircle,
  UserX,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  User,
  Building2,
  Users,
  ShieldCheck,
  UserPlus,
  Save,
  SlidersHorizontal,
  Info,
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
  if (Array.isArray(response?.suppliers)) return response.suppliers;
  if (Array.isArray(response?.data?.suppliers)) return response.data.suppliers;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

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

    try {
      const response = await getSuppliers();
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
        supplier.contactPerson?.toLowerCase().includes(term) ||
        supplier.address?.toLowerCase().includes(term);

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

  // Close modal
  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingSupplier(null);
    setForm(emptyForm);
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
    <div className="suppliers-page mx-auto max-w-[1600px] space-y-7 pb-8">

      {/* PAGE HEADER */}
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-200">
            <Truck size={27} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Supplier Management
              </h1>

              <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Directory
              </span>
            </div>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Manage supplier details and business relationships.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadSuppliers(true)}
            disabled={loading || refreshing}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
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
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl active:translate-y-0"
          >
            <Plus size={18} />
            Add Supplier
          </button>
        </div>
      </section>

      {/* SUMMARY CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Suppliers"
          value={totalSuppliers}
          subtitle="All registered suppliers"
          icon={Truck}
          color="blue"
        />

        <SummaryCard
          title="Active Suppliers"
          value={activeSuppliers}
          subtitle="Currently available suppliers"
          icon={CheckCircle}
          color="green"
        />

        <SummaryCard
          title="Inactive Suppliers"
          value={inactiveSuppliers}
          subtitle="Deactivated supplier records"
          icon={UserX}
          color="red"
        />

        <SummaryCard
          title="Suppliers With Email"
          value={suppliersWithEmail}
          subtitle="Suppliers with email details"
          icon={Mail}
          color="violet"
        />
      </section>

      {/* SUPPLIER DIRECTORY */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">

        {/* SEARCH AND FILTER */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users size={19} className="text-blue-600" />

              <h2 className="text-base font-bold tracking-tight text-slate-900">
                Supplier Directory
              </h2>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                {suppliers.length}
              </span>
            </div>

            <p className="mt-1 text-xs font-medium text-slate-500">
              {filteredSuppliers.length} supplier records found
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 transition-all focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
              <Search size={17} className="shrink-0 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search suppliers..."
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
                <option value="ALL">All Suppliers</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-sm font-medium text-slate-500">
            <div className="rounded-2xl bg-blue-50 p-4 text-blue-600">
              <RefreshCw size={27} className="animate-spin" />
            </div>
            Loading supplier records...
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <EmptyState
            title="No suppliers found"
            description={
              suppliers.length === 0
                ? "Add your first supplier to start building your supplier directory."
                : "Try changing your search or status filter."
            }
            action={suppliers.length === 0}
            onAction={openCreateModal}
          />
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-5 py-4">Contact Person</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Phone</th>
                    <th className="px-5 py-4">Address</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedSuppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="group transition-colors duration-150 hover:bg-blue-50/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <SupplierAvatar name={supplier.name} />

                          <div className="min-w-0">
                            <p className="max-w-[190px] truncate font-bold text-slate-800">
                              {supplier.name}
                            </p>

                            <p className="mt-1 text-xs font-medium text-slate-400">
                              ID: {supplier.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-600">
                        {supplier.contactPerson || "—"}
                      </td>

                      <td className="px-5 py-4">
                        {supplier.email ? (
                          <a
                            href={`mailto:${supplier.email}`}
                            className="cursor-pointer font-medium text-blue-600 transition hover:text-blue-800 hover:underline"
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
                            className="cursor-pointer font-medium text-slate-600 transition hover:text-blue-600"
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

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(supplier)}
                            title="Edit Supplier"
                            aria-label={`Edit ${supplier.name}`}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
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
                            aria-label={`Deactivate ${supplier.name}`}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
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

            {/* MOBILE SUPPLIER CARDS */}
            <div className="grid gap-3 p-4 md:hidden">
              {paginatedSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <SupplierAvatar name={supplier.name} />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {supplier.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Supplier ID: {supplier.id}
                        </p>
                      </div>
                    </div>

                    <StatusBadge active={supplier.isActive !== false} />
                  </div>

                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    {supplier.contactPerson && (
                      <ContactDetail
                        icon={User}
                        value={supplier.contactPerson}
                      />
                    )}

                    {supplier.email && (
                      <ContactDetail
                        icon={Mail}
                        value={supplier.email}
                        href={`mailto:${supplier.email}`}
                      />
                    )}

                    {supplier.phone && (
                      <ContactDetail
                        icon={Phone}
                        value={supplier.phone}
                        href={`tel:${supplier.phone}`}
                      />
                    )}

                    {supplier.address && (
                      <ContactDetail
                        icon={MapPin}
                        value={supplier.address}
                      />
                    )}
                  </div>

                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(supplier)}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                    >
                      <Pencil size={14} />
                      Edit Supplier
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeactivate(supplier)}
                      disabled={
                        supplier.isActive === false ||
                        deletingId === supplier.id
                      }
                      className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {deletingId === supplier.id ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Deactivate
                    </button>
                  </div>
                </div>
              ))}
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

      {/* ADD / EDIT SUPPLIER MODAL */}
      {modalOpen && (
        <SupplierModal
          title={
            editingSupplier ? "Edit Supplier" : "Add New Supplier"
          }
          subtitle={
            editingSupplier
              ? "Update supplier information and contact details."
              : "Register a new supplier in your business directory."
          }
          editing={Boolean(editingSupplier)}
          form={form}
          saving={saving}
          onChange={handleChange}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
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
    green: {
      icon: "bg-emerald-50 text-emerald-600 ring-emerald-100",
      glow: "bg-emerald-500/5",
      accent: "bg-emerald-500",
    },
    red: {
      icon: "bg-red-50 text-red-600 ring-red-100",
      glow: "bg-red-500/5",
      accent: "bg-red-500",
    },
    violet: {
      icon: "bg-violet-50 text-violet-600 ring-violet-100",
      glow: "bg-violet-500/5",
      accent: "bg-violet-500",
    },
  };

  const theme = themes[color] || themes.blue;

  return (
    <div className="group relative isolate overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg sm:p-6">
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl ${theme.glow} transition-transform duration-500 group-hover:scale-150`}
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

// SUPPLIER AVATAR
function SupplierAvatar({ name }) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "S";

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 text-sm font-extrabold text-blue-700 ring-1 ring-blue-100/70">
      {initial}
    </div>
  );
}

// STATUS BADGE
function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ring-1 ring-inset ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : "bg-red-50 text-red-700 ring-red-100"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// CONTACT DETAIL
function ContactDetail({ icon: Icon, value, href }) {
  const content = (
    <>
      <Icon size={15} className="shrink-0 text-slate-400" />
      <span className="min-w-0 break-words text-xs font-medium text-slate-600">
        {value}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="flex cursor-pointer items-center gap-2 transition hover:text-blue-700"
      >
        {content}
      </a>
    );
  }

  return <div className="flex items-center gap-2">{content}</div>;
}

// EMPTY STATE
function EmptyState({ title, description, action, onAction }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Truck size={31} />
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
          Add Supplier
        </button>
      )}
    </div>
  );
}

// SUPPLIER CREATE / EDIT MODAL
function SupplierModal({
  title,
  subtitle,
  editing,
  form,
  saving,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div
      className="supplier-modal-overlay fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-modal-title"
        className="supplier-modal my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl shadow-slate-950/20"
      >
        {/* MODAL HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-5 text-white sm:px-7 sm:py-6">
          <div className="absolute -right-8 -top-16 h-48 w-48 rounded-full border-[28px] border-white/10" />
          <div className="absolute -bottom-16 right-24 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-inner backdrop-blur-sm">
                {editing ? (
                  <Pencil size={23} />
                ) : (
                  <UserPlus size={24} />
                )}
              </div>

              <div>
                <h2
                  id="supplier-modal-title"
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
              disabled={saving}
              aria-label="Close modal"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:rotate-90 hover:bg-white/20 disabled:cursor-not-allowed"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="max-h-[calc(100dvh-170px)] overflow-y-auto p-5 sm:p-7">
          <form onSubmit={onSubmit} className="space-y-6">

            {/* BASIC INFORMATION */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-xs font-extrabold text-blue-700">
                  01
                </span>

                <h3 className="text-sm font-bold text-slate-900">
                  Supplier Information
                </h3>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <FormField
                  label="Supplier / Company Name"
                  required
                  hint="Required"
                >
                  <div className="relative">
                    <Building2
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      name="name"
                      value={form.name}
                      onChange={onChange}
                      required
                      maxLength={150}
                      placeholder="Enter supplier or company name"
                      className="form-input supplier-input pl-10"
                    />
                  </div>
                </FormField>

                <FormField
                  label="Contact Person"
                  hint="Optional"
                >
                  <div className="relative">
                    <User
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      name="contactPerson"
                      value={form.contactPerson}
                      onChange={onChange}
                      maxLength={150}
                      placeholder="Enter contact person's name"
                      className="form-input supplier-input pl-10"
                    />
                  </div>
                </FormField>
              </div>
            </div>

            {/* CONTACT INFORMATION */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-extrabold text-indigo-700">
                  02
                </span>

                <h3 className="text-sm font-bold text-slate-900">
                  Contact Information
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
                <FormField label="Email Address">
                  <div className="relative">
                    <Mail
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={onChange}
                      maxLength={150}
                      placeholder="supplier@example.com"
                      className="form-input supplier-input pl-10"
                    />
                  </div>
                </FormField>

                <FormField label="Phone Number">
                  <div className="relative">
                    <Phone
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={onChange}
                      maxLength={30}
                      placeholder="Enter phone number"
                      className="form-input supplier-input pl-10"
                    />
                  </div>
                </FormField>

                <div className="sm:col-span-2">
                  <FormField label="Business Address">
                    <div className="relative">
                      <MapPin
                        size={17}
                        className="pointer-events-none absolute left-3 top-3.5 text-slate-400"
                      />

                      <textarea
                        name="address"
                        value={form.address}
                        onChange={onChange}
                        maxLength={500}
                        rows={3}
                        placeholder="Enter complete supplier address..."
                        className="form-input supplier-input min-h-24 resize-y pl-10"
                      />
                    </div>
                  </FormField>
                </div>
              </div>
            </div>

            {/* STATUS */}
            {editing && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-xs font-extrabold text-emerald-700">
                    03
                  </span>

                  <h3 className="text-sm font-bold text-slate-900">
                    Supplier Status
                  </h3>
                </div>

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-blue-200 hover:bg-blue-50/30">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        form.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      <ShieldCheck size={20} />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Supplier Active
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {form.isActive
                          ? "This supplier is currently active."
                          : "This supplier is currently inactive."}
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={onChange}
                    className="h-5 w-5 cursor-pointer accent-blue-600"
                  />
                </label>
              </div>
            )}

            {/* INFORMATION NOTE */}
            {!editing && (
              <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                <Info
                  size={16}
                  className="mt-0.5 shrink-0 text-blue-600"
                />
                <p className="text-xs leading-5 text-blue-800">
                  Supplier name is required. Email, phone, contact person
                  and address can be added or updated later.
                </p>
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <RefreshCw size={17} className="animate-spin" />
                ) : editing ? (
                  <Save size={17} />
                ) : (
                  <UserPlus size={17} />
                )}

                {saving
                  ? "Saving Supplier..."
                  : editing
                    ? "Update Supplier"
                    : "Create Supplier"}
              </button>
            </div>
          </form>
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
