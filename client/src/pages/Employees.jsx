
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { toast } from "react-toastify";
import {
  Users, UserPlus, RefreshCw, Search, X, ShieldCheck,
  UserRound, Pencil, UserCheck, UserX, Mail, Phone,
  Building2, CalendarDays, MapPin, Briefcase, IndianRupee,
  IdCard, ChevronRight, LockKeyhole, UserCircle2,
} from "lucide-react";

const initialForm = {
  employeeCode: "",
  name: "",
  email: "",
  password: "",
  role: "staff",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  dateOfBirth: "",
  emergencyContact: "",
  joiningDate: "",
  designation: "",
  department: "",
  salary: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

function Field({ label, required = false, children }) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Section({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3 border-b border-slate-100 pb-4">
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
          <Icon size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color, progress }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={21} />
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </h2>
        <span className="text-xs text-slate-400">{subtitle}</span>
      </div>
      {progress !== undefined && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState(initialForm);

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/auth/employees");
      setEmployees(response.data.employees || []);
      setActiveCount(response.data.activeCount || 0);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to load employees"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingEmployee(null);
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Please complete all mandatory fields");
      return;
    }

    if (!editingEmployee && form.password.length < 8) {
      toast.error("Password must contain at least 8 characters");
      return;
    }

    if (!editingEmployee && activeCount >= 50) {
      toast.error("Maximum limit of 50 active employees reached");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        salary: form.salary === "" ? null : Number(form.salary),
      };

      let response;

      if (editingEmployee) {
        const { password, ...updatePayload } = payload;
        response = await api.patch(
          `/auth/employees/${editingEmployee.id}`,
          updatePayload
        );
      } else {
        response = await api.post("/auth/employees", payload);
      }

      toast.success(
        response.data.message ||
          (editingEmployee
            ? "Employee updated successfully"
            : "Employee created successfully")
      );

      resetForm();
      await loadEmployees();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (editingEmployee
            ? "Unable to update employee"
            : "Unable to create employee")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);

    setForm({
      employeeCode: employee.employeeCode || "",
      name: employee.name || "",
      email: employee.email || "",
      password: "",
      role: employee.role || "staff",
      phone: employee.phone || "",
      address: employee.address || "",
      city: employee.city || "",
      state: employee.state || "",
      pincode: employee.pincode || "",
      dateOfBirth: employee.dateOfBirth
        ? String(employee.dateOfBirth).slice(0, 10)
        : "",
      emergencyContact: employee.emergencyContact || "",
      joiningDate: employee.joiningDate
        ? String(employee.joiningDate).slice(0, 10)
        : "",
      designation: employee.designation || "",
      department: employee.department || "",
      salary: employee.salary ?? "",
    });

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleStatus = async (employee) => {
    const action = employee.isActive ? "deactivate" : "activate";

    if (!window.confirm(`Are you sure you want to ${action} ${employee.name}?`)) {
      return;
    }

    try {
      setUpdatingId(employee.id);

      const response = await api.patch(
        `/auth/employees/${employee.id}/status`
      );

      toast.success(
        response.data.message || `Employee ${action}d successfully`
      );

      await loadEmployees();
    } catch (error) {
      toast.error(
        error.response?.data?.message || `Unable to ${action} employee`
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const query = search.toLowerCase();

    const matchesSearch =
      employee.name?.toLowerCase().includes(query) ||
      employee.email?.toLowerCase().includes(query) ||
      employee.role?.toLowerCase().includes(query) ||
      employee.employeeCode?.toLowerCase().includes(query) ||
      employee.department?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && employee.isActive) ||
      (statusFilter === "inactive" && !employee.isActive);

    return matchesSearch && matchesStatus;
  });

  const inactiveCount = employees.length - activeCount;

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/70 p-4 sm:p-6 lg:p-8">

      {/* Page Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-blue-800 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-200">
              <Users size={15} />
              Organization Management
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Employee Management
            </h1>
            <p className="mt-2 max-w-xl text-sm text-blue-100/80">
              Manage employee profiles, roles, access and employment details
              from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadEmployees}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              onClick={() => {
                if (showForm) {
                  resetForm();
                } else {
                  setEditingEmployee(null);
                  setForm(initialForm);
                  setShowForm(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              {showForm ? <X size={17} /> : <UserPlus size={17} />}
              {showForm ? "Close Form" : "Add Employee"}
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Employees"
          value={employees.length}
          subtitle="Registered"
          icon={Users}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Active Employees"
          value={activeCount}
          subtitle="Currently enabled"
          icon={ShieldCheck}
          color="bg-emerald-50 text-emerald-600"
          progress={(activeCount / 50) * 100}
        />
        <StatCard
          title="Available Slots"
          value={Math.max(0, 50 - activeCount)}
          subtitle="Out of 50"
          icon={UserRound}
          color="bg-violet-50 text-violet-600"
          progress={(activeCount / 50) * 100}
        />
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-slate-50/80 p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
                  {editingEmployee ? <Pencil size={19} /> : <UserPlus size={19} />}
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingEmployee ? "Edit Employee" : "Create New Employee"}
                </h2>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Complete the employee information in the sections below.
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="self-start rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 sm:self-center"
              aria-label="Close form"
            >
              <X size={21} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs text-blue-800">
              <span className="font-bold text-red-500">*</span> Indicates a
              mandatory field. Please complete all required information.
            </div>

            <Section
              icon={IdCard}
              title="Account Information"
              description="Login credentials and employee identification"
            >
              <Field label="Employee Code">
                <input
                  name="employeeCode"
                  value={form.employeeCode}
                  onChange={handleChange}
                  placeholder="Example: EMP-001"
                  className={inputClass}
                />
              </Field>

              <Field label="Full Name" required>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  autoComplete="name"
                  required
                  className={inputClass}
                />
              </Field>

              <Field label="Email Address" required>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="employee@company.com"
                  autoComplete="email"
                  required
                  className={inputClass}
                />
              </Field>

              {!editingEmployee && (
                <Field label="Temporary Password" required>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    autoComplete="new-password"
                    required
                    className={inputClass}
                  />
                </Field>
              )}

              <Field label="Employee Role" required>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  required
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                </select>
              </Field>
            </Section>

            <Section
              icon={UserCircle2}
              title="Personal Information"
              description="Employee contact and personal details"
            >
              <Field label="Phone Number">
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className={inputClass}
                />
              </Field>

              <Field label="Emergency Contact">
                <input
                  type="tel"
                  name="emergencyContact"
                  value={form.emergencyContact}
                  onChange={handleChange}
                  placeholder="Emergency contact number"
                  className={inputClass}
                />
              </Field>

              <Field label="Date of Birth">
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  className={inputClass}
                />
              </Field>

              <Field label="Pincode">
                <input
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  placeholder="Enter pincode"
                  maxLength={10}
                  className={inputClass}
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Full Address">
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    rows={3}
                    placeholder="House number, street, area..."
                    className={`${inputClass} resize-y`}
                  />
                </Field>
              </div>

              <Field label="City">
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                  className={inputClass}
                />
              </Field>

              <Field label="State">
                <input
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="Enter state"
                  className={inputClass}
                />
              </Field>
            </Section>

            <Section
              icon={Briefcase}
              title="Employment Information"
              description="Department, designation and compensation details"
            >
              <Field label="Joining Date">
                <input
                  type="date"
                  name="joiningDate"
                  value={form.joiningDate}
                  onChange={handleChange}
                  className={inputClass}
                />
              </Field>

              <Field label="Designation">
                <input
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  placeholder="Example: Inventory Executive"
                  className={inputClass}
                />
              </Field>

              <Field label="Department">
                <input
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  placeholder="Example: Inventory"
                  className={inputClass}
                />
              </Field>

              <Field label="Monthly Salary (₹)">
                <div className="relative">
                  <IndianRupee
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="number"
                    name="salary"
                    value={form.salary}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="Enter monthly salary"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </Field>
            </Section>

            {/* Form Footer */}
            <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
              <p className="text-xs text-slate-400">
                Please review the information before saving.
              </p>
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || (!editingEmployee && activeCount >= 50)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-7 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && <RefreshCw size={16} className="animate-spin" />}
                  {saving
                    ? "Saving..."
                    : editingEmployee
                      ? "Update Employee"
                      : "Create Employee"}
                  {!saving && <ChevronRight size={17} />}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Employee Directory */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Employee Directory
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View and manage all registered employees.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-400 focus-within:bg-white">
                <Search size={17} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, email, code..."
                  className="w-full bg-transparent text-sm outline-none sm:w-64"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-400"
              >
                <option value="all">All Employees</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-lg bg-slate-100 px-3 py-2 text-slate-600">
              Total: {employees.length}
            </span>
            <span className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
              Active: {activeCount}
            </span>
            <span className="rounded-lg bg-red-50 px-3 py-2 text-red-700">
              Inactive: {inactiveCount}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-14">
            <RefreshCw size={25} className="animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">Loading employees...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Users size={30} />
            </div>
            <h3 className="mt-4 font-bold text-slate-800">
              No employees found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or create a new employee.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4 font-bold">Employee</th>
                  <th className="px-5 py-4 font-bold">Employee Code</th>
                  <th className="px-5 py-4 font-bold">Contact</th>
                  <th className="px-5 py-4 font-bold">Department / Role</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 font-bold">Joining Date</th>
                  <th className="px-5 py-4 text-center font-bold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="transition hover:bg-blue-50/40"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-sm font-bold uppercase text-blue-700">
                          {employee.name?.trim()?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            {employee.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            ID: {employee.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                        {employee.employeeCode || "Not assigned"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Mail size={14} className="text-slate-400" />
                        {employee.email}
                      </div>
                      {employee.phone && (
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                          <Phone size={13} />
                          {employee.phone}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-700">
                        {employee.department || "—"}
                      </p>
                      <span className={`mt-1 inline-flex rounded-md px-2 py-1 text-[11px] font-bold capitalize ${
                        employee.role === "manager"
                          ? "bg-violet-50 text-violet-700"
                          : "bg-blue-50 text-blue-700"
                      }`}>
                        {employee.role}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                        employee.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          employee.isActive ? "bg-emerald-500" : "bg-red-500"
                        }`} />
                        {employee.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={14} className="text-slate-400" />
                        {employee.joiningDate
                          ? new Date(employee.joiningDate).toLocaleDateString("en-IN")
                          : employee.createdAt
                            ? new Date(employee.createdAt).toLocaleDateString("en-IN")
                            : "—"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditEmployee(employee)}
                          title="Edit employee"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(employee)}
                          disabled={updatingId === employee.id}
                          title={employee.isActive ? "Deactivate employee" : "Activate employee"}
                          className={`inline-flex min-w-[112px] items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition disabled:cursor-wait disabled:opacity-50 ${
                            employee.isActive
                              ? "border-red-100 bg-red-50 text-red-700 hover:border-red-200 hover:bg-red-100"
                              : "border-emerald-100 bg-emerald-50 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          {updatingId === employee.id ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : employee.isActive ? (
                            <UserX size={14} />
                          ) : (
                            <UserCheck size={14} />
                          )}
                          {updatingId === employee.id
                            ? "Please wait"
                            : employee.isActive
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center">
          <span>
            Showing {filteredEmployees.length} of {employees.length} employees
          </span>
          <span className="font-medium">
            Active employee limit: {activeCount} / 50
          </span>
        </div>
      </div>
    </div>
  );
}
