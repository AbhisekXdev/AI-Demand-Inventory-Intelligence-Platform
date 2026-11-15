
import express from "express";

import {
    getInventoryInsights,
} from "../controllers/intelligence.controller.js";

const router = express.Router();

router.get("/insights", getInventoryInsights);

export default router;
