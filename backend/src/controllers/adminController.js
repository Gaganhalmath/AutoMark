import { db } from "../prisma/db.js";
import bcrypt from "bcryptjs";

export const getAdminDashboard = async (req, res) => {
  try {
    const students = await db.orm.public.Student.all();
    const faculty = await db.orm.public.Faculty.all();
    const classes = await db.orm.public.Class.all();
    const sessions = await db.orm.public.AttendanceSession.all();
    const attendance = await db.orm.public.Attendance.all();

    // SUPER_ADMIN can see everything.
    // ADMIN/HOD can see only their department.
    let visibleStudents = students;
    let visibleFaculty = faculty;
    let visibleClasses = classes;
    let visibleSessions = sessions;

    if (req.user.role === "ADMIN" || req.user.role === "HOD") {
      if (!req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: "Admin account is not assigned to a department",
        });
      }

      const departmentId = Number(req.user.departmentId);

      // Department-scoped students
      visibleStudents = students.filter(
        (student) => Number(student.departmentId) === departmentId,
      );

      // Department-scoped faculty
      // Faculty management itself can remain cross-department later,
      // but dashboard faculty count represents faculty belonging to this department.
      visibleFaculty = faculty.filter(
        (member) => Number(member.departmentId) === departmentId,
      );

      // Department-scoped classes
      visibleClasses = classes.filter(
        (classItem) => Number(classItem.departmentId) === departmentId,
      );

      // Sessions belong to classes, so first find this department's class IDs.
      const departmentClassIds = new Set(
        visibleClasses.map((classItem) => Number(classItem.id)),
      );

      visibleSessions = sessions.filter((session) =>
        departmentClassIds.has(Number(session.classId)),
      );
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    const todaySessions = visibleSessions.filter((session) =>
      String(session.sessionDate).startsWith(today),
    );

    const activeSessions = todaySessions.filter(
      (session) => session.endedAt === null,
    );

    // Attendance records belonging to today's sessions
    const todaySessionIds = new Set(
      todaySessions.map((session) => Number(session.id)),
    );

    const todayAttendance = attendance.filter((record) => {
      if (!String(record.markedAt).startsWith(today)) {
        return false;
      }

      // If attendance has a sessionId, use it for department filtering.
      if (record.sessionId !== undefined && record.sessionId !== null) {
        return todaySessionIds.has(Number(record.sessionId));
      }

      // Keep compatibility with existing attendance records.
      return req.user.role === "SUPER_ADMIN";
    });

    const presentToday = todayAttendance.filter(
      (record) => record.status === "PRESENT",
    ).length;

    const absentToday = todayAttendance.filter(
      (record) => record.status === "ABSENT",
    ).length;

    return res.status(200).json({
      success: true,
      data: {
        totalStudents: visibleStudents.length,
        totalFaculty: visibleFaculty.length,
        totalClasses: visibleClasses.length,
        activeSessions: activeSessions.length,
        todaySessions: todaySessions.length,
        todayAttendance: todayAttendance.length,
        presentToday,
        absentToday,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
    });
  }
};

export const getAdminStudents = async (req, res) => {
  try {
    const students = await db.orm.public.Student.all();
    const users = await db.orm.public.User.all();
    const departments = await db.orm.public.Department.all();
    const devices = await db.orm.public.StudentDevice.all();

    /*
     * Department access rules:
     *
     * SUPER_ADMIN -> all departments
     * ADMIN/HOD   -> only their own department
     *
     * Never trust a departmentId supplied by the client
     * for a department-scoped admin.
     */
    let visibleStudents = students;

    if (req.user.role === "ADMIN" || req.user.role === "HOD") {
      if (!req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: "Admin account is not assigned to a department",
        });
      }

      visibleStudents = students.filter(
        (student) => student.departmentId === Number(req.user.departmentId),
      );
    } else if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view students",
      });
    }

    const result = visibleStudents.map((student) => {
      const user = users.find((user) => user.id === student.userId);

      const department = departments.find(
        (department) => department.id === student.departmentId,
      );

      const studentDevices = devices.filter(
        (device) => device.studentId === student.id && device.isActive === true,
      );

      const deviceBound = studentDevices.length > 0;

      return {
        id: student.id,
        name: user?.name ?? "Unknown",
        usn: student.registerNumber,
        department: department?.name ?? "Unknown",
        departmentId: student.departmentId,
        semester: student.semester,
        section: student.section,
        academicYear: student.academicYear,
        email: user?.email ?? null,
        deviceBound,
        boundDeviceName: deviceBound ? "Registered Device" : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Admin students error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load students",
    });
  }
};

