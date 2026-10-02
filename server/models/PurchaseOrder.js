import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const PurchaseOrder  = sequelize.define(
    "PurchaseOrder" ,
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,

        },
        poNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        supplierId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        orderDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        expectedDeliveryDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM(
                "DRAFT",
                "ORDERED",
                "PARTIALLY_RECEIVED",
                "RECEIVED",
                "CANCELLED",
            ),
            allowNull: false,
            defaultValue: "DRAFT",
        },
        totalAmount: {
            type: DataTypes.DECIMAL(12,2),
            allowNull: false,
            defaultValue: 0,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

    },
    {
        tableName: "purchase_orders",
        timestamps: true,

    }
);
export default PurchaseOrder;