import Product from "../models/Product.js";

const createProduct = async (req, res) => {
  try {
    const { name, sku, description, price, costPrice, reorderLevel } = req.body;
    if (!name || !sku || price === undefined || costPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, SKu price and cost price are required",
      });
    }
    const existingProduct = await Product.findOne({
      where: { sku },
    });
    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "Product already with SKU exists",
      });
    }
    const product = await Product.create({
      name,
      sku,
      description,
      price,
      costPrice,
      reorderLevel,
    });
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Product Creation Error", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
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
const getProductById = async(req,res)=>{
    try{
        const {id} = req.params;
        const product = await Product.findByPk(id);
        if(!product){
            return res.status(404).json({
                success: false,
                message:"Product Not Found",
            });
        }
        return res.status(200).json({
            message: true,
            product,
        });
    } catch(error){
        console.error("Get Product Error", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

//Update Product
const updateProduct = async(req,res)=>{
    try{
        const{id} = req.params;
        const{
            name,sku,description,price,costPrice,reorderLevel,isActive,
        } = req.body;
        const product = await Product.findByPk(id);

        if(!product){
            return res.status(404).json({
                success: false,
                message:"Product Not Found",
            });
        }

        if(sku && sku !== product.sku){
            const existingProduct = await Product.findOne({
                where: {sku},
            });

            if(existingProduct){
                return res.status(409).json({
                    success: false,
                    message: "Product with this SKU Already Exists",
                });
            }
        }
        await product.update({
            name: name?? product.name,
            sku: sku?? product.sku,
            description: description?? product.description,
            price: price?? product.price,
            costPrice: costPrice?? product.costPrice,
            reorderLevel: reorderLevel?? product.reorderLevel,
            isActive: isActive?? product.isActive,
        });
        res.status(201).json({
            success: true,
            message: "Product Updated Successfully",
            product,
        });
   } catch(error){
    console.error("Product Updation Error:", error);

    res.status(501).json({
        success: false,
        message: "Internal Server Error 404",
    });
   }
};

//Delete Product
const deleteProduct = async(req,res)=>{
    try{
        const {id} = req.params;
        const product = await Product.findByPk(id);
        if(!product){
            return res.status(404).json({
                success: false,
                message:"Product Not Found",
            });
        }
        await product.update({
            isActive: false,
        });

        return res.status(200).json({
            success: true,
            message:"Product deleted successfully",
        });
    } catch(error){
        console.error("Delete Product Error",error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


export { createProduct, getAllProducts, getProductById, updateProduct ,deleteProduct };
