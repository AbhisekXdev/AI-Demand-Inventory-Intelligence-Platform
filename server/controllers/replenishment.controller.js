
import { Op } from "sequelize";
import Product from "../models/Product.js";
import Inventory from "../models/Inventory.js";
import Demand from "../models/Demand.js";

export const getReplenishmentRecommendation = async (req, res) => {
    try {
        const productId = Number(req.params.productId);

        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        // 1. Find product
        const product = await Product.findOne({
            where: {
                id: productId,
                isActive: true,
            },
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // 2. Find inventory
        const inventory = await Inventory.findOne({
            where: {
                productId,
                isActive: true,
            },
        });

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory record not found",
            });
        }

        // 3. Get demand history for the last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 29);

        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");

            return `${year}-${month}-${day}`;
        };

        const demands = await Demand.findAll({
            where: {
                productId,
                demandDate: {
                    [Op.between]: [
                        formatDate(startDate),
                        formatDate(endDate),
                    ],
                },
            },
            attributes: ["quantity"],
        });

        // 4. Calculate demand forecast
        const totalDemand = demands.reduce(
            (total, demand) => total + Number(demand.quantity),
            0
        );

        const averageDailyDemand = totalDemand / 30;

        const leadTimeDays = Number(product.leadTimeDays);
        const forecastDemand = Math.ceil(
            averageDailyDemand * leadTimeDays
        );

        // 5. Calculate available stock
        const currentStock = Number(inventory.quantity);
        const reservedQuantity = Number(inventory.reservedQuantity || 0);

        const availableStock = Math.max(
            0,
            currentStock - reservedQuantity
        );

        const reorderLevel = Number(
            inventory.reorderLevel ?? product.reorderLevel
        );

        // 6. Calculate recommended quantity
        const reorderPoint = forecastDemand + reorderLevel;

        let recommendedQuantity = Math.max(
            0,
            reorderPoint - availableStock
        );

        // Respect maximum stock level when configured
        if (inventory.maxStockLevel !== null) {
            const maximumAdditionalStock = Math.max(
                0,
                Number(inventory.maxStockLevel) - currentStock
            );

            recommendedQuantity = Math.min(
                recommendedQuantity,
                maximumAdditionalStock
            );
        }

        // 7. Determine priority
        let priority = "NORMAL";

        if (availableStock <= 0) {
            priority = "CRITICAL";
        } else if (availableStock <= reorderLevel) {
            priority = "HIGH";
        } else if (availableStock <= reorderPoint) {
            priority = "MEDIUM";
        }

        return res.status(200).json({
            success: true,
            message: "Replenishment recommendation generated",
            replenishment: {
                productId: product.id,
                productName: product.name,
                sku: product.sku,

                totalDemandLast30Days: totalDemand,
                averageDailyDemand: Number(
                    averageDailyDemand.toFixed(2)
                ),

                leadTimeDays,
                forecastDemand,

                currentStock,
                reservedQuantity,
                availableStock,

                reorderLevel,
                reorderPoint,
                recommendedQuantity,

                priority,
                replenishmentRequired: recommendedQuantity > 0,
            },
        });
    } catch (error) {
        console.error("Replenishment Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate replenishment recommendation",
            error: error.message,
        });
    }
};
