import StockMovement from "../models/StockMovement.js";
import Product from "../models/Product.js";

// Get all stock movements
const getStockMovements = async (req, res) => {
    try {
        const movements = await StockMovement.findAll({
            include: [
                {
                    model: Product,
                    as: "product",
                    attributes: ["id", "name", "sku"],
                },
            ],
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json({
            success: true,
            count: movements.length,
            movements,
        });

    } catch (error) {
        console.error("Get Stock Movements Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// Get stock movements by product
const getProductStockMovements = async (req, res) => {
    try {
        const { productId } = req.params;

        const movements = await StockMovement.findAll({
            where: {
                productId,
            },
            include: [
                {
                    model: Product,
                    as: "product",
                    attributes: ["id", "name", "sku"],
                },
            ],
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json({
            success: true,
            count: movements.length,
            movements,
        });

    } catch (error) {
        console.error(
            "Get Product Stock Movements Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


export {
    getStockMovements,
    getProductStockMovements,
};