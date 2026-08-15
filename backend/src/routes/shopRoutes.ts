import { Router } from "express";
import {
  listShops,
  getShop,
  createShop,
  updateShop,
  assignCollector,
  changeStatus,
} from "../controllers/shopController";
import { protect, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { shopSchema, shopUpdateSchema, assignCollectorSchema, statusChangeSchema } from "../schemas";
import { UserRole } from "../constants";

const router = Router();

router.use(protect);

router.get("/", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COLLECTION_MANAGER, UserRole.COLLECTOR), listShops);
router.get("/:id", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COLLECTION_MANAGER, UserRole.COLLECTOR), getShop);
router.post("/", authorize(UserRole.SUPER_ADMIN, UserRole.COLLECTION_MANAGER), validate(shopSchema), createShop);
router.put("/:id", authorize(UserRole.SUPER_ADMIN, UserRole.COLLECTION_MANAGER), validate(shopUpdateSchema), updateShop);
router.patch("/:id/assign", authorize(UserRole.SUPER_ADMIN, UserRole.COLLECTION_MANAGER), validate(assignCollectorSchema), assignCollector);
router.patch("/:id/status", authorize(UserRole.SUPER_ADMIN, UserRole.COLLECTION_MANAGER), validate(statusChangeSchema), changeStatus);

export default router;
