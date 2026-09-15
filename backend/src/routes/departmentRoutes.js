import express from "express";

import {
  getDepartments,
  createDepartment,
} from "../controllers/departmentController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All authenticated admins can view departments.
// Super Admin can see all; department admins need the list
// for selecting/working with academic data.
router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "ADMIN", "HOD"),
  getDepartments,
);

// Only Super Admin can create a new department.
router.post("/", authenticate, authorize("SUPER_ADMIN"), createDepartment);

export default router;
