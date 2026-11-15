
import Product from "../models/Product.js";
import Inventory from "../models/Inventory.js";
import Supplier from "../models/Supplier.js";
import PurchaseOrder from "../models/PurchaseOrder.js";

// Convert data into CSV format
const convertToCSV = (rows, columns) => {
    const escapeCSV = (value) => {
        const text = String(value ?? "");
        return `"${text.replace(/"/g, '""')}"`;
    };

    const header = columns.map(escapeCSV).join(",");

    const data = rows.map(row =>
        columns.map(column => escapeCSV(row[column])).join(",")
    );

    return [header, ...data].join("\n");
};

// Download CSV file
const sendCSV = (res, filename, rows, columns) => {
    const csv = convertToCSV(rows, columns);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
    );

    return res.status(200).send("\uFEFF" + csv);
};

// 1. Inventory Report
export const exportInventoryReport = async (req, res) => {
    try {
        const [products, inventories] = await Promise.all([
            Product.findAll({
                where: { isActive: true },
            }),
            Inventory.findAll({
                where: { isActive: true },
            }),
        ]);

        const productMap = new Map(
            products.map(product => [
                Number(product.id),
                product,
            ])
        );

        const rows = inventories
            .map(inventory => {
                const product = productMap.get(
                    Number(inventory.productId)
                );

                if (!product) return null;

                const quantity = Number(inventory.quantity || 0);
                const reserved = Number(
                    inventory.reservedQuantity || 0
                );
                const available = Math.max(0, quantity - reserved);
                const reorderLevel = Number(
                    inventory.reorderLevel ?? product.reorderLevel
                );
                const costPrice = Number(product.costPrice || 0);

                let stockStatus = "HEALTHY";

                if (available <= 0) {
                    stockStatus = "OUT_OF_STOCK";
                } else if (available <= reorderLevel) {
                    stockStatus = "LOW_STOCK";
                }

                return {
                    productId: product.id,
                    productName: product.name,
                    sku: product.sku,
                    quantity,
                    reservedQuantity: reserved,
                    availableStock: available,
                    reorderLevel,
                    costPrice,
                    inventoryValue: Number(
                        (quantity * costPrice).toFixed(2)
                    ),
                    stockStatus,
                };
            })
            .filter(Boolean);

        // Optional filter: LOW_STOCK or OUT_OF_STOCK
        const status = req.query.status;

        if (
            status &&
            !["LOW_STOCK", "OUT_OF_STOCK", "HEALTHY"].includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid stock status filter",
            });
        }

        const filteredRows = status
            ? rows.filter(row => row.stockStatus === status)
            : rows;

        const columns = [
            "productId",
            "productName",
            "sku",
            "quantity",
            "reservedQuantity",
            "availableStock",
            "reorderLevel",
            "costPrice",
            "inventoryValue",
            "stockStatus",
        ];

        return sendCSV(
            res,
            "inventory-report.csv",
            filteredRows,
            columns
        );

    } catch (error) {
        console.error("Inventory Report Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to export inventory report",
            error: error.message,
        });
    }
};

// 2. Purchase Order Report
export const exportPurchaseOrderReport = async (req, res) => {
    try {
        const [purchaseOrders, suppliers] = await Promise.all([
            PurchaseOrder.findAll({
                order: [["createdAt", "DESC"]],
            }),
            Supplier.findAll(),
        ]);

        const supplierMap = new Map(
            suppliers.map(supplier => [
                Number(supplier.id),
                supplier.name,
            ])
        );

        const rows = purchaseOrders.map(po => ({
            id: po.id,
            poNumber: po.poNumber,
            supplierName:
                supplierMap.get(Number(po.supplierId)) || "Unknown",
            orderDate: po.orderDate,
            expectedDeliveryDate: po.expectedDeliveryDate,
            status: po.status,
            totalAmount: Number(po.totalAmount || 0),
            notes: po.notes,
        }));

        const columns = [
            "id",
            "poNumber",
            "supplierName",
            "orderDate",
            "expectedDeliveryDate",
            "status",
            "totalAmount",
            "notes",
        ];

        return sendCSV(
            res,
            "purchase-orders-report.csv",
            rows,
            columns
        );

    } catch (error) {
        console.error("Purchase Order Report Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to export purchase order report",
            error: error.message,
        });
    }
};
