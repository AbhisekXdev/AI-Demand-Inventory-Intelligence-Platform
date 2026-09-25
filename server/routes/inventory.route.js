import express from "express";
import { createInventory,getInventory, getInventoryByProduct,updateStock,getLowStockInventory } from "../controllers/inventory.controller.js";
const router = express.Router();

router.post("/",createInventory);
router.get("/",getInventory);
router.get("/product/:productId", getInventoryByProduct);
router.patch("/product/:productId/stock", updateStock);
router.get("/low-stock", getLowStockInventory);

export default router;
