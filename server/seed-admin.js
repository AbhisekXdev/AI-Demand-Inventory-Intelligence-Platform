
import "dotenv/config";
import bcrypt from "bcryptjs";
import { sequelize } from "./config/database.js";
import User from "./models/User.js";

const createAdmin = async () => {
    try {
        const name = process.env.ADMIN_NAME?.trim();
        const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const password = process.env.ADMIN_PASSWORD;

        if (!name || !email || !password) {
            throw new Error(
                "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required."
            );
        }

        if (password.length < 12) {
            throw new Error(
                "Admin password must contain at least 12 characters."
            );
        }

        await sequelize.authenticate();

        const existingUser = await User.findOne({
            where: { email },
        });

        if (existingUser) {
            throw new Error(
                "This email already exists. No account was changed."
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const admin = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "admin",
            isActive: true,
        });

        console.log("Admin account created successfully!");
        console.log("Admin ID:", admin.id);
        console.log("Admin Name:", admin.name);
        console.log("Admin Email:", admin.email);
        console.log("Role:", admin.role);
        console.log("Active:", admin.isActive);

    } catch (error) {
        console.error("Admin Creation Failed:", error.message);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
};

createAdmin();
