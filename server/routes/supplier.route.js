import express from "express";

import { getSuppliers,createSupplier, getSupplierById,updateSupplier,deleteSupplier } from "../controllers/supplier.controller.js";

const router = express.Router();

// Create Supplier
router.post("/", createSupplier);

// Get All Suppliers
router.get("/", getSuppliers);

// Get Supplier By ID
router.get("/:id", getSupplierById);
//Update Supplier
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

export default router;