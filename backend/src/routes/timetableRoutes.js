import express from "express";

import {
  getTimetable,
  createTimetable,
  saveTimetableGrid,
} from "../controllers/timetableController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// View timetable
router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD", "FACULTY", "STUDENT"),
  getTimetable,
);

// Create timetable
router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD"),
  createTimetable,
);

router.post(
  "/grid",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD"),
  saveTimetableGrid,
);

export default router;