// Automatically determine the lab batch from the student's USN.
// Every 20 students form one batch:
// 001-020 -> 1
// 021-040 -> 2
// 041-060 -> 3
// 061-080 -> 4
const getAutomaticLabBatch = (usn, section) => {
  const normalizedUsn = String(usn || "")
    .trim()
    .toUpperCase();
  const normalizedSection = String(section || "A")
    .trim()
    .toUpperCase();

  // Extract the numeric suffix from the USN.
  const match = normalizedUsn.match(/(\d+)$/);

  if (!match) {
    return null;
  }

  const usnNumber = parseInt(match[1], 10);

  if (!Number.isFinite(usnNumber) || usnNumber <= 0) {
    return null;
  }

  // 001-020 = 1, 021-040 = 2, etc.
  const batchNumber = Math.ceil(usnNumber / 20);

  // Current Admin system supports maximum 4 batches per division.
  if (batchNumber < 1 || batchNumber > 4) {
    return null;
  }

  return `${normalizedSection}${batchNumber}`;
};

const syncStudentLabBatch = async (student) => {
  try {
    if (!student?.id || !student?.Lab) {
      return null;
    }

    const labBatchName = String(student.Lab).trim().toUpperCase();

    // Find an existing LabBatch for this student's
    // department, semester, section and academic year.
    let labBatch = await db.orm.public.LabBatch.where({
      name: labBatchName,
      departmentId: student.departmentId,
      semester: student.semester,
      section: student.section,
      academicYear: student.academicYear,
    }).all();

    labBatch = labBatch[0] || null;

    // Create the LabBatch automatically if it doesn't exist.
    if (!labBatch) {
      labBatch = await db.orm.public.LabBatch.create({
        name: labBatchName,
        departmentId: student.departmentId,
        semester: student.semester,
        section: student.section,
        academicYear: student.academicYear,
      });

      console.log(
        `Created LabBatch ${labBatchName} for ${student.section}, semester ${student.semester}`,
      );
    }

    // Prevent duplicate StudentBatch records.
    const existingAssignments = await db.orm.public.StudentBatch.where({
      studentId: student.id,
      batchId: labBatch.id,
    }).all();

    if (!existingAssignments.length) {
      await db.orm.public.StudentBatch.create({
        studentId: student.id,
        batchId: labBatch.id,
      });

      console.log(
        `Student ${student.registerNumber} assigned to LabBatch ${labBatchName}`,
      );
    }

    return labBatch;
  } catch (error) {
    console.error(
      `Student lab batch sync failed for ${student?.registerNumber}:`,
      error,
    );

    throw error;
  }
};

const syncStudentEnrollments = async (student) => {
  try {
    const classes = await db.orm.public.Class.where({
      departmentId: student.departmentId,
      semester: student.semester,
      section: student.section,
      academicYear: student.academicYear,
    }).all();

    if (!classes.length) {
      console.log(
        `No matching classes found for student ${student.registerNumber}`,
      );
      return 0;
    }

    const existingEnrollments = await db.orm.public.Enrollment.where({
      studentId: student.id,
    }).all();

    let createdCount = 0;

    for (const classItem of classes) {
      const alreadyEnrolled = existingEnrollments.some(
        (enrollment) => Number(enrollment.classId) === Number(classItem.id),
      );

      if (alreadyEnrolled) {
        continue;
      }

      await db.orm.public.Enrollment.create({
        studentId: student.id,
        classId: classItem.id,
      });

      createdCount++;
    }

    console.log(
      `Enrollment sync: ${student.registerNumber} -> ${createdCount} class(es)`,
    );

    return createdCount;
  } catch (error) {
    console.error(
      `Enrollment sync failed for student ${student.registerNumber}:`,
      error,
    );

    throw error;
  }
};

