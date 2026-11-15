import api from "./api";

// Get all suppliers
export const getSuppliers = async () => {
  const response = await api.get("/suppliers");
  return response.data;
};

// Get supplier by ID
export const getSupplierById = async (id) => {
  const response = await api.get(`/suppliers/${id}`);
  return response.data;
};

// Create supplier
export const createSupplier = async (supplierData) => {
  const response = await api.post("/suppliers", supplierData);
  return response.data;
};

// Update supplier
export const updateSupplier = async (id, supplierData) => {
  const response = await api.put(`/suppliers/${id}`, supplierData);
  return response.data;
};

// Deactivate supplier
export const deactivateSupplier = async (id) => {
  const response = await api.delete(`/suppliers/${id}`);
  return response.data;
};