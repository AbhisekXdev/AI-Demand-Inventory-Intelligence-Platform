import Category from "../models/Category.js";

// Create Category
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Validate required field
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Category name is required",
            });
        }

        // Check duplicate category
        const existingCategory = await Category.findOne({
            where: { name },
        });

        if (existingCategory) {
            return res.status(409).json({
                success: false,
                message: "Category already exists",
            });
        }

        // Create category
        const category = await Category.create({
            name,
            description,
        });

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            category,
        });

    } catch (error) {
        console.error("Category Creation Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// Get All Categories
const getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json({
            success: true,
            count: categories.length,
            categories,
        });

    } catch (error) {
        console.error("Get Categories Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// Get Category By ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByPk(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        return res.status(200).json({
            success: true,
            category,
        });

    } catch (error) {
        console.error("Get Category By ID Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// Update Category
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;

        const category = await Category.findByPk(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        // Check duplicate name
        if (name && name !== category.name) {
            const existingCategory = await Category.findOne({
                where: { name },
            });

            if (existingCategory) {
                return res.status(409).json({
                    success: false,
                    message: "Category already exists",
                });
            }
        }

        await category.update({
            name: name ?? category.name,
            description: description ?? category.description,
            isActive: isActive ?? category.isActive,
        });

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category,
        });

    } catch (error) {
        console.error("Category Update Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// Delete Category
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByPk(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        // Soft delete
        await category.update({
            isActive: false,
        });

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });

    } catch (error) {
        console.error("Category Delete Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


export {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
};