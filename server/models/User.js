import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const User = sequelize.define(
    "User",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type:DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM(
                "admin",
                "manager",
                "staff"
            ),
            defaultValue: "staff",
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
        {
            tableName: "users",
            timestamps: true,
        }

    
);
export default User;