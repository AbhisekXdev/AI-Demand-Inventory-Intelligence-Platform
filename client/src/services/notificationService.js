
import api from "./api";

const READ_NOTIFICATIONS_KEY = "inventory_read_notifications";

// Fetch inventory alerts and purchase orders
export const getNotifications = async () => {
  const [inventoryResponse, purchaseOrderResponse] =
    await Promise.all([
      api.get("/inventory/alerts/"),
      api.get("/purchase-orders"),
    ]);

  const inventoryAlerts =
    inventoryResponse?.data?.alerts || [];

  const purchaseOrders =
    purchaseOrderResponse?.data?.purchaseOrders || [];

  // Convert inventory alerts into notifications
  const stockNotifications = inventoryAlerts.map((alert) => ({
    id: `stock-${alert.productId}-${alert.alertLevel}`,
    type: "INVENTORY",
    title:
      alert.alertLevel === "OUT_OF_STOCK"
        ? "Product out of stock"
        : alert.alertLevel === "CRITICAL"
        ? "Critical stock alert"
        : "Low stock warning",
    message: `${alert.productName} (${alert.sku}) has ${alert.currentStock} units available.`,
    priority:
      alert.alertLevel === "OUT_OF_STOCK" ||
      alert.alertLevel === "CRITICAL"
        ? "HIGH"
        : "MEDIUM",
    productId: alert.productId,
    createdAt: new Date().toISOString(),
  }));

  // Find overdue purchase orders
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueNotifications = purchaseOrders
    .filter((order) => {
      if (
        !order.expectedDeliveryDate ||
        ["RECEIVED", "CANCELLED", "DRAFT"].includes(order.status)
      ) {
        return false;
      }

      const expectedDate = new Date(
        order.expectedDeliveryDate
      );

      expectedDate.setHours(0, 0, 0, 0);

      return expectedDate < today;
    })
    .map((order) => ({
      id: `po-overdue-${order.id}`,
      type: "PURCHASE_ORDER",
      title: "Purchase order overdue",
      message: `Purchase order ${order.poNumber} has passed its expected delivery date.`,
      priority: "HIGH",
      purchaseOrderId: order.id,
      createdAt: order.expectedDeliveryDate,
    }));

  const notifications = [
    ...stockNotifications,
    ...overdueNotifications,
  ];

  return notifications.sort(
    (a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
  );
};

// Read notification IDs from browser storage
export const getReadNotificationIds = () => {
  try {
    const saved = localStorage.getItem(
      READ_NOTIFICATIONS_KEY
    );

    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// Mark one notification as read
export const markNotificationAsRead = (notificationId) => {
  const readIds = getReadNotificationIds();

  if (!readIds.includes(notificationId)) {
    localStorage.setItem(
      READ_NOTIFICATIONS_KEY,
      JSON.stringify([...readIds, notificationId])
    );
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = (notifications) => {
  const existingIds = getReadNotificationIds();

  const newIds = notifications.map(
    (notification) => notification.id
  );

  localStorage.setItem(
    READ_NOTIFICATIONS_KEY,
    JSON.stringify([
      ...new Set([...existingIds, ...newIds]),
    ])
  );
};
