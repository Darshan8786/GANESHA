import { Router } from "express";
import { listAreas, areaStats, createArea, updateArea, deleteArea } from "../controllers/areaController";
import { protect, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { areaSchema } from "../schemas";
import { UserRole } from "../constants";

const router = Router();

router.use(protect);

router.get("/", authorize(UserRole.SUPER_ADMIN, UserRole.COLLECTION_MANAGER, UserRole.FINANCE_ADMIN, UserRole.COLLECTOR), listAreas);
router.get("/stats", authorize(UserRole.SUPER_ADMIN, UserRole.COLLECTION_MANAGER, UserRole.FINANCE_ADMIN), areaStats);
router.post("/", authorize(UserRole.SUPER_ADMIN, UserRole.COLLECTION_MANAGER), validate(areaSchema), createArea);
router.put("/:id", authorize(UserRole.SUPER_ADMIN, UserRole.COLLECTION_MANAGER), validate(areaSchema.partial()), updateArea);
router.delete("/:id", authorize(UserRole.SUPER_ADMIN), deleteArea);

export default router;
