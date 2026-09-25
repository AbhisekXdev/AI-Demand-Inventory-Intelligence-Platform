import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Inventory = sequelize.define(
    "Inventory",
    {
       id:{
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
       } ,
       productId: {
        type:DataTypes.INTEGER,
        allowNull: false,
        unique: true,
       },
       quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
       },
       reservedQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
       },
       reoderLevel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
       },
       reorderLevel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
       },
       maxStockLevel: {
        type: DataTypes.INTEGER,
        allowNull: true,
       },
       lastRestockedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },

        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        tableName: "inventories",
        timestamps: true,
    }
);
export default Inventory;
