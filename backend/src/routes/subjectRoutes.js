import express from "express";

import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../controllers/subjectController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD", "FACULTY", "STUDENT"),
  getSubjects,
);

router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD"),
  createSubject,
);

router.patch(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD"),
  updateSubject,
);

router.delete(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD"),
  deleteSubject,
);

export default router;
