import { Router } from "express";
import { listAuditLogs } from "../controllers/auditController";
import { protect, authorize } from "../middleware/auth";
import { UserRole } from "../constants";

const router = Router();

router.use(protect);
router.use(authorize(UserRole.SUPER_ADMIN));

router.get("/", listAuditLogs);

export default router;
