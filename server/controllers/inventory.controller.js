import Inventory from "../models/Inventory.js";
import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";

const createInventory = async(req,res)=>{
    try{
        const{
            productId,
            quantity,
            reservedQuantity,
            reorderLevel,
            maxStockLevel,
        } = req.body;
        if(!productId){
            return res.status(400).json({
                success: false,
                message: "Product ID is required",
            });
        }
        const product = await Product.findByPk(productId);
        if(!product){
            return res.status(404).json({
                success: false,
                message: "Product Not Found",
            });
        }
        const existingInventory = await Inventory.findOne({
            where: {productId},
        });
        if(existingInventory){
            return res.status(409).json({
                success: false,
                message: "Inventory already exists for this product",
            });
        }

        const inventory = await Inventory.create({
            productId,
            quantity: quantity?? 0,
            reservedQuantity: reservedQuantity?? 0,
            reorderLevel: reorderLevel?? 10,
            maxStockLevel: maxStockLevel?? null,
        });
        return res.status(201).json({
            success: true,
            message: "Inventory Created Successfully",
            inventory,
        });

    } catch(error){
        console.error("Create Inventory Error", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });

    }
};

const getInventory = async(req,res)=>{
    try{
        const inventory = await Inventory.findAll({
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
            order: [["createdAt", "DESC"]],
        });
        return res.status(200).json({
            success: true,
            count: inventory.length,
            inventory,
        });

    } catch(error){
        console.error("Get Inventory Error", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });

    }
}

const getInventoryByProduct= async(req,res)=>{
    try{
        const { productId } = req.params;
        const inventory = await Inventory.findOne({
            where:{productId},
            include: [
                {
                    model: Product,
                    as:"product",
                    attributes: [
                        "id",
                        "name",
                        "sku",
                    ],
                },
            ],
        });
        if(!inventory){
            return res.status(404).json({
                success: false,
                message: "Inventory not found for this product",
            });
        }
        return res.status(200).json({
            success: true,
            inventory,
        });

    } catch(error){
        console.error(
            "Get INventory by Product Error:",error
        );
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

//Update Inv stock 
const updateStock = async (req, res) => {
    try {
        const { productId } = req.params;

        // type and quantity come from request body
        const { type, quantity } = req.body;

        // Validate required fields
        if (!type || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: "Stock type and quantity are required",
            });
        }

        // Validate stock type
        if (!["STOCK_IN", "STOCK_OUT"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Type must be STOCK_IN or STOCK_OUT",
            });
        }

        // Convert quantity to number
        const stockQuantity = Number(quantity);

        if (!Number.isFinite(stockQuantity) || stockQuantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than 0",
            });
        }

        // Find inventory
        const inventory = await Inventory.findOne({
            where: { productId },
        });

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found",
            });
        }

        // Store stock before update
        const previousQuantity = Number(inventory.quantity);

        // STOCK IN
        if (type === "STOCK_IN") {
            inventory.quantity =
                previousQuantity + stockQuantity;

            inventory.lastRestockAt = new Date();
        }

        // STOCK OUT
        if (type === "STOCK_OUT") {
            if (previousQuantity < stockQuantity) {
                return res.status(400).json({
                    success: false,
                    message: "Insufficient stock",
                    availableStock: previousQuantity,
                });
            }

            inventory.quantity =
                previousQuantity - stockQuantity;
        }

        // Save inventory
        await inventory.save();

        // Store stock after update
        const newQuantity = Number(inventory.quantity);

        // Create stock movement history
        const movement = await StockMovement.create({
            productId,
            type,
            quantity: stockQuantity,
            referenceType: "MANUAL",
            referenceId: null,
            previousQuantity,
            newQuantity,
            notes: `Manual ${type} transaction`,
        });

        return res.status(200).json({
            success: true,
            message: `${type} completed successfully`,
            inventory,
            movement,
        });

    } catch (error) {
        console.error("Update Stock Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
//Get Low Stock Inventory 
const getLowStockInventory = async(req,res)=>{
    try{
        const inventory= await  Inventory.findAll({
            include: [
                {
                    model:Product,
                    as: "product",
                    attributes: [
                        "id",
                        "name",
                        "sku",
                    ],
                },
            ],
            order: [["quantity", "ASC"]],
        });
        const lowStock = inventory.filter(
            (item)=> item.quantity <= item.reorderLevel
        );
        return res.status(200).json({
            success: true,
            count: lowStock.length,
            lowStock,
        });

    } catch(error){
        console.error("Get Low Stock Error", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const adjustStock = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity, type, notes } = req.body;

        if (quantity === undefined || !type) {
            return res.status(400).json({
                success: false,
                message: "Quantity and type are required",
            });
        }

        if (!["STOCK_IN", "STOCK_OUT"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Type must be STOCK_IN or STOCK_OUT",
            });
        }

        const adjustmentQuantity = Number(quantity);

        if (!Number.isFinite(adjustmentQuantity) || adjustmentQuantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than 0",
            });
        }

        const inventory = await Inventory.findOne({
            where: { productId },
        });

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found",
            });
        }

        const previousQuantity = Number(inventory.quantity);

        if (
            type === "STOCK_OUT" &&
            previousQuantity < adjustmentQuantity
        ) {
            return res.status(400).json({
                success: false,
                message: "Insufficient stock",
                availableStock: previousQuantity,
            });
        }

        let newQuantity;

        if (type === "STOCK_IN") {
            newQuantity = previousQuantity + adjustmentQuantity;
        } else {
            newQuantity = previousQuantity - adjustmentQuantity;
        }

        inventory.quantity = newQuantity;

        if (type === "STOCK_IN") {
            inventory.lastRestockAt = new Date();
        }

        await inventory.save();

        const movement = await StockMovement.create({
            productId,
            type,
            quantity: adjustmentQuantity,
            referenceType: "ADJUSTMENT",
            referenceId: null,
            previousQuantity,
            newQuantity,
            notes: notes || "Manual stock adjustment",
        });

        return res.status(200).json({
            success: true,
            message: "Stock adjusted successfully",
            inventory,
            movement,
        });

    } catch (error) {
        console.error("Stock Adjustment Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export {
    createInventory,getInventory,getInventoryByProduct,updateStock, getLowStockInventory,adjustStock
};