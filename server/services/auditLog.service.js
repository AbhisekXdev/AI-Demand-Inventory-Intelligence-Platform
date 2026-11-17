import AuditLog from "../models/AuditLog.js";

const SENSITIVE_KEYS = new Set([
  "password",
  "currentpassword",
  "newpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "secret",
  "apikey",
  "jwtsecret",
]);

const sanitizeValues = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValues);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        return [key, "[REDACTED]"];
      }

      return [key, sanitizeValues(item)];
    })
  );
};

export const writeAuditLog = async ({
  req,
  user = null,
  action,
  module,
  entityId = null,
  description,
  oldValues = null,
  newValues = null,
  status = "SUCCESS",
}) => {
  try {
    const actor = user || req?.user || {};

    await AuditLog.create({
      userId: actor.id || null,
      userName: actor.name || null,
      userEmail: actor.email || null,
      userRole: actor.role || null,

      action,
      module,
      entityId: entityId == null ? null : String(entityId),
      description,

      oldValues: oldValues ? sanitizeValues(oldValues) : null,
      newValues: newValues ? sanitizeValues(newValues) : null,

      ipAddress:
        req?.ip ||
        req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
        null,

      userAgent: req?.get?.("user-agent")?.slice(0, 500) || null,

      status,
    });

    return true;
  } catch (error) {
    // Audit failures should be visible to server operators.
    console.error("AUDIT LOG ERROR:", error.message);
    return false;
  }
};