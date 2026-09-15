import bcrypt from "bcryptjs";
import { db } from "../prisma/db.js";

export const createDepartmentAdmin = async (req, res) => {
  try {
    // Only Super Admin can create Department Admin accounts
    if (req.user?.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can create Department Admin accounts",
      });
    }

    const { name, email, password, departmentId } = req.body;

    const normalizedName = String(name ?? "").trim();
    const normalizedEmail = String(email ?? "")
      .trim()
      .toLowerCase();
    const normalizedPassword = String(password ?? "");

    if (
      !normalizedName ||
      !normalizedEmail ||
      !normalizedPassword ||
      !departmentId
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and departmentId are required",
      });
    }

    if (normalizedPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const departments = await db.orm.public.Department.all();

    const department = departments.find(
      (item) => Number(item.id) === Number(departmentId),
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const users = await db.orm.public.User.all();

    const existingUser = users.find(
      (item) =>
        String(item.email ?? "")
          .trim()
          .toLowerCase() === normalizedEmail,
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(normalizedPassword, 10);

    const user = await db.orm.public.User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      role: "ADMIN",
      departmentId: Number(department.id),
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Department Admin created successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        department: {
          id: department.id,
          name: department.name,
          code: department.code,
        },
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("createDepartmentAdmin error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create Department Admin",
      error: error.message,
    });
  }
};
