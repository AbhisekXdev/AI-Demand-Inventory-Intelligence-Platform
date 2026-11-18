import Product from "../models/Product.js";
import { writeAuditLog } from "../services/auditLog.service.js";


const createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      description,
      price,
      costPrice,
      reorderLevel,
      leadTimeDays,
      supplierId,
      categoryId,
      isActive,
    } = req.body;

    if (
      !name ||
      !sku ||
      price === undefined ||
      costPrice === undefined ||
      categoryId === undefined ||
      categoryId === null ||
      categoryId === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, SKU, price, cost price and category are required",
      });
    }

    // Check whether SKU already exists
    const existingProduct = await Product.findOne({
      where: { sku },
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "Product already exists with this SKU",
      });
    }

    // Create product
    const product = await Product.create({
      name,
      sku,
      description,
      price,
      costPrice,
      reorderLevel,
      leadTimeDays,
      supplierId,
      categoryId,
      isActive: isActive ?? true,
    });

    await writeAuditLog({
      req,
      action: "CREATE",
      module: "PRODUCTS",
      entityId: product.id,
      description: `Product "${product.name}" created`,
      newValues: {
        name: product.name,
        sku: product.sku,
        description: product.description,
        price: product.price,
        costPrice: product.costPrice,
        reorderLevel: product.reorderLevel,
        isActive: product.isActive,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });

  } catch (error) {
    console.error("Product Creation Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};


//Get All product 
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      order: [["createdAt", "DESC"]],
    });
    return res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get Products Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

//Get Product By ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product Not Found",
      });
    }
    return res.status(200).json({
      message: true,
      product,
    });
  } catch (error) {
    console.error("Get Product Error", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

//Update Product

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      sku,
      description,
      price,
      costPrice,
      reorderLevel,
      isActive,
    } = req.body;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product Not Found",
      });
    }

    if (sku && sku !== product.sku) {
      const existingProduct = await Product.findOne({
        where: { sku },
      });

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: "Product with this SKU Already Exists",
        });
      }
    }

    // Capture previous values before updating
    const oldValues = {
      name: product.name,
      sku: product.sku,
      description: product.description,
      price: product.price,
      costPrice: product.costPrice,
      reorderLevel: product.reorderLevel,
      isActive: product.isActive,
    };
    await writeAuditLog({
      req,
      action: "UPDATE",
      module: "PRODUCTS",
      entityId: product.id,
      description: `Product "${product.name}" updated`,
      oldValues,
      newValues: {
        name: product.name,
        sku: product.sku,
        description: product.description,
        price: product.price,
        costPrice: product.costPrice,
        reorderLevel: product.reorderLevel,
        isActive: product.isActive,
      },
    });

    await product.update({
      name: name ?? product.name,
      sku: sku ?? product.sku,
      description: description ?? product.description,
      price: price ?? product.price,
      costPrice: costPrice ?? product.costPrice,
      reorderLevel: reorderLevel ?? product.reorderLevel,
      isActive: isActive ?? product.isActive,
    });

    // Capture updated values
    const newValues = {
      name: product.name,
      sku: product.sku,
      description: product.description,
      price: product.price,
      costPrice: product.costPrice,
      reorderLevel: product.reorderLevel,
      isActive: product.isActive,
    };

    // Save audit record
    await writeAuditLog({
      req,
      action: "UPDATE",
      module: "PRODUCTS",
      entityId: product.id,
      description: `Product "${product.name}" updated`,
      oldValues,
      newValues,
    });

    return res.status(200).json({
      success: true,
      message: "Product Updated Successfully",
      product,
    });

  } catch (error) {
    console.error("Product Updation Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


//Delete Product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product Not Found",
      });
    }
    await product.update({
      isActive: false,
    });
    await writeAuditLog({
  req,
  action: "DELETE",
  module: "PRODUCTS",
  entityId: product.id,
  description: `Product "${product.name}" deactivated`,
  oldValues: { isActive: true },
  newValues: { isActive: false },
});

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete Product Error", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


export { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct };
