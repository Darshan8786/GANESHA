import { Router } from "express";
import {
  listCollectors,
  listUsers,
  createUser,
  updateUser,
  disableUser,
  collectorPerformance,
} from "../controllers/userController";
import { protect, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { registerUserSchema, updateUserSchema } from "../schemas";
import { UserRole } from "../constants";

const router = Router();

router.use(protect);

router.get("/collectors", authorize(UserRole.SUPER_ADMIN, UserRole.COLLECTION_MANAGER, UserRole.FINANCE_ADMIN), listCollectors);
router.get("/collector-performance", authorize(UserRole.SUPER_ADMIN, UserRole.COLLECTION_MANAGER), collectorPerformance);
router.get("/", authorize(UserRole.SUPER_ADMIN, UserRole.COLLECTION_MANAGER), listUsers);
router.post("/", authorize(UserRole.SUPER_ADMIN, UserRole.COLLECTION_MANAGER), validate(registerUserSchema), createUser);
router.put("/:id", authorize(UserRole.SUPER_ADMIN, UserRole.COLLECTION_MANAGER), validate(updateUserSchema), updateUser);
router.patch("/:id/disable", authorize(UserRole.SUPER_ADMIN, UserRole.COLLECTION_MANAGER), disableUser);

export default router;
