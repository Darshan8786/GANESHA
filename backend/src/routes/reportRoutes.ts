import { Router } from "express";
import {
  collectionByDate,
  collectionByDonorType,
  collectionByPaymentMode,
  collectionByArea,
  collectionByCollector,
  expensesByCategory,
  incomeVsExpense,
  settlementReport,
  finalReport,
  exportCsv,
  exportCollectionLogExcel,
} from "../controllers/reportController";
import { protect, authorize } from "../middleware/auth";
import { UserRole } from "../constants";

const router = Router();

router.use(protect);
router.use(authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN));

router.get("/collections", collectionByDate);
router.get("/collections/by-date", collectionByDate);
router.get("/collections/by-donor-type", collectionByDonorType);
router.get("/collections/by-payment", collectionByPaymentMode);
router.get("/collections/by-area", collectionByArea);
router.get("/collections/by-collector", collectionByCollector);
router.get("/expenses", expensesByCategory);
router.get("/income-expense", incomeVsExpense);
router.get("/settlements", settlementReport);
router.get("/final", finalReport);
router.get("/excel/collection-log", exportCollectionLogExcel);
router.get("/export/:type", exportCsv);

export default router;
