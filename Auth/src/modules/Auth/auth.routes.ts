// POST   /auth/login
// POST   /auth/logout
// POST   /auth/refresh-token
// GET    /auth/me
// POST   /auth/forgot-password
// POST   /auth/reset-password
// POST   /auth/change-password   (recommended)
// POST   /auth/verify-email      (optional)
// POST   /auth/resend-verification-email (optional)

import { Router } from "express";
import {
  forgetPassword,
  googleAuth,
  googleCallBack,
  login,
  logout,
  me,
  reset,
  updatePassword,
  verifyOTP,
} from "./auth.controller";
import { authenticate } from "../../middleware/authenticate";

export const authRouter = Router();

authRouter.post("/login", login);
authRouter.get("/logout", authenticate, logout);
authRouter.get("/me", authenticate, me);
authRouter.post("/reset-password/:email", reset);
authRouter.get("/forget-password", forgetPassword);

authRouter.get("/verify", verifyOTP);
authRouter.post("/forget", authenticate, updatePassword);

authRouter.get("/google", googleAuth);
authRouter.get("/google/callback", googleCallBack);
