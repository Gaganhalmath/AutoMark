import express from "express";
import { createDepartmentAdmin } from "../controllers/adminUserController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/department-admins",
  authenticate,
  authorize("SUPER_ADMIN"),
  createDepartmentAdmin,
);

export default router;
