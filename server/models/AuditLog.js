
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const AuditLog = sequelize.define(
  "AuditLog",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    userName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    userEmail: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    userRole: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    module: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },

    entityId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },

    oldValues: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    newValues: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },

    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("SUCCESS", "FAILED"),
      allowNull: false,
      defaultValue: "SUCCESS",
    },
  },
  {
    tableName: "audit_logs",
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ["userId"] },
      { fields: ["module"] },
      { fields: ["action"] },
      { fields: ["status"] },
      { fields: ["createdAt"] },
    ],
  }
);

export default AuditLog;
