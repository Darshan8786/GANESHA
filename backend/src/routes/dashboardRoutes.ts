import { Router } from "express";
import { dashboard, collectorDashboard, collectorAssignments, collectionSearch } from "../controllers/dashboardController";
import { protect, authorize } from "../middleware/auth";
import { UserRole } from "../constants";

const router = Router();

router.use(protect);

router.get("/", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COLLECTION_MANAGER), dashboard);
router.get("/collections", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COLLECTION_MANAGER, UserRole.COLLECTOR), collectionSearch);
router.get("/collector", authorize(UserRole.COLLECTOR, UserRole.SUPER_ADMIN), collectorDashboard);
router.get("/collector/assignments", authorize(UserRole.COLLECTOR, UserRole.SUPER_ADMIN), collectorAssignments);

export default router;
