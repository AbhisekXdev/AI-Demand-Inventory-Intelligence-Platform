import express from "express";

import { cancelPurchaseOrder, createPurchaseOrder, getPurchaseOrderById, getPurchaseOrders, receivePurchaseOrder } from "../controllers/purchaseOrder.controller.js";

const router = express.Router();

router.post("/", createPurchaseOrder);
router.get("/", getPurchaseOrders);
router.get("/:id", getPurchaseOrderById);
router.patch("/:id/receive", receivePurchaseOrder);
router.patch("/:id/cancel", cancelPurchaseOrder);

export default router;
