import { db } from "../prisma/db.js";

export const getTimetable = async (req, res) => {
  try {
    const { academicYear, departmentId, semester, section } = req.query;

    const timetable = await db.orm.public.Timetable.all();
    const classes = await db.orm.public.Class.all();
    const subjects = await db.orm.public.Subject.all();
    const faculty = await db.orm.public.Faculty.all();

    let filteredTimetable = timetable;

    // ---------------------------------------------------------
    // Determine which department can be viewed
    // ---------------------------------------------------------
    let targetDepartmentId = departmentId ? Number(departmentId) : null;

    // Department Admin / HOD can only view their own department.
    if (req.user?.role === "ADMIN" || req.user?.role === "HOD") {
      const userDepartmentId = req.user.departmentId;

      if (!userDepartmentId) {
        return res.status(403).json({
          success: false,
          message: "Department is not assigned to this account",
        });
      }

      if (
        targetDepartmentId &&
        targetDepartmentId !== Number(userDepartmentId)
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only view timetable for your department",
        });
      }

      targetDepartmentId = Number(userDepartmentId);
    }

    // ---------------------------------------------------------
    // Filter timetable by:
    // Department + Semester + Section + Academic Year
    // ---------------------------------------------------------
    filteredTimetable = timetable.filter((item) => {
      const selectedClass = classes.find(
        (classItem) => Number(classItem.id) === Number(item.classId),
      );

      if (!selectedClass) {
        return false;
      }

      // Department filter
      if (
        targetDepartmentId &&
        Number(selectedClass.departmentId) !== Number(targetDepartmentId)
      ) {
        return false;
      }

      // Academic year filter
      if (
        academicYear &&
        String(selectedClass.academicYear).trim() !==
          String(academicYear).trim()
      ) {
        return false;
      }

      // Semester filter
      if (
        semester !== undefined &&
        Number(selectedClass.semester) !== Number(semester)
      ) {
        return false;
      }

      // Section filter
      if (
        section &&
        String(selectedClass.section).trim().toUpperCase() !==
          String(section).trim().toUpperCase()
      ) {
        return false;
      }

      return true;
    });

    // ---------------------------------------------------------
    // Enrich timetable records
    // ---------------------------------------------------------
    const enrichedTimetable = filteredTimetable.map((item) => {
      const selectedClass = classes.find(
        (classItem) => Number(classItem.id) === Number(item.classId),
      );

      const selectedSubject = selectedClass
        ? subjects.find(
            (subject) => Number(subject.id) === Number(selectedClass.subjectId),
          )
        : null;

      const selectedFaculty = selectedClass
        ? faculty.find(
            (facultyItem) =>
              Number(facultyItem.id) === Number(selectedClass.facultyId),
          )
        : null;

      return {
        ...item,

        classId: Number(item.classId),

        subjectId: selectedClass ? Number(selectedClass.subjectId) : null,

        facultyId: selectedClass ? Number(selectedClass.facultyId) : null,

        subject: selectedSubject
          ? {
              id: selectedSubject.id,
              code: selectedSubject.code,
              name: selectedSubject.name,
            }
          : null,

        faculty: selectedFaculty
          ? {
              id: selectedFaculty.id,
              employeeId: selectedFaculty.employeeId,
              designation: selectedFaculty.designation,
            }
          : null,

        semester: selectedClass?.semester ?? null,
        section: selectedClass?.section ?? null,
        academicYear: selectedClass?.academicYear ?? null,
        departmentId: selectedClass?.departmentId ?? null,
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedTimetable,
    });
  } catch (error) {
    console.error("Error fetching timetable:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch timetable",
    });
  }
};

