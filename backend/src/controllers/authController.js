import bcrypt from "bcryptjs";
import { db } from "../prisma/db.js";
import { generateToken } from "../utils/jwt.js";

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier and password are required",
      });
    }

    const normalizedIdentifier = String(identifier).trim().toLowerCase();

    const users = await db.orm.public.User.all();
    const students = await db.orm.public.Student.all();
    const faculties = await db.orm.public.Faculty.all();

    let user = users.find(
      (item) => String(item.email || "").toLowerCase() === normalizedIdentifier,
    );

    // Student login using USN / register number
    if (!user) {
      const student = students.find(
        (item) =>
          String(item.registerNumber || "").toLowerCase() ===
          normalizedIdentifier,
      );

      if (student) {
        user = users.find((item) => item.id === student.userId);
      }
    }

    // Faculty login using Faculty ID / employee ID
    if (!user) {
      const faculty = faculties.find(
        (item) =>
          String(item.employeeId || "").toLowerCase() === normalizedIdentifier,
      );

      if (faculty) {
        user = users.find((item) => item.id === faculty.userId);
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid identifier or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid identifier or password",
      });
    }

    // Department comes directly from the database.
    // Super Admin has no department restriction.
    const departmentId =
      user.role === "SUPER_ADMIN" ? null : (user.departmentId ?? null);

    const token = generateToken(user, departmentId);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          departmentId,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const users = await db.orm.public.User.all();

    const user = users.find((item) => item.id === Number(req.user.id));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const departmentId =
      user.role === "SUPER_ADMIN" ? null : (user.departmentId ?? null);

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        departmentId,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch current user",
    });
  }
};
