import api from "./api";

// Get all inventory records
export const getInventory = async () => {
  const response = await api.get("/inventory");
  return response.data;
};

// Create initial inventory for a product
export const createInventory = async (inventoryData) => {
  const response = await api.post("/inventory", inventoryData);
  return response.data;
};

// Add or remove stock
export const adjustStock = async (productId, adjustmentData) => {
  const response = await api.patch(
    `/inventory/product/${productId}/adjust`,
    adjustmentData
  );

  return response.data;
};