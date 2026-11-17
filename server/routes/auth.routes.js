
import express from "express";

import {
  loginUser,
  getMyProfile,
  updateMyProfile,
  changePassword,
  createEmployee,
  getEmployees,toggleEmployeeStatus,updateEmployee
} from "../controllers/auth.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import requireAdmin from "../middleware/role.middleware.js";

const router = express.Router();

// Public login
router.post("/login", loginUser);

// Protected profile routes
// Profile routes
// Admin and Employees can view their own profile
router.get("/me", authMiddleware, getMyProfile);

// Only Admin can update profile details
router.patch("/me", authMiddleware, requireAdmin, updateMyProfile);

// Admin and Employees can change their own password
router.patch("/change-password", authMiddleware, changePassword);

// Admin-only employee routes
router.post(
  "/employees",
  authMiddleware,
  requireAdmin,
  createEmployee
);

router.get(
  "/employees",
  authMiddleware,
  requireAdmin,
  getEmployees
);
// Edit employee
router.patch(
  "/employees/:id",
  authMiddleware,
  requireAdmin,
  updateEmployee
);

// Activate / Deactivate employee
router.patch(
  "/employees/:id/status",
  authMiddleware,
  requireAdmin,
  toggleEmployeeStatus
);

export default router;
