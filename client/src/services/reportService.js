import api from "./api";

export const downloadInventoryReport = async (status = "") => {
  const response = await api.get("/reports/inventory/export", {
    params: status ? { status } : {},
    responseType: "blob",
  });

  return response.data;
};

export const downloadPurchaseOrderReport = async () => {
  const response = await api.get("/reports/purchase-orders/export", {
    responseType: "blob",
  });

  return response.data;
};