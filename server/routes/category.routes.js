import express from "express";

import {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} from "../controllers/category.controller.js";

const router = express.Router();

// Create Category
router.post("/", createCategory);

// Get All Categories
router.get("/", getCategories);

// Get Category By ID
router.get("/:id", getCategoryById);

// Update Category
router.put("/:id", updateCategory);

// Delete Category
router.delete("/:id", deleteCategory);

export default router;