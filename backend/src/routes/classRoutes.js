import express from "express";

import {
  getClasses,
  createClass,
  getClassDetails,
} from "../controllers/classController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD", "FACULTY", "STUDENT"),
  getClasses,
);

router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD"),
  createClass,
);

router.get("/:id", authenticate, authorize("FACULTY"), getClassDetails);

export default router;
