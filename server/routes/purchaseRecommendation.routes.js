import express from "express";

import {
    getPurchaseRecommendation,
} from "../controllers/purchaseRecommendation.controller.js";

const router = express.Router();

router.get(
    "/product/:productId",
    getPurchaseRecommendation
);

export default router;