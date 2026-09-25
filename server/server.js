import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
//Database Connection
import { connectDatabase } from "./config/database.js";

//Models
import User from "./models/User.js";
import Product from "./models/Product.js";
import Category from "./models/Category.js";
import Inventory from "./models/Inventory.js";
import "./models/associations.js";
import Supplier from "./models/Supplier.js";


//Routes
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import inventoryRoutes from "./routes/inventory.route.js";
import supplierRoutes from "./routes/supplier.route.js";

dotenv.config();

const app = express();

// Security
app.use(helmet());

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

//  Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/suppliers", supplierRoutes);

// Root
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "AI Demand & Inventory API is running",
    });
});

// Health
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "healthy",
        timestamp: new Date().toISOString(),
    });
});

// 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDatabase();

        await User.sync();
        console.log("User Table Synchronized");
        await Product.sync();
         console.log("Product Table Synchronized");
        await Category.sync();
         console.log("Category Table Synchronized");
        await Inventory.sync();
         console.log("Inventory Table Synchronized");
        await Supplier.sync();
         console.log("Supplier Table Synchronized");

     

        app.listen(PORT, () => {
            console.log(
                `Server is running on http://localhost:${PORT}`
            );
        });

    } catch (error) {
        console.error(
            "Server Startup Failed:",
            error.message
        );

        process.exit(1);
    }
};

startServer();