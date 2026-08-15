import { Router } from "express";
import { publicHome } from "../controllers/publicController";
import { verifyReceiptPublic } from "../controllers/receiptController";
import { listEvents } from "../controllers/eventController";
import { listAnnouncements } from "../controllers/eventController";
import rateLimit from "express-rate-limit";

const router = Router();

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later" },
});

router.get("/home", publicLimiter, publicHome);
router.get("/events", publicLimiter, listEvents);
router.get("/announcements", publicLimiter, listAnnouncements);
router.get("/receipts/:receiptNumber/verify", publicLimiter, verifyReceiptPublic);

export default router;
