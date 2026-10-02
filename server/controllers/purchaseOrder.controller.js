import PurchaseOrder from "../models/PurchaseOrder.js";
import PurchaseOrderItem from "../models/PurchaseOrderItem.js";
import Supplier from "../models/Supplier.js";
import Product from "../models/Product.js";
import { sequelize } from "../config/database.js";
import Inventory from "../models/Inventory.js";
import StockMovement from "../models/StockMovement.js";

// Create Purchase Order
const createPurchaseOrder = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const {
            supplierId,
            expectedDeliveryDate,
            notes,
            items,
        } = req.body;

        // Validate supplier
        if (!supplierId) {
            await transaction.rollback();

            return res.status(400).json({
                success: false,
                message: "Supplier is required",
            });
        }

        // Validate items
        if (!Array.isArray(items) || items.length === 0) {
            await transaction.rollback();

            return res.status(400).json({
                success: false,
                message: "At least one product is required",
            });
        }

        // Check supplier
        const supplier = await Supplier.findByPk(supplierId, {
            transaction,
        });

        if (!supplier) {
            await transaction.rollback();

            return res.status(404).json({
                success: false,
                message: "Supplier not found",
            });
        }

        if (!supplier.isActive) {
            await transaction.rollback();

            return res.status(400).json({
                success: false,
                message: "Supplier is inactive",
            });
        }

        // Generate PO number
        const poNumber = `PO-${Date.now()}`;

        // Create Purchase Order
        const purchaseOrder = await PurchaseOrder.create(
            {
                poNumber,
                supplierId,
                expectedDeliveryDate,
                notes,
                status: "DRAFT",
                totalAmount: 0,
            },
            { transaction }
        );

        let totalAmount = 0;

        // Create Purchase Order Items
        for (const item of items) {
            const {
                productId,
                quantity,
                unitPrice,
            } = item;

            if (!productId || !quantity || unitPrice === undefined) {
                await transaction.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        "Product, quantity and unit price are required",
                });
            }

            // Check product
            const product = await Product.findByPk(productId, {
                transaction,
            });

            if (!product) {
                await transaction.rollback();

                return res.status(404).json({
                    success: false,
                    message: `Product ${productId} not found`,
                });
            }

            const itemTotal = Number(quantity) * Number(unitPrice);

            totalAmount += itemTotal;

            await PurchaseOrderItem.create(
                {
                    purchaseOrderId: purchaseOrder.id,
                    productId,
                    quantity,
                    receivedQuantity: 0,
                    unitPrice,
                    totalPrice: itemTotal,
                },
                { transaction }
            );
        }

        // Update total amount
        await purchaseOrder.update(
            {
                totalAmount,
            },
            { transaction }
        );

        await transaction.commit();

        return res.status(201).json({
            success: true,
            message: "Purchase order created successfully",
            purchaseOrder: {
                id: purchaseOrder.id,
                poNumber: purchaseOrder.poNumber,
                supplierId: purchaseOrder.supplierId,
                status: purchaseOrder.status,
                totalAmount: purchaseOrder.totalAmount,
            },
        });

    } catch (error) {
        await transaction.rollback();

        console.error(
            "Create Purchase Order Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
//get all purchase order
const getPurchaseOrders = async(req,res)=>{
    try{
        const purchaseOrders = await PurchaseOrder.findAll({
            order: [["createdAt", "DESC"]],
        });
        return res.status(200).json({
            success: true,
            count: purchaseOrders.length,
            purchaseOrders,

        });
    } catch (error) {
        console.error("Get Purchase Orders Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
}
};


// Get Purchase Order By ID
const getPurchaseOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const purchaseOrder = await PurchaseOrder.findByPk(id, {
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
                {
                    model: PurchaseOrderItem,
                    as: "items",
                    include: [
                        {
                            model: Product,
                            as: "product",
                            attributes: [
                                "id",
                                "name",
                                "sku",
                                "costPrice",
                            ],
                        },
                    ],
                },
            ],
        });

        if (!purchaseOrder) {
            return res.status(404).json({
                success: false,
                message: "Purchase order not found",
            });
        }

        return res.status(200).json({
            success: true,
            purchaseOrder,
        });

    } catch (error) {
        console.error("Get Purchase Order Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Receive Purchase Order
const receivePurchaseOrder = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { id } = req.params;
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            await transaction.rollback();

            return res.status(400).json({
                success: false,
                message: "At least one item is required",
            });
        }

        const purchaseOrder = await PurchaseOrder.findByPk(id, {
            include: [
                {
                    model: PurchaseOrderItem,
                    as: "items",
                },
            ],
            transaction,
        });

        if (!purchaseOrder) {
            await transaction.rollback();

            return res.status(404).json({
                success: false,
                message: "Purchase order not found",
            });
        }

        if (
            purchaseOrder.status === "RECEIVED" ||
            purchaseOrder.status === "CANCELLED"
        ) {
            await transaction.rollback();

            return res.status(400).json({
                success: false,
                message: `Purchase order is already ${purchaseOrder.status}`,
            });
        }

        for (const receivedItem of items) {
            const { productId, quantity } = receivedItem;

            if (!productId || !quantity || Number(quantity) <= 0) {
                await transaction.rollback();

                return res.status(400).json({
                    success: false,
                    message: "Product ID and valid quantity are required",
                });
            }

            const orderItem = purchaseOrder.items.find(
                (item) => Number(item.productId) === Number(productId)
            );

            if (!orderItem) {
                await transaction.rollback();

                return res.status(404).json({
                    success: false,
                    message: `Product ${productId} is not part of this purchase order`,
                });
            }

            const remainingQuantity =
                Number(orderItem.quantity) -
                Number(orderItem.receivedQuantity);

            if (Number(quantity) > remainingQuantity) {
                await transaction.rollback();

                return res.status(400).json({
                    success: false,
                    message: `Cannot receive more than remaining quantity for product ${productId}`,
                    remainingQuantity,
                });
            }

            // Update received quantity
            orderItem.receivedQuantity =
                Number(orderItem.receivedQuantity) + Number(quantity);

            await orderItem.save({ transaction });

            // Find inventory
            const inventory = await Inventory.findOne({
                where: { productId },
                transaction,
            });

            if (!inventory) {
                await transaction.rollback();

                return res.status(404).json({
                    success: false,
                    message: `Inventory not found for product ${productId}`,
                });
            }

            // Increase inventory
            // Store stock before update
const previousQuantity = Number(inventory.quantity);

// Increase inventory
inventory.quantity =
    previousQuantity + Number(quantity);

inventory.lastRestockAt = new Date();

await inventory.save({ transaction });

// Create stock movement history
await StockMovement.create(
    {
        productId,
        type: "STOCK_IN",
        quantity: Number(quantity),

        // This movement came from a Purchase Order
        referenceType: "PURCHASE_ORDER",
        referenceId: purchaseOrder.id,

        previousQuantity,
        newQuantity: Number(inventory.quantity),

        notes: `Stock received from Purchase Order ${purchaseOrder.poNumber}`,
    },
    { transaction }
);
        }

        // Check whether everything has been received
        const updatedItems = await PurchaseOrderItem.findAll({
            where: {
                purchaseOrderId: purchaseOrder.id,
            },
            transaction,
        });

        const allReceived = updatedItems.every(
            (item) =>
                Number(item.receivedQuantity) >= Number(item.quantity)
        );

        const partiallyReceived = updatedItems.some(
            (item) => Number(item.receivedQuantity) > 0
        );

        let newStatus = purchaseOrder.status;

        if (allReceived) {
            newStatus = "RECEIVED";
        } else if (partiallyReceived) {
            newStatus = "PARTIALLY_RECEIVED";
        }

        await purchaseOrder.update(
            {
                status: newStatus,
            },
            { transaction }
        );

        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: "Purchase order received successfully",
            status: newStatus,
        });

    } catch (error) {
        await transaction.rollback();

        console.error(
            "Receive Purchase Order Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Cancel Purchase Order
const cancelPurchaseOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const purchaseOrder = await PurchaseOrder.findByPk(id);

        if (!purchaseOrder) {
            return res.status(404).json({
                success: false,
                message: "Purchase order not found",
            });
        }

        if (purchaseOrder.status === "RECEIVED") {
            return res.status(400).json({
                success: false,
                message: "Received purchase order cannot be cancelled",
            });
        }

        if (purchaseOrder.status === "CANCELLED") {
            return res.status(400).json({
                success: false,
                message: "Purchase order is already cancelled",
            });
        }

        await purchaseOrder.update({
            status: "CANCELLED",
        });

        return res.status(200).json({
            success: true,
            message: "Purchase order cancelled successfully",
            purchaseOrder,
        });

    } catch (error) {
        console.error("Cancel Purchase Order Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};



export {
    createPurchaseOrder,getPurchaseOrders,getPurchaseOrderById,receivePurchaseOrder,cancelPurchaseOrder
};