
import express from "express";
import {
    getDashboardSummary,
} from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/summary", getDashboardSummary);

export default router;
