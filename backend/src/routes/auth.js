import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  me,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { authenticateJWT } from "../middleware/authenticateJWT.js";

const router = Router();

// Tight limit to prevent abuse of the email-sending endpoint.
const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many reset requests, try again later" },
});

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotLimiter, forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authenticateJWT, me);

export default router;
