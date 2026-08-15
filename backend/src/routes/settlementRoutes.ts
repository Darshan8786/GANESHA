import { Router } from "express";
import {
  listSettlements,
  listMySettlements,
  createSettlement,
  reviewSettlement,
} from "../controllers/settlementController";
import { protect, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { settlementSchema, settlementReviewSchema } from "../schemas";
import { UserRole } from "../constants";

const router = Router();

router.use(protect);

router.get("/", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COLLECTION_MANAGER), listSettlements);
router.get("/my", authorize(UserRole.SUPER_ADMIN, UserRole.COLLECTOR), listMySettlements);
router.post("/", validate(settlementSchema), createSettlement);
router.post("/:id/review", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN), validate(settlementReviewSchema), reviewSettlement);

export default router;
