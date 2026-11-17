
import express from "express";

import {
  getAuditLogs,
  getAuditLogById,
} from "../controllers/auditLog.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import requireAdmin from "../middleware/role.middleware.js";

const router = express.Router();

// All audit log endpoints require Admin authentication
router.use(authMiddleware, requireAdmin);

// Get all audit logs with filters and pagination
router.get("/", getAuditLogs);

// Get individual audit log details
router.get("/:id", getAuditLogById);

export default router;
