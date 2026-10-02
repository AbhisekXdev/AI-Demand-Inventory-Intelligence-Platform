import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Supplier = sequelize.define(
    "Supplier",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isEmail: true,
            },
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        contactPerson: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
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
    },
    {
        tableName: "suppliers",
        timestamps: true,
    }
);
export default Supplier;