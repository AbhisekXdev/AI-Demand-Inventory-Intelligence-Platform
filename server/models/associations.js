import Category from "./Category.js";
import Product from "./Product.js";
import Inventory from "./Inventory.js";
import Supplier from "./Supplier.js";
import PurchaseOrder from "./PurchaseOrder.js";
import PurchaseOrderItem from "./PurchaseOrderItem.js";
import StockMovement from "./StockMovement.js";
import Demand from "./Demand.js";


Category.hasMany(Product, {
    foreignKey: "categoryId",
    as: "products",
});

Product.belongsTo(Category, {
    foreignKey: "categoryId",
    as: "category",
});



Product.hasOne(Inventory, {
    foreignKey: "productId",
    as: "inventory",
});

Inventory.belongsTo(Product, {
    foreignKey: "productId",
    as: "product",
});

Supplier.hasMany(PurchaseOrder,{
    foreignKey:"supplierId",
    as: "supplier",
});

PurchaseOrder.belongsTo(Supplier,{
    foreignKey:"supplierId",
    as:"supplier",
});

PurchaseOrder.hasMany(PurchaseOrderItem,{
    foreignKey:"purchaseOrderId",
    as: "items",
});
PurchaseOrderItem.belongsTo(PurchaseOrder,{
    foreignKey:"purchaseOrderId",
    as: "purchaseOrder",
});
// Product → Purchase Order Items
Product.hasMany(PurchaseOrderItem, {
    foreignKey: "productId",
    as: "purchaseOrderItems",
});

PurchaseOrderItem.belongsTo(Product, {
    foreignKey: "productId",
    as: "product",
});

Product.hasMany(StockMovement, {
    foreignKey: "productId",
    as: "stockMovements",
});

StockMovement.belongsTo(Product, {
    foreignKey: "productId",
    as: "product",
});



Product.hasMany(Demand, {
    foreignKey: "productId",
    as: "demands",
});

Demand.belongsTo(Product, {
    foreignKey: "productId",
    as: "product",
});

Supplier.hasMany(Product, {
    foreignKey: "supplierId",
    as: "products",
});

Product.belongsTo(Supplier, {
    foreignKey: "supplierId",
    as: "supplier",
});