import Supplier from "../models/Supplier.js";

//Create supplier 

const createSupplier = async (req, res) => {
    try {
        const { 
            name,
            email,
            phone,
            address,
            contactPerson, 
        } = req.body;

        if(!name){
            return res.status(400).json({
                success: false,
                message:"Supplier name is required",
            });
        }
        if(email){
            const existingSupplier = await Supplier.findOne({
                where: {email},
            });
            if(existingSupplier){
                return res.status(409).json({
                    success: false,
                    message: "Supplier with this email already exists",
                });
            }
        }
        const supplier = await Supplier.create({
            name,email,phone,address,contactPerson,
        });
        return req.status(201).json({
            success: true,
            message: "Supplier created Successfully",
            supplier,
        });

    } catch(error){
        console.error("Create Supplier Error", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Get All Suppliers
const getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.findAll({
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json({
            success: true,
            count: suppliers.length,
            suppliers,
        });
         } catch (error) {
        console.error("Get Suppliers Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
// Get Supplier By ID
const getSupplierById = async (req, res) => {
    try {
        const { id } = req.params;

        const supplier = await Supplier.findByPk(id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found",
            });
        }

        return res.status(200).json({
            success: true,
            supplier,
        });

    } catch (error) {
        console.error("Get Supplier By ID Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

//Supplier Updation 
// Update Supplier
const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            email,
            phone,
            address,
            contactPerson,
            isActive,
        } = req.body;

        // Find supplier first
        const supplier = await Supplier.findByPk(id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: "Supplier not found",
            });
        }

        // Check duplicate email
        if (email && email !== supplier.email) {
            const existingSupplier = await Supplier.findOne({
                where: { email },
            });

            if (existingSupplier) {
                return res.status(409).json({
                    success: false,
                    message: "Supplier with this email already exists",
                });
            }
        }

        // Update supplier
        await supplier.update({
            name: name ?? supplier.name,
            email: email ?? supplier.email,
            phone: phone ?? supplier.phone,
            address: address ?? supplier.address,
            contactPerson: contactPerson ?? supplier.contactPerson,
            isActive: isActive ?? supplier.isActive,
        });

        return res.status(200).json({
            success: true,
            message: "Supplier updated successfully",
            supplier,
        });

    } catch (error) {
        console.error("Update Supplier Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

//and Deactivation
const deleteSupplier = async(req,res) =>{
    try{
        const {id} = req.params;
        const supplier = await Supplier.findByPk(id);

        if(!supplier){
            return res.status(401).json({
                success: false,
                message: "Supplier Not found",
            });
    
        }
        await Supplier.update({
            isActive: false,
        },
        {
            where: {id},
        });
        return res.status(200).json({
            success: true,
            message: "supplier Deactivated",
        });

    } catch(error){
        console.error("Server Error", error);
        return res.status(500).json({
            success: false,
            message: "Internal server Error",

        });

    }
};

export {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,deleteSupplier
};
