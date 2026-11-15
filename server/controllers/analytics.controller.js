
import Product from "../models/Product.js";
import Inventory from "../models/Inventory.js";

export const getInventoryAnalytics = async (req, res) => {
    try {
        // 1. Fetch active products and inventory
        const [products, inventories] = await Promise.all([
            Product.findAll({
                where: { isActive: true },
                attributes: [
                    "id",
                    "name",
                    "sku",
                    "costPrice",
                    "reorderLevel",
                ],
            }),

            Inventory.findAll({
                where: { isActive: true },
            }),
        ]);

        // 2. Create product lookup
        const productMap = new Map(
            products.map((product) => [
                Number(product.id),
                product,
            ])
        );

        // 3. Calculate inventory metrics
        let totalInventoryUnits = 0;
        let totalInventoryValue = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;

        const lowStockProducts = [];
        const outOfStockProducts = [];

        for (const inventory of inventories) {
            const product = productMap.get(
                Number(inventory.productId)
            );

            if (!product) continue;

            const quantity = Number(inventory.quantity || 0);
            const reservedQuantity = Number(
                inventory.reservedQuantity || 0
            );

            const availableStock = Math.max(
                0,
                quantity - reservedQuantity
            );

            const reorderLevel = Number(
                inventory.reorderLevel ?? product.reorderLevel
            );

            const costPrice = Number(product.costPrice || 0);

            totalInventoryUnits += quantity;
            totalInventoryValue += quantity * costPrice;

            const productInfo = {
                productId: product.id,
                productName: product.name,
                sku: product.sku,
                currentStock: quantity,
                reservedQuantity,
                availableStock,
                reorderLevel,
            };

            // 4. Out-of-stock products
            if (availableStock <= 0) {
                outOfStockCount++;
                outOfStockProducts.push(productInfo);
            }

            // 5. Low-stock products (excluding out of stock)
            else if (availableStock <= reorderLevel) {
                lowStockCount++;
                lowStockProducts.push(productInfo);
            }
        }

        // 6. Return analytics
        return res.status(200).json({
            success: true,
            message: "Inventory analytics generated successfully",

            analytics: {
                totalActiveProducts: products.length,
                totalInventoryRecords: inventories.filter(
                    (item) =>
                        productMap.has(Number(item.productId))
                ).length,

                totalInventoryUnits,
                totalInventoryValue: Number(
                    totalInventoryValue.toFixed(2)
                ),

                lowStockCount,
                outOfStockCount,

                healthyStockCount:
                    inventories.filter((item) => {
                        const product = productMap.get(
                            Number(item.productId)
                        );

                        if (!product) return false;

                        const available =
                            Number(item.quantity || 0) -
                            Number(item.reservedQuantity || 0);

                        const reorderLevel = Number(
                            item.reorderLevel ?? product.reorderLevel
                        );

                        return available > reorderLevel;
                    }).length,
            },

            lowStockProducts,
            outOfStockProducts,
        });
    } catch (error) {
        console.error("Inventory Analytics Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate inventory analytics",
            error: error.message,
        });
    }
};
