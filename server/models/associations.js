import Category from "./Category.js";
import Product from "./Product.js";
import Inventory from "./Inventory.js";

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