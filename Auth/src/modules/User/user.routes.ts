import { Router } from "express";
import { get, getAll, register, remove, update } from "./user.controller";
import { uploadProfileImage } from "../../middleware/upload.middleware";
import { authenticate } from "../../middleware/authenticate";

export const userRouter = Router();

userRouter.post("/register", uploadProfileImage, register);

// add middle-ware. so that only user with admin role can access these routes.
userRouter.get("/:id", get);
userRouter.get("/", authenticate ,getAll);
userRouter.delete("/:id", remove);
userRouter.put("/:id", uploadProfileImage, update);
