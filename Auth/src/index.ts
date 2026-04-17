import express from "express";
import "dotenv/config";
import { logger } from "./lib/logger";
import { userRouter } from "./modules/User/user.routes";
import { HTTP_STATUS } from "./common/constant/constants";
import { authRouter } from "./modules/Auth/auth.routes";
import cookieParser from "cookie-parser";
import { startServer } from "./common/utils/utils";
import cors from "cors";
import { redisClient } from "./lib/redis";

const app = express();
const origin = process.env.UIOrigin;
app.use(
  cors({
    origin: origin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

await startServer();
await redisClient;

const PORT = process.env.PORT || 4001;

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info(
      `[${req.method}] ${req.url} - ${res.statusCode} (${Date.now() - start}ms)`,
    );
  });
  next();
});

app.get("/health", (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    error: false,
    data: null,
    message: "Health check success",
  });
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1/auth", authRouter);

app.listen(PORT, () => {
  //   console.log(`Server started at http://localhost:${PORT}`);
  logger.info(`Server started at http://localhost:${PORT}`);
});
