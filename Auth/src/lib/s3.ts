import { S3Client } from "@aws-sdk/client-s3";
import { logger } from "./logger";

if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
  logger.error('[S3 INIT] Missing required AWS environment variables: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET');
  throw new Error('Missing required AWS S3 configuration');
}

logger.info(`[S3 INIT] Initializing S3 client - region: ${process.env.AWS_REGION}, bucket: ${process.env.AWS_S3_BUCKET}`);

export const S3 = new S3Client({
  region: process.env.AWS_REGION!,

  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

logger.info('[S3 INIT] S3 client initialized successfully');
