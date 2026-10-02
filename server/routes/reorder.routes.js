import express from "express";

import {
    getReorderRecommendation,
} from "../controllers/reorder.controller.js";

const router = express.Router();

router.get(
    "/product/:productId",
    getReorderRecommendation
);

export default router;