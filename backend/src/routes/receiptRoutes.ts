import { Router } from "express";
import {
  listReceipts,
  receiptYears,
  getReceipt,
  getReceiptByNumber,
  downloadReceiptPdf,
  batchReceiptPdf,
  cancelReceipt,
} from "../controllers/receiptController";
import { protect, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { receiptCancelSchema } from "../schemas";
import { UserRole } from "../constants";

const router = Router();

router.use(protect);

router.get("/", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COLLECTION_MANAGER, UserRole.COLLECTOR), listReceipts);
router.get("/years", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COLLECTION_MANAGER, UserRole.COLLECTOR), receiptYears);
router.get("/by-number/:receiptNumber", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COLLECTION_MANAGER, UserRole.COLLECTOR), getReceiptByNumber);
router.get("/:id", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COLLECTION_MANAGER, UserRole.COLLECTOR), getReceipt);
router.get("/:id/pdf", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COLLECTION_MANAGER, UserRole.COLLECTOR), downloadReceiptPdf);
router.post("/batch/pdf", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COLLECTION_MANAGER, UserRole.COLLECTOR), batchReceiptPdf);
router.patch("/:id/cancel", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN), validate(receiptCancelSchema), cancelReceipt);

export default router;
