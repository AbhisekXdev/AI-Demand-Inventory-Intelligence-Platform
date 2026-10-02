import express from "express";

import {
    createDemand,
    getDemands,
    getDemandById,
    getProductDemands,getDemandAnalytics,getDailyDemand
} from "../controllers/demand.controller.js";

const router = express.Router();


// Create demand
router.post("/", createDemand);


// Get all demands
router.get("/", getDemands);


// Get demands for a product
// Keep this BEFORE /:id
router.get("/product/:productId", getProductDemands);

// getDemandAnalytics
router.get(
    "/analytics/product/:productId",
    getDemandAnalytics
);

router.get(
    "/daily/product/:productId",
    getDailyDemand
);

// Get demand by ID
router.get("/:id", getDemandById);





export default router;