
import api from "./api";

export const getDemands = async () => {
  const response = await api.get("/demands");
  return response.data;
};

export const getDemandById = async (id) => {
  const response = await api.get(`/demands/${id}`);
  return response.data;
};

export const getProductDemands = async (productId) => {
  const response = await api.get(`/demands/product/${productId}`);
  return response.data;
};

export const createDemand = async (demandData) => {
  const response = await api.post("/demands", demandData);
  return response.data;
};

export const getDemandAnalytics = async (productId) => {
  const response = await api.get(
    `/demands/analytics/product/${productId}`
  );
  return response.data;
};

export const getDailyDemand = async (productId) => {
  const response = await api.get(
    `/demands/daily/product/${productId}`
  );
  return response.data;
};
