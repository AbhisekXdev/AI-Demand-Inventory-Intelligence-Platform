
import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const sslCaPath = process.env.DB_SSL_CA_PATH;

if (!sslCaPath) {
  throw new Error("DB_SSL_CA_PATH is not configured");
}

if (!fs.existsSync(sslCaPath)) {
  throw new Error("TiDB CA certificate file not found");
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 4000,
    dialect: "mysql",
    logging: false,

    dialectOptions: {
      ssl: {
        ca: fs.readFileSync(sslCaPath),
        rejectUnauthorized: true,
      },
    },

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

    console.log("TiDB Cloud database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  }
};

export { sequelize, connectDatabase };
