import Inventory from "../models/Inventory.js";
import Product from "../models/Product.js";

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
const updateStock = async(req,res)=>{
    try{
        const {productId}= req.params;
        const {type,quantity}= req.body;

        if(!type|| !quantity){
            return res.status(400).json({
                success: false,
                message: "Stock type and quantity are required",
            });
        }
        if(!["STOCK_IN", "STOCK_OUT"].includes(type)){
            return res.status(400).json({
                success: false,
                message: "Type must be Stock_IN or STOCK_Out",
            });
        }
        if(quantity <=0){
            return res.status(400).json({
                success: false,
                message: "quantity must be greater than 0",
            });
        }
        const inventory = await Inventory.findOne({
            where: { productId},
        });
        if(!inventory){
            return res.status(404).json({
                success: false,
                message: "Inventory not found",
            });
        }
        if(type === "STOCK_IN"){
            inventory.quantity += Number(quantity);
            inventory.lastRestockAt= new Date();
        }
        if(type === "STOCK_OUT"){
            if(inventory.quantity< Number(quantity)){
                return res.status(400).json({
                    success: false,
                    message: "INsufficient stock",
                    availableStock: inventory.quantity,
                });
            }
            inventory.quantity-= Number(quantity);
        }
        await inventory.save();
        return res.status(200).json({
            success: true,
            message: `${type} completed successfully`,
            inventory,
        });

    } catch(error){
        console.error("Updated Stock Error", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}
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

export {
    createInventory,getInventory,getInventoryByProduct,updateStock, getLowStockInventory
};