export const createAdminStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      registerNumber,
      department,
      departmentId,
      semester,
      section,
      academicYear,
    } = req.body;

    // Basic validation
    if (!name || !email || !registerNumber) {
      return res.status(400).json({
        success: false,
        message: "Name, email and register number are required",
      });
    }

    // Find department
    // Find department
    const departments = await db.orm.public.Department.all();

    let selectedDepartment = null;

    if (req.user.role === "SUPER_ADMIN") {
      // Super Admin can create students in any department.
      if (departmentId) {
        selectedDepartment = departments.find(
          (item) => item.id === Number(departmentId),
        );
      } else if (department) {
        selectedDepartment = departments.find(
          (item) =>
            String(item.name).toLowerCase() ===
              String(department).trim().toLowerCase() ||
            String(item.code).toLowerCase() ===
              String(department).trim().toLowerCase(),
        );
      }
    } else if (req.user.role === "ADMIN" || req.user.role === "HOD") {
      // Department Admin/HOD can only create students
      // inside their own department.
      if (!req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: "Admin account is not assigned to a department",
        });
      }

      selectedDepartment = departments.find(
        (item) => item.id === Number(req.user.departmentId),
      );

      if (!selectedDepartment) {
        return res.status(404).json({
          success: false,
          message: "Admin department not found",
        });
      }

      // If the client supplied a department, make sure
      // it matches the authenticated admin's department.
      if (
        departmentId &&
        Number(departmentId) !== Number(req.user.departmentId)
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only create students in your department",
        });
      }

      if (department) {
        const requestedDepartment = departments.find(
          (item) =>
            String(item.name).toLowerCase() ===
              String(department).trim().toLowerCase() ||
            String(item.code).toLowerCase() ===
              String(department).trim().toLowerCase(),
        );

        if (
          requestedDepartment &&
          requestedDepartment.id !== Number(req.user.departmentId)
        ) {
          return res.status(403).json({
            success: false,
            message: "You can only create students in your department",
          });
        }
      }
    }

    if (!selectedDepartment) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Convert semester if necessary
    const semesterNumber = Number(String(semester ?? "").replace(/\D/g, ""));

    if (!semesterNumber || semesterNumber < 1 || semesterNumber > 8) {
      return res.status(400).json({
        success: false,
        message: "Semester must be between 1 and 8",
      });
    }

    // Normalize values
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedRegisterNumber = String(registerNumber)
      .trim()
      .toUpperCase();

    // Check duplicate email
    const users = await db.orm.public.User.all();

    const emailExists = users.some(
      (user) => user.email.toLowerCase() === normalizedEmail,
    );

    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Check duplicate USN
    const students = await db.orm.public.Student.all();

    const registerExists = students.some(
      (student) =>
        student.registerNumber.toUpperCase() === normalizedRegisterNumber,
    );

    if (registerExists) {
      return res.status(409).json({
        success: false,
        message: "Register number already exists",
      });
    }

    // Generate temporary password
    const temporaryPassword = `SA${normalizedRegisterNumber.slice(-4)}@2026`;

    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // Create User
    // Create User
    const user = await db.orm.public.User.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      passwordHash,
      role: "STUDENT",
      departmentId: selectedDepartment.id,
      isActive: true,
    });

    // Create Student
    const normalizedSection = section
      ? String(section)
          .replace(/section/i, "")
          .trim()
          .toUpperCase()
      : "A";

    const normalizedAcademicYear =
      String(academicYear || "")
        .trim()
        .toLowerCase() === "4th year"
        ? "2026-27"
        : String(academicYear || "2026-27").trim();

    const automaticLabBatch = getAutomaticLabBatch(
      normalizedRegisterNumber,
      normalizedSection,
    );

    const student = await db.orm.public.Student.create({
      userId: user.id,
      registerNumber: normalizedRegisterNumber,
      departmentId: selectedDepartment.id,
      semester: semesterNumber,
      section: normalizedSection,
      academicYear: normalizedAcademicYear,
      Lab: automaticLabBatch,
    });

    await syncStudentLabBatch(student);
    await syncStudentEnrollments(student);

    return res.status(201).json({
      success: true,
      message: "Student account created successfully",
      data: {
        id: student.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        usn: student.registerNumber,
        department: selectedDepartment.name,
        departmentId: selectedDepartment.id,
        semester: student.semester,
        section: student.section,
        academicYear: student.academicYear,
        lab: student.Lab,
        deviceBound: false,

        // Temporary for development/testing.
        // Remove this before production.
        temporaryPassword,
      },
    });
  } catch (error) {
    console.error("Admin create student error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create student account",
    });
  }
};

