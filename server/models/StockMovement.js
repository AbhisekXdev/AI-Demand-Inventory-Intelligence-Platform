import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const StockMovement = sequelize.define(
    "StockMovement",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        type: {
            type: DataTypes.ENUM(
                "STOCK_IN",
                "STOCK_OUT"
            ),
            allowNull: false,
        },

        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        referenceType: {
            type: DataTypes.ENUM(
                "PURCHASE_ORDER",
                "MANUAL",
                "SALE",
                "ADJUSTMENT"
            ),
            allowNull: false,
            defaultValue: "MANUAL",
        },

        referenceId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        previousQuantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        newQuantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: "stock_movements",
        timestamps: true,
    }
);

export default StockMovement;