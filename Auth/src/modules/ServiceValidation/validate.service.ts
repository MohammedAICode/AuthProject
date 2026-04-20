import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { AppError } from "../../common/errors/AppError";
import { logger } from "../../lib/logger";
import { prisma } from "../../lib/prisma";
import { S3 } from "../../lib/s3";
import { ses } from "../../lib/ses";
import { GetSendQuotaCommand } from "@aws-sdk/client-ses";
import { redisClient } from "../../lib/redis";
import { HTTP_STATUS } from "../../common/constant/constants";

export async function validateServices(): Promise<void> {
  logger.info(
    "[SERVICE VALIDATION] Starting validation of all external services...",
  );
  const results = await Promise.allSettled([
    validateDb(),
    validateS3(),
    validateSES(),
    validateRedis(),
  ]);
  let hasFailures = false;
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      hasFailures = true;
      const serviceName = ["Database", "S3", "SES", "Redis"][index];
      logger.error(
        `[SERVICE VALIDATION] ${serviceName} validation failed: ${result.reason}`,
      );
    }
  });
  if (hasFailures) {
    throw new AppError(
      "One or more services failed validation. Check logs for details.",
    );
  }
  logger.info("[SERVICE VALIDATION] All services validated successfully");
}

async function validateDb(): Promise<void> {
  try {
    logger.info(`[DB VALIDATION] Checking database connection...`);
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    logger.info(`[DB VALIDATION] Database connection validated successfully`);
  } catch (err: any) {
    logger.error(`[DB VALIDATION] Database connection failed: ${err.message}`);
    throw new AppError(`Database connection failed: ${err.message}`);
  }
}

async function validateS3(): Promise<void> {
  try {
    logger.info(
      `[S3 VALIDATION] Checking bucket access - bucket: ${process.env.AWS_S3_BUCKET}`,
    );

    await S3.send(
      new HeadBucketCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
      }),
    );

    logger.info(`[S3 VALIDATION] Bucket access validated successfully.`);
  } catch (err: any) {
    logger.error(`[S3 VALIDATION] Bucket validation failed: ${err.message}`);

    if (err.name === "NotFound") {
      throw new AppError(
        `S3 bucket '${process.env.AWS_S3_BUCKET}' does not exist`,
      );
    } else if (err.name === "Forbidden") {
      throw new AppError(
        `No permission to access S3 bucket '${process.env.AWS_S3_BUCKET}'`,
      );
    } else {
      throw new AppError(`S3 validation failed: ${err.message}`);
    }
  }
}

async function validateSES(): Promise<void> {
  try {
    logger.info(`[SES VALIDATION] Checking SES access...`);

    await ses.send(new GetSendQuotaCommand({}));

    logger.info(`[SES VALIDATION] SES access validated successfully`);
  } catch (err: any) {
    logger.error(`[SES VALIDATION] SES access failed: ${err.message}`);
    throw new AppError(`SES validation failed: ${err.message}`);
  }
}

async function validateRedis(): Promise<void> {
  try {
    logger.info(`[REDIS VALIDATION] Checking redis access...`);
    await redisClient.connect();

    redisClient.on("connect", () => {
      logger.info(` REDIS access validated successfully`);
    });

    redisClient.on("error", (err) => {
      logger.error(`[REDIS VALIDATION] Redis failed to connect ${err.message}`);
      throw new AppError(err, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });

    logger.info(`[REDIS VALIDATION] redis access validated successfully`);
  } catch (err: any) {
    logger.error(`[REDIS VALIDATION] redis access failed: ${err.message}`);
    throw new AppError( 
      `REDIS validation failed: ${err.message}`,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
}