export const getAdminStudentProfile = async (req, res) => {
  try {
    const studentId = Number(req.params.id);

    if (!studentId || Number.isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const students = await db.orm.public.Student.all();
    const users = await db.orm.public.User.all();
    const departments = await db.orm.public.Department.all();
    const devices = await db.orm.public.StudentDevice.all();
    const attendance = await db.orm.public.Attendance.all();

    const student = students.find((item) => item.id === studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Department-level access control
    if (
      (req.user.role === "ADMIN" || req.user.role === "HOD") &&
      Number(student.departmentId) !== Number(req.user.departmentId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only access students in your department",
      });
    }

    const user = users.find((item) => item.id === student.userId);

    const department = departments.find(
      (item) => item.id === student.departmentId,
    );

    const studentDevices = devices.filter(
      (device) => device.studentId === student.id,
    );

    const activeDevices = studentDevices.filter(
      (device) => device.isActive === true,
    );

    const studentAttendance = attendance.filter(
      (record) => record.studentId === student.id,
    );

    const totalAttendance = studentAttendance.length;

    const presentAttendance = studentAttendance.filter(
      (record) => record.status === "PRESENT",
    ).length;

    const attendancePercentage =
      totalAttendance > 0
        ? Number(((presentAttendance / totalAttendance) * 100).toFixed(1))
        : 0;

    const activeDevice = activeDevices[0] ?? null;

    return res.status(200).json({
      success: true,
      data: {
        id: student.id,
        userId: student.userId,

        name: user?.name ?? "Unknown",
        email: user?.email ?? null,

        usn: student.registerNumber,

        department: department?.name ?? "Unknown",
        departmentId: student.departmentId,

        semester: student.semester,
        section: student.section,
        academicYear: student.academicYear,

        attendancePercentage,

        deviceBound: activeDevices.length > 0,
        deviceCount: studentDevices.length,
        activeDeviceCount: activeDevices.length,

        device: activeDevice
          ? {
              id: activeDevice.id,
              publicKey: activeDevice.publicKey,
              isActive: activeDevice.isActive,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Admin student profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load student profile",
    });
  }
};

export const unbindAdminStudentDevice = async (req, res) => {
  try {
    const studentId = Number(req.params.id);

    if (!studentId || Number.isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const students = await db.orm.public.Student.all();

    const student = students.find((item) => item.id === studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Department-level access control
    if (
      (req.user.role === "ADMIN" || req.user.role === "HOD") &&
      Number(student.departmentId) !== Number(req.user.departmentId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only manage students in your department",
      });
    }

    const devices = await db.orm.public.StudentDevice.where({
      studentId: student.id,
    }).all();

    const activeDevices = devices.filter((device) => device.isActive === true);

    if (activeDevices.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No active device is currently bound to this student",
      });
    }

    let unboundCount = 0;

    for (const device of activeDevices) {
      await db.orm.public.StudentDevice.where({
        id: device.id,
      }).update({
        isActive: false,
      });

      unboundCount++;
    }

    return res.status(200).json({
      success: true,
      message: "Student device binding reset successfully",
      data: {
        studentId: student.id,
        unboundCount,
        deviceBound: false,
      },
    });
  } catch (error) {
    console.error("Admin student device unbind error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to unbind student device",
    });
  }
};

export const getAdminStudentDevice = async (req, res) => {
  try {
    const studentId = Number(req.params.id);

    if (!studentId || Number.isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const students = await db.orm.public.Student.all();
    const student = students.find((item) => item.id === studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Department-level access control
    if (
      (req.user.role === "ADMIN" || req.user.role === "HOD") &&
      Number(student.departmentId) !== Number(req.user.departmentId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only manage students in your department",
      });
    }

    const devices = await db.orm.public.StudentDevice.where({
      studentId: student.id,
    }).all();

    const deviceDetails = devices.map((device) => ({
      id: device.id,
      publicKeyFingerprint: device.publicKey
        ? `${device.publicKey.slice(0, 8)}...${device.publicKey.slice(-8)}`
        : "",
      isActive: device.isActive,
      createdAt: device.createdAt,
      updatedAt: device.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        studentId: student.id,
        usn: student.usn,
        studentName: student.name,
        department: student.departmentId,
        isBound: devices.some((device) => device.isActive === true),
        devices: deviceDetails,
      },
    });
  } catch (error) {
    console.error("Admin student device details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load student device details",
    });
  }
};

export const getAdminFaculty = async (req, res) => {
  try {
    const faculty = await db.orm.public.Faculty.all();
    const users = await db.orm.public.User.all();
    const departments = await db.orm.public.Department.all();

    const result = faculty.map((member) => {
      const user = users.find((item) => item.id === member.userId);
      const department = departments.find(
        (item) => item.id === member.departmentId,
      );

      return {
        id: member.id,
        userId: member.userId,
        name: user?.name ?? "Unknown",
        email: user?.email ?? null,
        employeeId: member.employeeId,
        department: department?.name ?? "Unknown",
        departmentId: member.departmentId,
        designation: member.designation ?? null,
        isActive: user?.isActive ?? false,
      };
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Admin faculty error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load faculty",
    });
  }
};

export const createAdminFaculty = async (req, res) => {
  try {
    const { name, email, password, employeeId, departmentId, designation } =
      req.body;

    if (!name || !email || !password || !employeeId || !departmentId) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, password, employee ID and department are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedEmployeeId = String(employeeId).trim().toUpperCase();

    const users = await db.orm.public.User.all();
    const faculty = await db.orm.public.Faculty.all();
    const departments = await db.orm.public.Department.all();

    if (
      users.some(
        (user) => String(user.email).trim().toLowerCase() === normalizedEmail,
      )
    ) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    if (
      faculty.some(
        (member) =>
          String(member.employeeId).trim().toUpperCase() ===
          normalizedEmployeeId,
      )
    ) {
      return res.status(409).json({
        success: false,
        message: "Employee ID already exists",
      });
    }

    const selectedDepartment = departments.find(
      (item) => item.id === Number(departmentId),
    );

    if (!selectedDepartment) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    /*
     * Faculty is intentionally NOT department restricted.
     *
     * A CSE Admin can create an ECE faculty member,
     * because faculty may teach classes belonging to
     * another department.
     */

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await db.orm.public.User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: "FACULTY",
      departmentId: selectedDepartment.id,
      isActive: true,
    });

    const facultyRecord = await db.orm.public.Faculty.create({
      userId: user.id,
      employeeId: normalizedEmployeeId,
      departmentId: selectedDepartment.id,
      ...(designation ? { designation: String(designation).trim() } : {}),
    });

    return res.status(201).json({
      success: true,
      message: "Faculty created successfully",
      data: {
        id: facultyRecord.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        employeeId: facultyRecord.employeeId,
        department: selectedDepartment.name,
        departmentId: selectedDepartment.id,
        designation: facultyRecord.designation ?? null,
      },
    });
  } catch (error) {
    console.error("Admin create faculty error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create faculty",
    });
  }
};

