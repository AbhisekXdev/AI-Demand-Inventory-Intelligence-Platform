import Demand from "../models/Demand.js";
import Product from "../models/Product.js";



// Create Demand


const createDemand = async (req, res) => {
    try {
        const {
            productId,
            demandDate,
            quantity,
            source,
            notes,
        } = req.body;

        // Validate required fields
        if (
            !productId ||
            !demandDate ||
            quantity === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Product ID, demand date and quantity are required",
            });
        }

        // Validate quantity
        const demandQuantity = Number(quantity);

        if (
            !Number.isFinite(demandQuantity) ||
            demandQuantity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than 0",
            });
        }

        // Check product exists
        const product = await Product.findByPk(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Create demand
        const demand = await Demand.create({
            productId,
            demandDate,
            quantity: demandQuantity,
            source: source || "MANUAL",
            notes,
        });

        return res.status(201).json({
            success: true,
            message: "Demand created successfully",
            demand,
        });

    } catch (error) {
        console.error("Create Demand Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// Get All Demands


const getDemands = async (req, res) => {
    try {
        const demands = await Demand.findAll({
            include: [
                {
                    model: Product,
                    as: "product",
                    attributes: [
                        "id",
                        "name",
                        "sku",
                    ],
                },
            ],
            order: [
                ["demandDate", "DESC"],
                ["createdAt", "DESC"],
            ],
        });

        return res.status(200).json({
            success: true,
            count: demands.length,
            demands,
        });

    } catch (error) {
        console.error("Get Demands Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};



// Get Demand By ID


const getDemandById = async (req, res) => {
    try {
        const { id } = req.params;

        const demand = await Demand.findByPk(id, {
            include: [
                {
                    model: Product,
                    as: "product",
                    attributes: [
                        "id",
                        "name",
                        "sku",
                    ],
                },
            ],
        });

        if (!demand) {
            return res.status(404).json({
                success: false,
                message: "Demand not found",
            });
        }

        return res.status(200).json({
            success: true,
            demand,
        });

    } catch (error) {
        console.error("Get Demand By ID Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};



// Get Demand By Product


const getProductDemands = async (req, res) => {
    try {
        const { productId } = req.params;

        // Check product exists
        const product = await Product.findByPk(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const demands = await Demand.findAll({
            where: {
                productId,
            },
            order: [
                ["demandDate", "DESC"],
            ],
        });

        return res.status(200).json({
            success: true,
            product: {
                id: product.id,
                name: product.name,
                sku: product.sku,
            },
            count: demands.length,
            demands,
        });

    } catch (error) {
        console.error(
            "Get Product Demands Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Demand Analytics By Product


const getDemandAnalytics = async (req, res) => {
    try {
        const { productId } = req.params;

        // Check product exists
        const product = await Product.findByPk(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Get all demand records for this product
        const demands = await Demand.findAll({
            where: {
                productId,
            },
            order: [["demandDate", "ASC"]],
        });

        if (demands.length === 0) {
            return res.status(200).json({
                success: true,
                product: {
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                },
                analytics: {
                    totalDemand: 0,
                    averageDailyDemand: 0,
                    averageWeeklyDemand: 0,
                    averageMonthlyDemand: 0,
                    recordCount: 0,
                },
            });
        }

        // Total demand
        const totalDemand = demands.reduce(
            (total, demand) =>
                total + Number(demand.quantity),
            0
        );

        // Find first and last demand dates
        const firstDate = new Date(
            demands[0].demandDate
        );

        const lastDate = new Date(
            demands[demands.length - 1].demandDate
        );

        // Calculate number of days
        const differenceInTime =
            lastDate.getTime() - firstDate.getTime();

        const days =
            Math.floor(
                differenceInTime /
                (1000 * 60 * 60 * 24)
            ) + 1;

        const activeDays = Math.max(days, 1);

        // Average daily demand
        const averageDailyDemand =
            totalDemand / activeDays;

        // Estimated weekly demand
        const averageWeeklyDemand =
            averageDailyDemand * 7;

        // Estimated monthly demand
        const averageMonthlyDemand =
            averageDailyDemand * 30;

        return res.status(200).json({
            success: true,

            product: {
                id: product.id,
                name: product.name,
                sku: product.sku,
            },

            analytics: {
                totalDemand,
                averageDailyDemand:
                    Number(
                        averageDailyDemand.toFixed(2)
                    ),

                averageWeeklyDemand:
                    Number(
                        averageWeeklyDemand.toFixed(2)
                    ),

                averageMonthlyDemand:
                    Number(
                        averageMonthlyDemand.toFixed(2)
                    ),

                recordCount: demands.length,
                activeDays,
                firstDemandDate:
                    demands[0].demandDate,
                lastDemandDate:
                    demands[demands.length - 1].demandDate,
            },
        });

    } catch (error) {
        console.error(
            "Demand Analytics Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// Daily Demand Aggregation


const getDailyDemand = async (req, res) => {
    try {
        const { productId } = req.params;

        // Check product
        const product = await Product.findByPk(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Get all demand records
        const demands = await Demand.findAll({
            where: {
                productId,
            },
            order: [["demandDate", "ASC"]],
        });

        if (demands.length === 0) {
            return res.status(200).json({
                success: true,
                product: {
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                },
                dailyDemand: [],
            });
        }


        // Group demand by date


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


        // Convert object into array


        const dailyDemand = Object.entries(
            dailyDemandMap
        ).map(([date, quantity]) => ({
            date,
            quantity,
        }));

        return res.status(200).json({
            success: true,

            product: {
                id: product.id,
                name: product.name,
                sku: product.sku,
            },

            totalRecords: demands.length,

            totalDays: dailyDemand.length,

            dailyDemand,
        });

    } catch (error) {
        console.error(
            "Daily Demand Aggregation Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export {
    createDemand,
    getDemands,
    getDemandById,
    getProductDemands, getDemandAnalytics, getDailyDemand
};