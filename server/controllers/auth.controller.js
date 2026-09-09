import bcrypt from "bcryptjs";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

//Register User Controller
const registerUser = async(req,res)=>{
    try{
        const{name,email,password} = req.body;
        if(!name || !email || !password){
            return res.status(400).json({
                success: false,
                message: "Name email and password are required",
            });
        }
        const existingUser = await User.findOne({
            where: {email},
        });
        if(existingUser){
            return res.status(409).json({
                success: false,
                message: "User with this email already exists",
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,email,
            password: hashedPassword,
        });
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

    } catch(error){
        console.error("Register Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// Login User Controller

const loginUser = async (req, res) => {
    try {
        console.log("========== LOGIN START ==========");

        const { email, password } = req.body;

        console.log("Email:", email);
        console.log("Password received:", !!password);

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and Password are required",
            });
        }

        // Find user
        const user = await User.findOne({
            where: { email },
        });

        console.log("User found:", !!user);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid Email or Password",
            });
        }

        console.log("User ID:", user.id);
        console.log("User role:", user.role);
        console.log("Account active:", user.isActive);
        console.log("Password hash exists:", !!user.password);

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your Account is Inactive",
            });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        console.log("Password valid:", isPasswordValid);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid Email or Password",
            });
        }

        // Check JWT secret
        console.log("JWT secret exists:", !!process.env.JWT_SECRET);

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing");
        }

        // Generate JWT
        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "7d",
            }
        );

        console.log("JWT generated successfully");

        return res.status(200).json({
            success: true,
            message: "Login Successfully",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
export {
     registerUser, loginUser
    };