export const updateAdminFaculty = async (req, res) => {
  try {
    const facultyId = Number(req.params.id);

    if (!Number.isInteger(facultyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid faculty ID",
      });
    }

    const { name, employeeId, departmentId, designation } = req.body;

    const [facultyList, users, departments] = await Promise.all([
      db.orm.public.Faculty.all(),
      db.orm.public.User.all(),
      db.orm.public.Department.all(),
    ]);

    const faculty = facultyList.find((item) => item.id === facultyId);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    const user = users.find((item) => item.id === faculty.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Faculty user account not found",
      });
    }

    const allowedDesignations = [
      "HOD",
      "PROFESSOR",
      "ASSOCIATE_PROFESSOR",
      "ASSISTANT_PROFESSOR",
    ];

    if (
      designation !== undefined &&
      !allowedDesignations.includes(designation)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid faculty designation",
      });
    }

    if (employeeId !== undefined) {
      const normalizedEmployeeId = String(employeeId).trim();

      const duplicate = facultyList.find(
        (item) =>
          item.id !== facultyId && item.employeeId === normalizedEmployeeId,
      );

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Employee ID already exists",
        });
      }
    }

    let selectedDepartment = null;

    if (departmentId !== undefined) {
      selectedDepartment = departments.find(
        (department) => department.id === Number(departmentId),
      );

      if (!selectedDepartment) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }
    } else {
      selectedDepartment = departments.find(
        (department) => department.id === faculty.departmentId,
      );
    }

    const updatedUser = await db.orm.public.User.where({ id: user.id }).update({
      ...(name !== undefined && {
        name: String(name).trim(),
      }),
    });

    const updatedFaculty = await db.orm.public.Faculty.where({
      id: facultyId,
    }).update({
      ...(employeeId !== undefined && {
        employeeId: String(employeeId).trim(),
      }),
      ...(departmentId !== undefined && {
        departmentId: Number(departmentId),
      }),
      ...(designation !== undefined && {
        designation,
      }),
    });

    return res.status(200).json({
      success: true,
      message: "Faculty updated successfully",
      data: {
        id: updatedFaculty.id,
        userId: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        employeeId: updatedFaculty.employeeId,
        designation: updatedFaculty.designation,
        departmentId: updatedFaculty.departmentId,
        department: selectedDepartment?.name ?? "",
        departmentCode: selectedDepartment?.code ?? "",
      },
    });
  } catch (error) {
    console.error("Update admin faculty error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update faculty",
    });
  }
};

export const deleteAdminFaculty = async (req, res) => {
  try {
    const facultyId = Number(req.params.id);

    if (!Number.isInteger(facultyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid faculty ID",
      });
    }

    const facultyList = await db.orm.public.Faculty.all();

    const faculty = facultyList.find((item) => item.id === facultyId);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    // Do not allow deletion if this faculty is assigned to a class.
    const classes = await db.orm.public.Class.all();

    const assignedClass = classes.find((item) => item.facultyId === facultyId);

    if (assignedClass) {
      return res.status(409).json({
        success: false,
        message:
          "Faculty cannot be deleted because they are assigned to a class",
      });
    }

    await db.orm.public.Faculty.where({ id: facultyId }).delete();

    await db.orm.public.User.where({ id: faculty.userId }).delete();

    return res.status(200).json({
      success: true,
      message: "Faculty deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin faculty error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete faculty",
    });
  }
};
