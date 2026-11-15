
import api from "./api";

export const getReplenishmentInsights = async () => {
  const response = await api.get("/intelligence/insights");
  return response.data;
};
