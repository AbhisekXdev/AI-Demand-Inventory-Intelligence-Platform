
import express from "express";
import {
  createInventory,
  getInventory,
  getInventoryByProduct,
  updateStock,
  getLowStockInventory,
  adjustStock,
} from "../controllers/inventory.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createInventory);
router.get("/", getInventory);
router.get("/product/:productId", getInventoryByProduct);
router.patch("/product/:productId/stock", authMiddleware, updateStock);
router.get("/low-stock", getLowStockInventory);

router.patch(
  "/product/:productId/adjust",
  authMiddleware,
  adjustStock
);

export default router;
