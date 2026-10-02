import Product from "../models/Product.js";
import Inventory from "../models/Inventory.js";
import Demand from "../models/Demand.js";


// ==========================================
// Get Reorder Recommendation
// ==========================================

const getReorderRecommendation = async (req, res) => {
    try {
        const { productId } = req.params;

        // Find product
        const product = await Product.findByPk(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Find inventory
        const inventory = await Inventory.findOne({
            where: {
                productId,
            },
        });

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found",
            });
        }

        // Get demand history
        const demands = await Demand.findAll({
            where: {
                productId,
            },
            order: [["demandDate", "ASC"]],
        });

        if (demands.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Not enough demand history",
                recommendation: {
                    shouldReorder: false,
                    reason: "No demand history available",
                },
            });
        }

        // ------------------------------------------
        // Calculate average daily demand
        // ------------------------------------------

        const totalDemand = demands.reduce(
            (total, demand) =>
                total + Number(demand.quantity),
            0
        );

        const firstDate = new Date(
            demands[0].demandDate
        );

        const lastDate = new Date(
            demands[demands.length - 1].demandDate
        );

        const differenceInTime =
            lastDate.getTime() -
            firstDate.getTime();

        const historicalDays =
            Math.floor(
                differenceInTime /
                    (1000 * 60 * 60 * 24)
            ) + 1;

        const activeDays = Math.max(
            historicalDays,
            1
        );

        const averageDailyDemand =
            totalDemand / activeDays;

        // ------------------------------------------
        // Lead time
        // ------------------------------------------

        const leadTimeDays =
            Number(product.leadTimeDays) || 7;

        // ------------------------------------------
        // Safety stock
        // ------------------------------------------

        // Simple baseline safety stock:
        // 20% of lead-time demand
        const leadTimeDemand =
            averageDailyDemand *
            leadTimeDays;

        const safetyStock =
            leadTimeDemand * 0.20;

        // ------------------------------------------
        // Reorder Point
        // ------------------------------------------

        const reorderPoint =
            leadTimeDemand +
            safetyStock;

        const currentStock =
            Number(inventory.quantity);

        // ------------------------------------------
        // Reorder decision
        // ------------------------------------------

        const shouldReorder =
            currentStock <= reorderPoint;

        // ------------------------------------------
        // Suggested order quantity
        // ------------------------------------------

        const targetStock =
            reorderPoint +
            averageDailyDemand * 7;

        const suggestedOrderQuantity =
            shouldReorder
                ? Math.ceil(
                      targetStock -
                      currentStock
                  )
                : 0;

        return res.status(200).json({
            success: true,

            product: {
                id: product.id,
                name: product.name,
                sku: product.sku,
            },

            inventory: {
                currentStock,
            },

            demand: {
                totalHistoricalDemand:
                    totalDemand,

                averageDailyDemand:
                    Number(
                        averageDailyDemand.toFixed(2)
                    ),
            },

            reorder: {
                leadTimeDays,

                leadTimeDemand:
                    Number(
                        leadTimeDemand.toFixed(2)
                    ),

                safetyStock:
                    Number(
                        safetyStock.toFixed(2)
                    ),

                reorderPoint:
                    Number(
                        reorderPoint.toFixed(2)
                    ),

                shouldReorder,

                suggestedOrderQuantity,
            },
        });

    } catch (error) {
        console.error(
            "Reorder Recommendation Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


export {
    getReorderRecommendation,
};