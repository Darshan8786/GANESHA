import { Router } from "express";
import { createDonation, listDonations, getDonation, cancelDonation, payPendingDonation, deleteDonation } from "../controllers/donationController";
import { protect, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { donationSchema, payDonationSchema, receiptCancelSchema } from "../schemas";
import { UserRole } from "../constants";

const router = Router();

router.use(protect);

router.get("/", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COLLECTION_MANAGER, UserRole.COLLECTOR), listDonations);
router.get("/:id", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.COLLECTION_MANAGER, UserRole.COLLECTOR), getDonation);
router.post("/", validate(donationSchema), createDonation);
router.patch("/:id/pay", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN), validate(payDonationSchema), payPendingDonation);
router.patch("/:id/cancel", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN), validate(receiptCancelSchema), cancelDonation);
router.delete("/:id", authorize(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN), deleteDonation);

export default router;