export const saveTimetableGrid = async (req, res) => {
  try {
    const { academicYear, departmentId, semester, section, slots } = req.body;

    if (
      !academicYear ||
      !departmentId ||
      semester === undefined ||
      !section ||
      !Array.isArray(slots)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "academicYear, departmentId, semester, section and slots array are required",
      });
    }

    // Department Admin / HOD can only manage
    // timetable entries for their own department.
    if (req.user?.role === "ADMIN" || req.user?.role === "HOD") {
      const userDepartmentId = req.user.departmentId;

      if (!userDepartmentId) {
        return res.status(403).json({
          success: false,
          message: "Department is not assigned to this account",
        });
      }

      if (Number(departmentId) !== Number(userDepartmentId)) {
        return res.status(403).json({
          success: false,
          message: "You can only manage timetable for your department",
        });
      }
    }

    const classes = await db.orm.public.Class.all();
    const existingTimetable = await db.orm.public.Timetable.all();

    // Frontend sends day names, while the database uses:
    // 1 = Monday ... 7 = Sunday
    const dayMap = {
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
      SUNDAY: 7,
    };

    const created = [];

    for (const slot of slots) {
      if (!slot) continue;

      const subjectId =
        slot.subjectId === null || slot.subjectId === undefined
          ? null
          : Number(slot.subjectId);

      const facultyId =
        slot.facultyId === null || slot.facultyId === undefined
          ? null
          : Number(slot.facultyId);

      const startTime = slot.startTime;
      const endTime = slot.endTime;

      const rawDay = slot.dayOfWeek;

      const dayOfWeek =
        typeof rawDay === "string"
          ? dayMap[rawDay.trim().toUpperCase()]
          : Number(rawDay);

      // Skip empty cells.
      if (subjectId === null && facultyId === null && !slot.room) {
        continue;
      }

      if (
        !dayOfWeek ||
        dayOfWeek < 1 ||
        dayOfWeek > 7 ||
        !startTime ||
        !endTime
      ) {
        continue;
      }

      // A timetable slot with a subject must also have a faculty.
      if (subjectId === null || facultyId === null) {
        continue;
      }

      // Find the Class that represents:
      // Department + Semester + Section + Academic Year
      // + Subject + Faculty
      const matchingClass = classes.find(
        (item) =>
          Number(item.departmentId) === Number(departmentId) &&
          Number(item.semester) === Number(semester) &&
          String(item.section).trim().toUpperCase() ===
            String(section).trim().toUpperCase() &&
          String(item.academicYear).trim() === String(academicYear).trim() &&
          Number(item.subjectId) === subjectId &&
          Number(item.facultyId) === facultyId,
      );

      console.log("SLOT CHECK:", {
        subjectId,
        facultyId,
        dayOfWeek,
        startTime,
        matchingClassId: matchingClass?.id ?? null,
      });

      if (!matchingClass) {
        console.warn(
          `No Class found for subject ${subjectId}, faculty ${facultyId}, ` +
            `${section}, semester ${semester}, academic year ${academicYear}`,
        );
        continue;
      }

      // Prevent duplicate timetable entry.
      const duplicate = existingTimetable.find(
        (item) =>
          Number(item.classId) === Number(matchingClass.id) &&
          Number(item.dayOfWeek) === dayOfWeek &&
          String(item.startTime) === String(startTime),
      );

      console.log("DUPLICATE CHECK:", {
        classId: matchingClass.id,
        dayOfWeek,
        startTime,
        duplicateId: duplicate?.id ?? null,
      });

      if (duplicate) {
        continue;
      }

      const timetable = await db.orm.public.Timetable.create({
        classId: Number(matchingClass.id),
        dayOfWeek,
        startTime,
        endTime,
        room: slot.room || null,
      });

      created.push(timetable);
    }

    return res.status(201).json({
      success: true,
      message: "Timetable grid saved successfully",
      savedCount: created.length,
      data: created,
    });
  } catch (error) {
    console.error("Error saving timetable grid:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save timetable grid",
    });
  }
};

export const createTimetable = async (req, res) => {
  try {
    const { classId, dayOfWeek, startTime, endTime, room } = req.body;

    if (!classId || dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Class ID, day, start time and end time are required",
      });
    }

    const classes = await db.orm.public.Class.all();

    const selectedClass = classes.find((item) => item.id === Number(classId));

    if (!selectedClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Department Admin / HOD can only create
    // timetable entries for classes in their department.
    if (req.user?.role === "ADMIN" || req.user?.role === "HOD") {
      const departmentId = req.user.departmentId;

      if (!departmentId) {
        return res.status(403).json({
          success: false,
          message: "Department is not assigned to this account",
        });
      }

      if (Number(selectedClass.departmentId) !== Number(departmentId)) {
        return res.status(403).json({
          success: false,
          message: "You can only manage timetable for your department",
        });
      }
    }

    const day = Number(dayOfWeek);

    if (day < 0 || day > 7) {
      return res.status(400).json({
        success: false,
        message: "dayOfWeek must be between 0 and 7",
      });
    }

    const timetable = await db.orm.public.Timetable.create({
      classId: Number(classId),
      dayOfWeek: day,
      startTime,
      endTime,
      room: room || null,
    });

    res.status(201).json({
      success: true,
      message: "Timetable created successfully",
      data: timetable,
    });
  } catch (error) {
    console.error("Error creating timetable:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create timetable",
    });
  }
};
