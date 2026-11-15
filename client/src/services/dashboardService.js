
import api from "./api";

export const getDashboardSummary = async () => {
    const response = await api.get("/dashboard/summary");
    return response.data;
};

export const getInventoryAnalytics = async () => {
    const response = await api.get("/analytics/inventory");
    return response.data;
};

export const getAIInsights = async () => {
    const response = await api.get("/intelligence/insights");
    return response.data;
};
