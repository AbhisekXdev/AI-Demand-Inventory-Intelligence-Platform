import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        dialect: "mysql",
        logging: false,

        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    }
);

const connectDatabase = async () => {
    try {
        await sequelize.authenticate();

        console.log("✅ MySQL Database connected successfully");
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        throw error;
    }
};

export { sequelize, connectDatabase };