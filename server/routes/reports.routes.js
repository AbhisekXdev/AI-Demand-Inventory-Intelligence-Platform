
import express from "express";

import {
    exportInventoryReport,
    exportPurchaseOrderReport,
} from "../controllers/reports.controller.js";

const router = express.Router();

router.get("/inventory/export", exportInventoryReport);

router.get("/purchase-orders/export", exportPurchaseOrderReport);

export default router;
