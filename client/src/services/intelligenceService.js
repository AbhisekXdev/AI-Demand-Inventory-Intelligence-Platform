import api from "./api";

export const getInventoryIntelligence = async () => {
  const response = await api.get("/intelligence/insights");
  return response.data;
};