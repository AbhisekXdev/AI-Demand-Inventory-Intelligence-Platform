import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Product = sequelize.define(
    "Product",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },

        sku: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },

        costPrice: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },

        reorderLevel: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 10,
        },

        leadTimeDays: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 7,
        },

        supplierId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "suppliers",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
        },

        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        tableName: "products",
        timestamps: true,
    }
);

export default Product;