import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const PurchaseOrderItem = sequelize.define(
    "PurchaseOrderItem",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        purchaseOrderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        receivedQuantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },

        unitPrice: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },

        totalPrice: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
    },
    {
        tableName: "purchase_order_items",
        timestamps: true,
    }
);

export default PurchaseOrderItem;