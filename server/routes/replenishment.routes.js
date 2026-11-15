
import express from "express";
import {
    getReplenishmentRecommendation,
} from "../controllers/replenishment.controller.js";

const router = express.Router();

router.get(
    "/product/:productId",
    getReplenishmentRecommendation
);

export default router;
