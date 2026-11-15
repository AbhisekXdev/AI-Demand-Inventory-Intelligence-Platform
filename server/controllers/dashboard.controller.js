
import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import Inventory from "../models/Inventory.js";
import PurchaseOrder from "../models/PurchaseOrder.js";

export const getDashboardSummary = async (req, res) => {
    try {
        // 1. Fetch dashboard data
        const [
            products,
            suppliers,
            inventories,
            purchaseOrders,
        ] = await Promise.all([
            Product.findAll({
                where: { isActive: true },
                attributes: ["id", "name", "costPrice", "reorderLevel"],
            }),

            Supplier.findAll({
                where: { isActive: true },
                attributes: ["id", "name"],
            }),

            Inventory.findAll({
                where: { isActive: true },
            }),

            PurchaseOrder.findAll({
                order: [["createdAt", "DESC"]],
                limit: 5,
                attributes: [
                    "id",
                    "poNumber",
                    "supplierId",
                    "orderDate",
                    "status",
                    "totalAmount",
                ],
            }),
        ]);

        // 2. Map products
        const productMap = new Map(
            products.map(product => [
                Number(product.id),
                product,
            ])
        );

        // 3. Inventory calculations
        let totalInventoryUnits = 0;
        let totalInventoryValue = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;
        let healthyStockCount = 0;

        for (const inventory of inventories) {
            const product = productMap.get(
                Number(inventory.productId)
            );

            if (!product) continue;

            const quantity = Number(inventory.quantity || 0);
            const reserved = Number(
                inventory.reservedQuantity || 0
            );

            const available = Math.max(0, quantity - reserved);

            const reorderLevel = Number(
                inventory.reorderLevel ?? product.reorderLevel
            );

            totalInventoryUnits += quantity;

            totalInventoryValue +=
                quantity * Number(product.costPrice || 0);

            if (available <= 0) {
                outOfStockCount++;
            } else if (available <= reorderLevel) {
                lowStockCount++;
            } else {
                healthyStockCount++;
            }
        }

        // 4. Purchase order calculations
        const allPurchaseOrders = await PurchaseOrder.findAll({
            attributes: ["status", "totalAmount"],
        });

        const totalPurchaseOrders = allPurchaseOrders.length;

        const pendingPurchaseOrders = allPurchaseOrders.filter(
            po => [
                "DRAFT",
                "ORDERED",
                "PARTIALLY_RECEIVED",
            ].includes(po.status)
        ).length;

        const totalPurchaseOrderValue = allPurchaseOrders.reduce(
            (total, po) => total + Number(po.totalAmount || 0),
            0
        );
        const recentPurchaseOrders = purchaseOrders.map(po => ({
    id: po.id,
    poNumber: po.poNumber,
    supplierId: po.supplierId,
    orderDate: po.orderDate,
    status: po.status,
    totalAmount: Number(po.totalAmount),
}));

        // 5. Dashboard response
        return res.status(200).json({
            success: true,
            message: "Dashboard summary generated successfully",

            dashboard: {
                products: {
                    total: products.length,
                },

                suppliers: {
                    total: suppliers.length,
                },

                inventory: {
                    totalUnits: totalInventoryUnits,
                    totalValue: Number(
                        totalInventoryValue.toFixed(2)
                    ),
                    lowStock: lowStockCount,
                    outOfStock: outOfStockCount,
                    healthyStock: healthyStockCount,
                },

                purchaseOrders: {
                    total: totalPurchaseOrders,
                    pending: pendingPurchaseOrders,
                    totalValue: Number(
                        totalPurchaseOrderValue.toFixed(2)
                    ),
                },

                recentPurchaseOrders,
            },
        });

    } catch (error) {
        console.error("Dashboard Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate dashboard summary",
            error: error.message,
        });
    }
};
