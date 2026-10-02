import express from "express";
import { createInventory,getInventory, getInventoryByProduct,updateStock,getLowStockInventory,adjustStock } from "../controllers/inventory.controller.js";
const router = express.Router();

router.post("/",createInventory);
router.get("/",getInventory);
router.get("/product/:productId", getInventoryByProduct);
router.patch("/product/:productId/stock", updateStock);
router.get("/low-stock", getLowStockInventory);
router.patch(
    "/product/:productId/adjust",
    adjustStock
);

export default router;
