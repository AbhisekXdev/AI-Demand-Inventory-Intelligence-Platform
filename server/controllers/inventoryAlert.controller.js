import Product from "../models/Product.js";
import Inventory from "../models/Inventory.js";
import Demand from "../models/Demand.js";

const getInventoryAlerts = async (req, res) => {
    try {
        const products = await Product.findAll();

        const alerts = [];

        for (const product of products) {
            const inventory = await Inventory.findOne({
                where: {
                    productId: product.id,
                },
            });

            if (!inventory) {
                continue;
            }

            // ==========================================
            // Get demand history
            // ==========================================

            const demands = await Demand.findAll({
                where: {
                    productId: product.id,
                },
                order: [["demandDate", "ASC"]],
            });

            let averageDailyDemand = 0;

            if (demands.length > 0) {
                const dailyDemandMap = {};

                demands.forEach((demand) => {
                    const date = demand.demandDate;

                    if (!dailyDemandMap[date]) {
                        dailyDemandMap[date] = 0;
                    }

                    dailyDemandMap[date] += Number(
                        demand.quantity
                    );
                });

                const dailyValues =
                    Object.values(
                        dailyDemandMap
                    ).map(Number);

                if (dailyValues.length > 0) {
                    averageDailyDemand =
                        dailyValues.reduce(
                            (sum, value) =>
                                sum + value,
                            0
                        ) /
                        dailyValues.length;
                }
            }

            // ==========================================
            // Reorder calculation
            // ==========================================

            const currentStock =
                Number(inventory.quantity) || 0;

            const leadTimeDays =
                Number(product.leadTimeDays) || 7;

            const safetyStock =
                Number(product.safetyStock) || 0;

            const reorderPoint =
                averageDailyDemand *
                    leadTimeDays +
                safetyStock;

            const recommendedOrderQuantity =
                Math.max(
                    0,
                    Math.ceil(
                        reorderPoint -
                            currentStock
                    )
                );

            // ==========================================
            // Alert level
            // ==========================================

            let alertLevel = "NORMAL";

            if (currentStock <= 0) {
                alertLevel = "OUT_OF_STOCK";
            } else if (
                currentStock <
                averageDailyDemand * 3
            ) {
                alertLevel = "CRITICAL";
            } else if (
                currentStock <= reorderPoint
            ) {
                alertLevel = "LOW";
            }

            // ==========================================
            // Only return actual alerts
            // ==========================================

            if (alertLevel !== "NORMAL") {
                alerts.push({
                    productId: product.id,

                    productName:
                        product.name,

                    sku: product.sku,

                    currentStock,

                    averageDailyDemand:
                        Number(
                            averageDailyDemand.toFixed(
                                2
                            )
                        ),

                    leadTimeDays,

                    safetyStock,

                    reorderPoint:
                        Number(
                            reorderPoint.toFixed(
                                2
                            )
                        ),

                    shortage:
                        Math.max(
                            0,
                            Math.ceil(
                                reorderPoint -
                                    currentStock
                            )
                        ),

                    recommendedOrderQuantity,

                    alertLevel,
                });
            }
        }

        // ==========================================
        // Sort critical alerts first
        // ==========================================

        const priority = {
            OUT_OF_STOCK: 1,
            CRITICAL: 2,
            LOW: 3,
        };

        alerts.sort(
            (a, b) =>
                priority[a.alertLevel] -
                priority[b.alertLevel]
        );

        return res.status(200).json({
            success: true,

            count: alerts.length,

            alerts,
        });
    } catch (error) {
        console.error(
            "Inventory Alert Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export {
    getInventoryAlerts,
};