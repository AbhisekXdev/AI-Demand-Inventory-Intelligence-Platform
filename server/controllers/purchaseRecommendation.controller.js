import Product from "../models/Product.js";
import Inventory from "../models/Inventory.js";
import Supplier from "../models/Supplier.js";
import Demand from "../models/Demand.js";

const getPurchaseRecommendation = async (req, res) => {
    try {
        const { productId } = req.params;

        // ==========================================
        // Product + Supplier
        // ==========================================

        const product = await Product.findByPk(productId, {
            include: [
                {
                    model: Supplier,
                    as: "supplier",
                    attributes: [
                        "id",
                        "name",
                        "email",
                        "phone",
                        "contactPerson",
                    ],
                },
            ],
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // ==========================================
        // Inventory
        // ==========================================

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

        // ==========================================
        // Demand History
        // ==========================================

        const demands = await Demand.findAll({
            where: {
                productId,
            },
            order: [["demandDate", "ASC"]],
        });

        if (demands.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Demand history is required for purchase recommendation",
            });
        }

        // ==========================================
        // Aggregate demand by date
        // ==========================================

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
            Object.values(dailyDemandMap).map(
                Number
            );

        // ==========================================
        // Average Daily Demand
        // ==========================================

        const averageDailyDemand =
            dailyValues.reduce(
                (sum, value) => sum + value,
                0
            ) / dailyValues.length;

        // ==========================================
        // Product Parameters
        // ==========================================

        const currentStock =
            Number(inventory.quantity) || 0;

        const leadTimeDays =
            Number(product.leadTimeDays) || 7;

        const reorderLevel =
            Number(product.reorderLevel) || 10;

        // ==========================================
        // Lead Time Demand
        // ==========================================

        const leadTimeDemand =
            averageDailyDemand *
            leadTimeDays;

        // ==========================================
        // Reorder Point
        //
        // Existing product schema uses
        // reorderLevel instead of safetyStock.
        // ==========================================

        const reorderPoint =
            leadTimeDemand +
            reorderLevel;

        // ==========================================
        // Recommended Purchase Quantity
        // ==========================================

        const recommendedQuantity = Math.max(
            0,
            Math.ceil(
                reorderPoint -
                    currentStock
            )
        );

        const purchaseRequired =
            currentStock <= reorderPoint;

        // ==========================================
        // Priority
        // ==========================================

        let priority = "NORMAL";

        if (currentStock <= 0) {
            priority = "CRITICAL";
        } else if (
            currentStock <
            averageDailyDemand * 3
        ) {
            priority = "HIGH";
        } else if (purchaseRequired) {
            priority = "MEDIUM";
        }

        // ==========================================
        // Supplier Validation
        // ==========================================

        if (
            purchaseRequired &&
            !product.supplier
        ) {
            return res.status(200).json({
                success: true,

                recommendation: {
                    productId: product.id,
                    productName: product.name,
                    sku: product.sku,

                    currentStock,

                    averageDailyDemand:
                        Number(
                            averageDailyDemand.toFixed(
                                2
                            )
                        ),

                    leadTimeDays,

                    reorderLevel,

                    leadTimeDemand:
                        Number(
                            leadTimeDemand.toFixed(
                                2
                            )
                        ),

                    reorderPoint:
                        Number(
                            reorderPoint.toFixed(
                                2
                            )
                        ),

                    recommendedQuantity,

                    purchaseRequired,

                    priority,

                    supplier: null,

                    message:
                        "Purchase is required but no supplier is assigned to this product",
                },
            });
        }

        // ==========================================
        // Final Response
        // ==========================================

        return res.status(200).json({
            success: true,

            recommendation: {
                productId: product.id,
                productName: product.name,
                sku: product.sku,

                currentStock,

                averageDailyDemand:
                    Number(
                        averageDailyDemand.toFixed(
                            2
                        )
                    ),

                leadTimeDays,

                reorderLevel,

                leadTimeDemand:
                    Number(
                        leadTimeDemand.toFixed(
                            2
                        )
                    ),

                reorderPoint:
                    Number(
                        reorderPoint.toFixed(
                            2
                        )
                    ),

                recommendedQuantity,

                purchaseRequired,

                priority,

                supplier: product.supplier
                    ? {
                          id:
                              product.supplier.id,
                          name:
                              product.supplier.name,
                          email:
                              product.supplier.email,
                          phone:
                              product.supplier.phone,
                          contactPerson:
                              product.supplier
                                  .contactPerson,
                      }
                    : null,
            },
        });
    } catch (error) {
        console.error(
            "Purchase Recommendation Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export {
    getPurchaseRecommendation,
};