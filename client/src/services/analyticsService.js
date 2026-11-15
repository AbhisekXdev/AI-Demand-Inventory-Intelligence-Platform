import api from "./api";

export const getInventoryAnalytics = async () => {
  const response = await api.get("/analytics/inventory");
  return response.data;
};