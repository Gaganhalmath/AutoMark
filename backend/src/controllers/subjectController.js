import { db } from "../prisma/db.js";

export const getSubjects = async (req, res) => {
  try {
    const subjects = await db.orm.public.Subject.all();

    let filteredSubjects = subjects;

    // Department Admin / HOD can only see their department subjects
    if (req.user.role === "ADMIN" || req.user.role === "HOD") {
      if (!req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: "Department is not assigned to this account",
        });
      }

      filteredSubjects = subjects.filter(
        (subject) =>
          Number(subject.departmentId) === Number(req.user.departmentId),
      );
    }

    res.status(200).json({
      success: true,
      data: filteredSubjects,
    });
  } catch (error) {
    console.error("Error fetching subjects:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch subjects",
    });
  }
};

export const createSubject = async (req, res) => {
  try {
    const { name, code, departmentId, credits } = req.body;

    if (!name || !code || !departmentId || !credits) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    let selectedDepartmentId = Number(departmentId);

    // Department Admin / HOD can only create subjects in their department
    if (req.user.role === "ADMIN" || req.user.role === "HOD") {
      if (!req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: "Department is not assigned to this account",
        });
      }

      if (selectedDepartmentId !== Number(req.user.departmentId)) {
        return res.status(403).json({
          success: false,
          message: "You can only create subjects in your department",
        });
      }
    }

    // Check duplicate subject code
    const existingSubjects = await db.orm.public.Subject.all();

    if (
      existingSubjects.some(
        (subject) =>
          String(subject.code).trim().toUpperCase() ===
          String(code).trim().toUpperCase(),
      )
    ) {
      return res.status(409).json({
        success: false,
        message: "Subject code already exists",
      });
    }

    // Check department
    const departments = await db.orm.public.Department.all();

    const department = departments.find(
      (dept) => Number(dept.id) === selectedDepartmentId,
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const subject = await db.orm.public.Subject.create({
      name: String(name).trim(),
      code: String(code).trim().toUpperCase(),
      departmentId: selectedDepartmentId,
      credits: Number(credits),
    });

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: subject,
    });
  } catch (error) {
    console.error("Error creating subject:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create subject",
    });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const subjectId = Number(req.params.id);
    const { name, code, departmentId, credits } = req.body;

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
    }

    const subjects = await db.orm.public.Subject.all();
    const subject = subjects.find((item) => Number(item.id) === subjectId);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Department Admin / HOD can only modify their department subjects
    if (req.user.role === "ADMIN" || req.user.role === "HOD") {
      if (!req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: "Department is not assigned to this account",
        });
      }

      if (Number(subject.departmentId) !== Number(req.user.departmentId)) {
        return res.status(403).json({
          success: false,
          message: "You can only modify subjects in your department",
        });
      }

      if (
        departmentId !== undefined &&
        Number(departmentId) !== Number(req.user.departmentId)
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only assign subjects to your department",
        });
      }
    }

    const updatedSubject = await db.orm.public.Subject.where({
      id: subjectId,
    }).update({
      ...(name !== undefined && {
        name: String(name).trim(),
      }),
      ...(code !== undefined && {
        code: String(code).trim().toUpperCase(),
      }),
      ...(departmentId !== undefined && {
        departmentId: Number(departmentId),
      }),
      ...(credits !== undefined && {
        credits: Number(credits),
      }),
    });

    return res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: updatedSubject,
    });
  } catch (error) {
    console.error("Error updating subject:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update subject",
    });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const subjectId = Number(req.params.id);

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
    }

    const subjects = await db.orm.public.Subject.all();
    const subject = subjects.find((item) => Number(item.id) === subjectId);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Department Admin / HOD can only delete their department subjects
    if (req.user.role === "ADMIN" || req.user.role === "HOD") {
      if (!req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: "Department is not assigned to this account",
        });
      }

      if (Number(subject.departmentId) !== Number(req.user.departmentId)) {
        return res.status(403).json({
          success: false,
          message: "You can only delete subjects in your department",
        });
      }
    }

    await db.orm.public.Subject.where({ id: subjectId }).delete();

    return res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting subject:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete subject",
    });
  }
};
