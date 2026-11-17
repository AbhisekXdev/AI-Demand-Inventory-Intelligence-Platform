
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { writeAuditLog } from "../services/auditLog.service.js";

// ======================================================
// REGISTER USER
// ======================================================

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
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
  } catch (error) {
    console.error("Register Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ======================================================
// TOGGLE EMPLOYEE STATUS
// ======================================================

const toggleEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await User.findOne({
      where: {
        id,
        role: { [Op.in]: ["manager", "staff"] },
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Check active employee limit before reactivation
    if (!employee.isActive) {
      const activeCount = await User.count({
        where: {
          role: { [Op.in]: ["manager", "staff"] },
          isActive: true,
        },
      });

      if (activeCount >= 50) {
        return res.status(403).json({
          success: false,
          message: "Maximum limit of 50 active employees reached",
        });
      }
    }

    const previousStatus = employee.isActive;

    // Fetch the admin performing the action
    const actor = await User.findByPk(req.user.id, {
      attributes: ["id", "name", "email", "role"],
    });

    employee.isActive = !employee.isActive;
    await employee.save();

    await writeAuditLog({
      req,
      user: actor,
      action: employee.isActive
        ? "EMPLOYEE_ACTIVATED"
        : "EMPLOYEE_DEACTIVATED",
      module: "EMPLOYEES",
      entityId: employee.id,
      description: `${employee.name} was ${
        employee.isActive ? "activated" : "deactivated"
      }`,
      oldValues: {
        isActive: previousStatus,
      },
      newValues: {
        isActive: employee.isActive,
      },
    });

    return res.status(200).json({
      success: true,
      message: employee.isActive
        ? "Employee activated successfully"
        : "Employee deactivated successfully",
      isActive: employee.isActive,
    });
  } catch (error) {
    console.error("Toggle Employee Status Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update employee status",
    });
  }
};

// ======================================================
// LOGIN USER WITH AUDIT LOGGING
// ======================================================

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      where: { email: normalizedEmail },
    });

    // User not found
    if (!user) {
      await writeAuditLog({
        req,
        user: { email: normalizedEmail },
        action: "LOGIN_FAILED",
        module: "AUTHENTICATION",
        description: "Login failed: Invalid email or password",
        status: "FAILED",
      });

      return res.status(401).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }

    // Inactive account
    if (!user.isActive) {
      await writeAuditLog({
        req,
        user,
        action: "LOGIN_FAILED",
        module: "AUTHENTICATION",
        description: "Login attempted on an inactive account",
        status: "FAILED",
      });

      return res.status(403).json({
        success: false,
        message: "Your Account is Inactive",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      await writeAuditLog({
        req,
        user,
        action: "LOGIN_FAILED",
        module: "AUTHENTICATION",
        description: "Login failed: Invalid email or password",
        status: "FAILED",
      });

      return res.status(401).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }

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

    // Successful login audit
    await writeAuditLog({
      req,
      user,
      action: "LOGIN",
      module: "AUTHENTICATION",
      description: `${user.name} logged in successfully`,
      status: "SUCCESS",
    });

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
    console.error("LOGIN ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ======================================================
// CREATE EMPLOYEE
// ======================================================

const createEmployee = async (req, res) => {
  let transaction;

  try {
    transaction = await User.sequelize.transaction();

    const {
      employeeCode,
      name,
      email,
      password,
      role,
      phone,
      address,
      city,
      state,
      pincode,
      dateOfBirth,
      emergencyContact,
      joiningDate,
      designation,
      department,
      salary,
    } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (!["manager", "staff"].includes(role)) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Role must be manager or staff",
      });
    }

    if (password.length < 8) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const admin = await User.findByPk(req.user.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!admin || admin.role !== "admin" || !admin.isActive) {
      await transaction.rollback();

      return res.status(403).json({
        success: false,
        message: "Active admin access required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = employeeCode?.trim() || null;

    const existingEmail = await User.findOne({
      where: { email: normalizedEmail },
      transaction,
    });

    if (existingEmail) {
      await transaction.rollback();

      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    if (normalizedCode) {
      const existingCode = await User.findOne({
        where: { employeeCode: normalizedCode },
        transaction,
      });

      if (existingCode) {
        await transaction.rollback();

        return res.status(409).json({
          success: false,
          message: "Employee code already exists",
        });
      }
    }

    const activeCount = await User.count({
      where: {
        role: { [Op.in]: ["manager", "staff"] },
        isActive: true,
      },
      transaction,
    });

    if (activeCount >= 50) {
      await transaction.rollback();

      return res.status(403).json({
        success: false,
        message: "Maximum limit of 50 active employees reached",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await User.create(
      {
        employeeCode: normalizedCode,
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        dateOfBirth: dateOfBirth || null,
        emergencyContact: emergencyContact || null,
        joiningDate: joiningDate || null,
        designation: designation || null,
        department: department || null,
        salary: salary === "" || salary == null ? null : salary,
        isActive: true,
      },
      { transaction }
    );

    await transaction.commit();

    await writeAuditLog({
      req,
      user: admin,
      action: "EMPLOYEE_CREATED",
      module: "EMPLOYEES",
      entityId: employee.id,
      description: `Created employee: ${employee.name}`,
      newValues: {
        employeeCode: employee.employeeCode,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        designation: employee.designation,
        department: employee.department,
        isActive: employee.isActive,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee: {
        id: employee.id,
        employeeCode: employee.employeeCode,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        isActive: employee.isActive,
      },
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    console.error("Create Employee Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create employee",
    });
  }
};

// ======================================================
// GET MY PROFILE
// ======================================================

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        "id",
        "employeeCode",
        "name",
        "email",
        "role",
        "phone",
        "address",
        "city",
        "state",
        "pincode",
        "dateOfBirth",
        "emergencyContact",
        "joiningDate",
        "designation",
        "department",
        "salary",
        "isActive",
        "createdAt",
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get Profile Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch profile",
    });
  }
};

// ======================================================
// UPDATE MY PROFILE WITH AUDIT LOGGING
// ======================================================

const updateMyProfile = async (req, res) => {
  try {
    // Only Admin can update profile details
    if (String(req.user.role).toLowerCase() !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update profile details",
      });
    }

    const {
      name,
      phone,
      address,
      city,
      state,
      pincode,
      emergencyContact,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Capture old values before updating
    const oldProfileValues = {
      name: user.name,
      phone: user.phone,
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      emergencyContact: user.emergencyContact,
    };

    await user.update({
      name: name.trim(),
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      emergencyContact: emergencyContact || null,
    });

    // Profile audit
    await writeAuditLog({
      req,
      user,
      action: "PROFILE_UPDATED",
      module: "PROFILE",
      entityId: user.id,
      description: `${user.name} updated their profile`,
      oldValues: oldProfileValues,
      newValues: {
        name: user.name,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        emergencyContact: user.emergencyContact,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        emergencyContact: user.emergencyContact,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
};

// ======================================================
// CHANGE PASSWORD WITH AUDIT LOGGING
// ======================================================

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new passwords are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isValid) {
      await writeAuditLog({
        req,
        user,
        action: "PASSWORD_CHANGE_FAILED",
        module: "AUTHENTICATION",
        entityId: user.id,
        description: `${user.name} entered an incorrect current password`,
        status: "FAILED",
      });

      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Never include password or password hash in audit values
    await writeAuditLog({
      req,
      user,
      action: "PASSWORD_CHANGED",
      module: "AUTHENTICATION",
      entityId: user.id,
      description: `${user.name} changed their password`,
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change Password Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to change password",
    });
  }
};

// ======================================================
// UPDATE EMPLOYEE WITH AUDIT LOGGING
// ======================================================

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      employeeCode,
      name,
      email,
      role,
      phone,
      address,
      city,
      state,
      pincode,
      dateOfBirth,
      emergencyContact,
      joiningDate,
      designation,
      department,
      salary,
    } = req.body;

    // Validate required fields
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    if (!["manager", "staff"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be manager or staff",
      });
    }

    const employee = await User.findOne({
      where: {
        id,
        role: { [Op.in]: ["manager", "staff"] },
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = employeeCode?.trim() || null;

    // Check duplicate email
    const existingEmail = await User.findOne({
      where: {
        email: normalizedEmail,
        id: { [Op.ne]: id },
      },
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Check duplicate employee code
    if (normalizedCode) {
      const existingCode = await User.findOne({
        where: {
          employeeCode: normalizedCode,
          id: { [Op.ne]: id },
        },
      });

      if (existingCode) {
        return res.status(409).json({
          success: false,
          message: "Employee code already exists",
        });
      }
    }

    // Capture old values before updating
    const oldEmployeeValues = {
      employeeCode: employee.employeeCode,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      designation: employee.designation,
      department: employee.department,
    };

    await employee.update({
      employeeCode: normalizedCode,
      name: name.trim(),
      email: normalizedEmail,
      role,
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      dateOfBirth: dateOfBirth || null,
      emergencyContact: emergencyContact || null,
      joiningDate: joiningDate || null,
      designation: designation || null,
      department: department || null,
      salary: salary === "" || salary == null ? null : salary,
    });

    // Fetch admin actor details
    const actor = await User.findByPk(req.user.id, {
      attributes: ["id", "name", "email", "role"],
    });

    await writeAuditLog({
      req,
      user: actor,
      action: "EMPLOYEE_UPDATED",
      module: "EMPLOYEES",
      entityId: employee.id,
      description: `Updated employee: ${employee.name}`,
      oldValues: oldEmployeeValues,
      newValues: {
        employeeCode: employee.employeeCode,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        designation: employee.designation,
        department: employee.department,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      employee: {
        id: employee.id,
        employeeCode: employee.employeeCode,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        phone: employee.phone,
        isActive: employee.isActive,
      },
    });
  } catch (error) {
    console.error("Update Employee Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update employee",
    });
  }
};

// ======================================================
// GET EMPLOYEES
// ======================================================

const getEmployees = async (req, res) => {
  try {
    const employees = await User.findAll({
      where: {
        role: ["manager", "staff"],
      },
      attributes: [
        "id",
        "employeeCode",
        "name",
        "email",
        "role",
        "phone",
        "address",
        "city",
        "state",
        "pincode",
        "dateOfBirth",
        "emergencyContact",
        "joiningDate",
        "designation",
        "department",
        "salary",
        "isActive",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
    });

    const activeCount = employees.filter(
      (employee) => employee.isActive
    ).length;

    return res.status(200).json({
      success: true,
      count: employees.length,
      activeCount,
      limit: 50,
      employees,
    });
  } catch (error) {
    console.error("Get Employees Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch employees",
    });
  }
};

// ======================================================
// EXPORT CONTROLLERS
// ======================================================

export {
  registerUser,
  loginUser,
  getMyProfile,
  updateMyProfile,
  changePassword,
  createEmployee,
  getEmployees,
  toggleEmployeeStatus,
  updateEmployee,
};
