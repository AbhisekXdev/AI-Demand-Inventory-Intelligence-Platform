import express from "express";

import {
    getStockMovements,
    getProductStockMovements,
} from "../controllers/stockMovement.controller.js";

const router = express.Router();

// Get all stock movements
router.get("/", getStockMovements);

// Get movements for one product
router.get("/product/:productId", getProductStockMovements);

export default router;