import { Router } from "express";
import {
  listHouses,
  getHouse,
  createHouse,
  updateHouse,
  assignCollector,
  changeStatus,
} from "../controllers/houseController";
import { protect, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { houseSchema, houseUpdateSchema, assignCollectorSchema, statusChangeSchema } from "../schemas";
import { UserRole } from "../constants";

const router = Router();

router.use(protect);

router.get("/", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COLLECTION_MANAGER, UserRole.COLLECTOR), listHouses);
router.get("/:id", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COLLECTION_MANAGER, UserRole.COLLECTOR), getHouse);
router.post("/", authorize(UserRole.SUPER_ADMIN, UserRole.COLLECTION_MANAGER), validate(houseSchema), createHouse);
router.put("/:id", authorize(UserRole.SUPER_ADMIN, UserRole.COLLECTION_MANAGER), validate(houseUpdateSchema), updateHouse);
router.patch("/:id/assign", authorize(UserRole.SUPER_ADMIN, UserRole.COLLECTION_MANAGER), validate(assignCollectorSchema), assignCollector);
router.patch("/:id/status", authorize(UserRole.SUPER_ADMIN, UserRole.COLLECTION_MANAGER), validate(statusChangeSchema), changeStatus);

export default router;
