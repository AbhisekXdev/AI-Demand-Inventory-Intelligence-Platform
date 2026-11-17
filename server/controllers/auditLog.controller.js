
import { Op } from "sequelize";
import AuditLog from "../models/AuditLog.js";

// ======================================================
// GET AUDIT LOGS - ADMIN ONLY
// ======================================================

export const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      action,
      module,
      status,
      startDate,
      endDate,
    } = req.query;

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(limit, 10) || 10)
    );

    const offset = (currentPage - 1) * pageSize;

    const where = {};

    // Search by user name, email or description
    if (search.trim()) {
      where[Op.or] = [
        { userName: { [Op.like]: `%${search.trim()}%` } },
        { userEmail: { [Op.like]: `%${search.trim()}%` } },
        { description: { [Op.like]: `%${search.trim()}%` } },
      ];
    }

    // Action filter
    if (action) {
      where.action = action;
    }

    // Module filter
    if (module) {
      where.module = module;
    }

    // Status filter
    if (status) {
      const normalizedStatus = status.toUpperCase();

      if (!["SUCCESS", "FAILED"].includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status filter",
        });
      }

      where.status = normalizedStatus;
    }

    // Date range filter
    if (startDate || endDate) {
      const dateFilter = {};

      if (startDate) {
        const start = new Date(`${startDate}T00:00:00.000Z`);

        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date",
          });
        }

        dateFilter[Op.gte] = start;
      }

      if (endDate) {
        const end = new Date(`${endDate}T00:00:00.000Z`);

        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date",
          });
        }

        // Include the entire end date
        end.setUTCDate(end.getUTCDate() + 1);
        dateFilter[Op.lt] = end;
      }

      if (
        startDate &&
        endDate &&
        new Date(`${startDate}T00:00:00.000Z`) >
          new Date(`${endDate}T00:00:00.000Z`)
      ) {
        return res.status(400).json({
          success: false,
          message: "Start date cannot be after end date",
        });
      }

      where.createdAt = dateFilter;
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: pageSize,
      offset,
    });

    // Summary counts for the currently selected filters
    const [successCount, failedCount] = await Promise.all([
      AuditLog.count({
        where: { ...where, status: "SUCCESS" },
      }),
      AuditLog.count({
        where: { ...where, status: "FAILED" },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Audit logs fetched successfully",

      summary: {
        total: count,
        successful: successCount,
        failed: failedCount,
      },

      pagination: {
        currentPage,
        pageSize,
        totalRecords: count,
        totalPages: Math.ceil(count / pageSize),
        hasNextPage: currentPage * pageSize < count,
        hasPreviousPage: currentPage > 1,
      },

      logs: rows,
    });
  } catch (error) {
    console.error("Get Audit Logs Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch audit logs",
    });
  }
};

// ======================================================
// GET SINGLE AUDIT LOG DETAILS - ADMIN ONLY
// ======================================================

export const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid audit log ID",
      });
    }

    const auditLog = await AuditLog.findByPk(id);

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: "Audit log not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Audit log details fetched successfully",
      log: auditLog,
    });
  } catch (error) {
    console.error("Get Audit Log Details Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch audit log details",
    });
  }
};
