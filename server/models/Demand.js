import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Demand = sequelize.define(
    "Demand",
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

        demandDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },

        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        source: {
            type: DataTypes.ENUM(
                "SALE",
                "ORDER",
                "MANUAL",
                "IMPORT"
            ),
            allowNull: false,
            defaultValue: "MANUAL",
        },

        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: "demands",
        timestamps: true,

        indexes: [
            {
                fields: ["productId", "demandDate"],
            },
        ],
    }
);

export default Demand;