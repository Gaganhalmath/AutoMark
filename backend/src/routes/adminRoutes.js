import express from "express";

import {
  getAdminDashboard,
  getAdminStudents,
  createAdminStudent,
  getAdminStudentProfile,
  unbindAdminStudentDevice,
  getAdminStudentDevice,
  getAdminFaculty,
  createAdminFaculty,
  updateAdminFaculty,
  deleteAdminFaculty,
} from "../controllers/adminController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { saveTimetableGrid } from "../controllers/timetableController.js";

const router = express.Router();

router.get(
  "/dashboard",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD"),
  getAdminDashboard,
);

router.get(
  "/students",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD"),
  getAdminStudents,
);

router.post(
  "/students",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD"),
  createAdminStudent,
);

router.get(
  "/students/:id",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD"),
  getAdminStudentProfile,
);

router.get(
  "/students/:id/device",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD"),
  getAdminStudentDevice,
);

router.post(
  "/students/:id/unbind-device",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD"),
  unbindAdminStudentDevice,
);

router.post(
  "/students/:id/device/reset",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD"),
  unbindAdminStudentDevice,
);

router.get(
  "/faculty",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD"),
  getAdminFaculty,
);

router.post(
  "/faculty",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD"),
  createAdminFaculty,
);

router.patch(
  "/faculty/:id",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD"),
  updateAdminFaculty,
);

router.delete(
  "/faculty/:id",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD"),
  deleteAdminFaculty,
);

router.post(
  "/timetable/grid",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD"),
  saveTimetableGrid,
);

export default router;
