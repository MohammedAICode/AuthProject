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
import { login, logout, me, reset } from "./auth.controller";
import { authenticate } from "../../middleware/authenticate";

export const authRouter = Router();

authRouter.post("/login", login);
authRouter.get("/logout", authenticate, logout);
authRouter.get("/me", authenticate, me);
authRouter.post('/reset-password/:email', reset);

