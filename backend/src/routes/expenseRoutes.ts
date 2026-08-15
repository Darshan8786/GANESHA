import { Router } from "express";
import { listExpenses, getExpense, createExpense, updateExpense, reviewExpense, softDeleteExpense } from "../controllers/expenseController";
import { protect, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { expenseSchema, expenseStatusSchema } from "../schemas";
import { UserRole } from "../constants";

const router = Router();

router.use(protect);

router.get("/", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COLLECTION_MANAGER), listExpenses);
router.get("/:id", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COLLECTION_MANAGER), getExpense);
router.post("/", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN), validate(expenseSchema), createExpense);
router.put("/:id", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN), validate(expenseSchema.partial()), updateExpense);
router.patch("/:id/review", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN), validate(expenseStatusSchema), reviewExpense);
router.patch("/:id/delete", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN), softDeleteExpense);

export default router;
