import { db } from "../prisma/db.js";

export const getClasses = async (req, res) => {
  try {
    const classes = await db.orm.public.Class.all();

    let filteredClasses = classes;

    // Department Admin / HOD can only see their department classes
    if (req.user.role === "ADMIN" || req.user.role === "HOD") {
      if (!req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: "Department is not assigned to this account",
        });
      }

      filteredClasses = classes.filter(
        (item) => Number(item.departmentId) === Number(req.user.departmentId),
      );
    }

    res.status(200).json({
      success: true,
      data: filteredClasses,
    });
  } catch (error) {
    console.error("Error fetching classes:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch classes",
    });
  }
};

export const createClass = async (req, res) => {
  try {
    const {
      subjectId,
      facultyId,
      departmentId,
      semester,
      section,
      academicYear,
    } = req.body;

    if (
      !subjectId ||
      !facultyId ||
      !departmentId ||
      !semester ||
      !section ||
      !academicYear
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const selectedDepartmentId = Number(departmentId);

    // Department Admin / HOD can only create classes in their department
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
          message: "You can only create classes in your department",
        });
      }
    }

    // Check subject
    const subjects = await db.orm.public.Subject.all();

    const subject = subjects.find(
      (item) => Number(item.id) === Number(subjectId),
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Subject must belong to the class department
    if (Number(subject.departmentId) !== selectedDepartmentId) {
      return res.status(400).json({
        success: false,
        message: "Subject does not belong to the selected department",
      });
    }

    // Check faculty
    const faculty = await db.orm.public.Faculty.all();

    const selectedFaculty = faculty.find(
      (item) => Number(item.id) === Number(facultyId),
    );

    if (!selectedFaculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    /*
     * Faculty can belong to any department.
     * Cross-department faculty assignment is intentionally allowed.
     */

    // Check department
    const departments = await db.orm.public.Department.all();

    const department = departments.find(
      (item) => Number(item.id) === selectedDepartmentId,
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Create class
    const newClass = await db.orm.public.Class.create({
      subjectId: Number(subjectId),
      facultyId: Number(facultyId),
      departmentId: selectedDepartmentId,
      semester: Number(semester),
      section: String(section).trim().toUpperCase(),
      academicYear: String(academicYear).trim(),
    });

    // Automatically enroll all existing students
    // who belong to this department, semester, section,
    // and academic year.
    const matchingStudents = await db.orm.public.Student.where({
      departmentId: selectedDepartmentId,
      semester: Number(semester),
      section: String(section).trim().toUpperCase(),
      academicYear: String(academicYear).trim(),
    }).all();

    let enrolledCount = 0;

    for (const student of matchingStudents) {
      const existingEnrollment = await db.orm.public.Enrollment.where({
        studentId: student.id,
        classId: newClass.id,
      }).all();

      if (existingEnrollment.length > 0) {
        continue;
      }

      await db.orm.public.Enrollment.create({
        studentId: student.id,
        classId: newClass.id,
      });

      enrolledCount++;
    }

    console.log(
      `Class enrollment sync: class ${newClass.id} -> ${enrolledCount} student(s) enrolled`,
    );

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: newClass,
    });
  } catch (error) {
    console.error("Error creating class:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create class",
    });
  }
};

export const getFacultyClasses = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const facultyList = await db.orm.public.Faculty.all();

    const faculty = facultyList.find((item) => item.userId === userId);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    const classes = await db.orm.public.Class.all();

    const facultyClasses = classes.filter(
      (item) => item.facultyId === faculty.id,
    );

    const subjects = await db.orm.public.Subject.all();
    const departments = await db.orm.public.Department.all();

    const result = facultyClasses.map((classItem) => {
      const subject = subjects.find((item) => item.id === classItem.subjectId);

      const department = departments.find(
        (item) => item.id === classItem.departmentId,
      );

      return {
        id: classItem.id,
        semester: classItem.semester,
        section: classItem.section,
        academicYear: classItem.academicYear,
        subject: subject
          ? {
              id: subject.id,
              code: subject.code,
              name: subject.name,
              credits: subject.credits,
            }
          : null,
        department: department
          ? {
              id: department.id,
              name: department.name,
              code: department.code,
            }
          : null,
      };
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching faculty classes:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch faculty classes",
    });
  }
};

export const getClassDetails = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const classId = Number(req.params.id);

    if (!Number.isInteger(classId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID",
      });
    }

    const facultyList = await db.orm.public.Faculty.all();

    const faculty = facultyList.find((item) => item.userId === userId);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    const classes = await db.orm.public.Class.all();

    const classItem = classes.find(
      (item) => item.id === classId && item.facultyId === faculty.id,
    );

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: "Class not found or not assigned to this faculty",
      });
    }

    const subjects = await db.orm.public.Subject.all();

    const subject = subjects.find((item) => item.id === classItem.subjectId);

    const departments = await db.orm.public.Department.all();

    const department = departments.find(
      (item) => item.id === classItem.departmentId,
    );

    const enrollments = await db.orm.public.Enrollment.all();

    const classEnrollments = enrollments.filter(
      (item) => item.classId === classItem.id,
    );

    const students = await db.orm.public.Student.all();
    const users = await db.orm.public.User.all();

    const enrolledStudents = classEnrollments.map((enrollment) => {
      const student = students.find((item) => item.id === enrollment.studentId);

      const user = users.find((item) => item.id === student?.userId);

      return {
        enrollmentId: enrollment.id,
        studentId: student?.id ?? null,
        registerNumber: student?.registerNumber ?? null,
        name: user?.name ?? null,
        email: user?.email ?? null,
        semester: student?.semester ?? null,
        section: student?.section ?? null,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        id: classItem.id,
        semester: classItem.semester,
        section: classItem.section,
        academicYear: classItem.academicYear,
        subject: subject
          ? {
              id: subject.id,
              code: subject.code,
              name: subject.name,
              credits: subject.credits,
            }
          : null,
        department: department
          ? {
              id: department.id,
              name: department.name,
              code: department.code,
            }
          : null,
        students: enrolledStudents,
        totalStudents: enrolledStudents.length,
      },
    });
  } catch (error) {
    console.error("Error fetching class details:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch class details",
    });
  }
};
