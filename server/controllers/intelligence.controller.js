
import { Op } from "sequelize";

import Product from "../models/Product.js";
import Inventory from "../models/Inventory.js";
import Demand from "../models/Demand.js";

export const getInventoryInsights = async (req, res) => {
    try {
        // 1. Prepare date ranges
        const today = new Date();

        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");

            return `${year}-${month}-${day}`;
        };

        const currentStart = new Date(today);
        currentStart.setDate(currentStart.getDate() - 29);

        const previousStart = new Date(today);
        previousStart.setDate(previousStart.getDate() - 59);

        const previousEnd = new Date(today);
        previousEnd.setDate(previousEnd.getDate() - 30);

        // 2. Fetch existing data
        const [products, inventories, demands] = await Promise.all([
            Product.findAll({
                where: { isActive: true },
            }),

            Inventory.findAll({
                where: { isActive: true },
            }),

            Demand.findAll({
                where: {
                    demandDate: {
                        [Op.between]: [
                            formatDate(previousStart),
                            formatDate(today),
                        ],
                    },
                },
                attributes: ["productId", "demandDate", "quantity"],
            }),
        ]);

        const inventoryMap = new Map(
            inventories.map(item => [
                Number(item.productId),
                item,
            ])
        );

        // 3. Generate insights for each product
        const insights = [];

        for (const product of products) {
            const productId = Number(product.id);
            const inventory = inventoryMap.get(productId);

            const currentStock = Number(inventory?.quantity || 0);
            const reservedQuantity = Number(
                inventory?.reservedQuantity || 0
            );

            const availableStock = Math.max(
                0,
                currentStock - reservedQuantity
            );

            const leadTimeDays = Number(product.leadTimeDays || 7);

            const reorderLevel = Number(
                inventory?.reorderLevel ?? product.reorderLevel ?? 10
            );

            // Demand in the latest 30 days and previous 30 days
            let currentDemand = 0;
            let previousDemand = 0;

            for (const demand of demands) {
                if (Number(demand.productId) !== productId) continue;

                const demandDate = demand.demandDate;

                if (demandDate >= formatDate(currentStart)) {
                    currentDemand += Number(demand.quantity);
                } else if (
                    demandDate >= formatDate(previousStart) &&
                    demandDate <= formatDate(previousEnd)
                ) {
                    previousDemand += Number(demand.quantity);
                }
            }

            const averageDailyDemand = currentDemand / 30;

            // 4. Demand trend
            let demandTrend = "STABLE";
            let demandChangePercent = 0;

            if (previousDemand === 0 && currentDemand > 0) {
                demandTrend = "INCREASING";
                demandChangePercent = 100;
            } else if (previousDemand > 0) {
                demandChangePercent = Number(
                    (
                        ((currentDemand - previousDemand) /
                            previousDemand) * 100
                    ).toFixed(2)
                );

                if (demandChangePercent >= 10) {
                    demandTrend = "INCREASING";
                } else if (demandChangePercent <= -10) {
                    demandTrend = "DECREASING";
                }
            }

            // 5. Stock coverage and replenishment
            const stockCoverageDays =
                averageDailyDemand > 0
                    ? Number(
                        (availableStock / averageDailyDemand).toFixed(2)
                    )
                    : null;

            const forecastDemand = Math.ceil(
                averageDailyDemand * leadTimeDays
            );

            const reorderPoint = forecastDemand + reorderLevel;

            const recommendedQuantity = Math.max(
                0,
                reorderPoint - availableStock
            );

            // 6. Risk and priority
            let riskLevel = "LOW";
            let priority = "NORMAL";
            let recommendation = "Inventory level is healthy.";

            if (!inventory || availableStock <= 0) {
                riskLevel = "CRITICAL";
                priority = "CRITICAL";
                recommendation = inventory
                    ? "Product is out of available stock. Replenishment is required."
                    : "Inventory record is missing. Create an inventory record and verify stock.";
            } else if (
                averageDailyDemand > 0 &&
                stockCoverageDays <= leadTimeDays
            ) {
                riskLevel = "HIGH";
                priority = "HIGH";
                recommendation =
                    "Stock may run out before the supplier lead time. Replenish soon.";
            } else if (availableStock <= reorderPoint) {
                riskLevel = "MEDIUM";
                priority = "MEDIUM";
                recommendation =
                    "Stock has reached the reorder point. Plan replenishment.";
            }

            if (
                demandTrend === "INCREASING" &&
                riskLevel === "LOW"
            ) {
                recommendation =
                    "Demand is increasing. Monitor stock and prepare for higher replenishment.";
            }

            insights.push({
                productId,
                productName: product.name,
                sku: product.sku,

                currentStock,
                reservedQuantity,
                availableStock,

                currentDemandLast30Days: currentDemand,
                previousDemand30Days: previousDemand,
                averageDailyDemand: Number(
                    averageDailyDemand.toFixed(2)
                ),

                demandTrend,
                demandChangePercent,

                leadTimeDays,
                stockCoverageDays,
                forecastDemand,
                reorderPoint,
                recommendedQuantity,

                riskLevel,
                priority,
                recommendation,
            });
        }

        // 7. Summary
        const summary = {
            totalProducts: insights.length,
            criticalAlerts: insights.filter(
                item => item.riskLevel === "CRITICAL"
            ).length,
            highRiskAlerts: insights.filter(
                item => item.riskLevel === "HIGH"
            ).length,
            mediumRiskAlerts: insights.filter(
                item => item.riskLevel === "MEDIUM"
            ).length,
            increasingDemandProducts: insights.filter(
                item => item.demandTrend === "INCREASING"
            ).length,
            replenishmentRequired: insights.filter(
                item => item.recommendedQuantity > 0
            ).length,
        };

        return res.status(200).json({
            success: true,
            message: "Inventory intelligence generated successfully",
            summary,
            insights,
        });

    } catch (error) {
        console.error("Inventory Intelligence Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate inventory intelligence",
            error: error.message,
        });
    }
};
