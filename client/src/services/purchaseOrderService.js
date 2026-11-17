import api from "./api";

export const getPurchaseOrders = async () => {
    const response = await api.get("/purchase-orders");
    return response.data;
};

export const getPurchaseOrderById = async (id) => {
    const response = await api.get(`/purchase-orders/${id}`);
    return response.data;
};

export const createPurchaseOrder = async (purchaseOrderData) => {
    const response = await api.post("/purchase-orders", purchaseOrderData);
    return response.data;
};

export const receivePurchaseOrder = async (id, items) => {
    const response = await api.patch(`/purchase-orders/${id}/receive`, {
        items,
    });
    return response.data;
};

export const cancelPurchaseOrder = async (id) => {
    const response = await api.patch(`/purchase-orders/${id}/cancel`);
    return response.data;
};