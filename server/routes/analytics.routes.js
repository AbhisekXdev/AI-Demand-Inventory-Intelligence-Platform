
import express from "express";
import {
    getInventoryAnalytics,
} from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/inventory", getInventoryAnalytics);

export default router;
