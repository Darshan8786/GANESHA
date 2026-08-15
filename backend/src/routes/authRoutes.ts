import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, me, changePassword, appInfo } from "../controllers/authController";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { loginSchema, changePasswordSchema } from "../schemas";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later" },
});

router.post("/login", authLimiter, validate(loginSchema), login);
router.get("/me", protect, me);
router.get("/app-info", protect, appInfo);
router.post("/change-password", protect, validate(changePasswordSchema), changePassword);

export default router;
