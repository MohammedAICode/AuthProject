import { S3 } from "../../lib/s3";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";
import { logger } from "../../lib/logger";
import { AppError } from "../../common/errors/AppError";
import { HTTP_STATUS } from "../../common/constant/constants";

export async function uploadProfileImgToS3(
  file: Express.Multer.File,
  userId: string,
) {
  try {
    logger.info(
      `[S3 UPLOAD] Starting upload - userId: ${userId}, filename: ${file.originalname}, size: ${file.size} bytes, mimetype: ${file.mimetype}`,
    );

    const ext = file.originalname.split(".").pop();
    const key = `profile/${userId}/${uuid()}.${ext}`;

    logger.info(
      `[S3 UPLOAD] Uploading to bucket: ${process.env.AWS_S3_BUCKET}, key: ${key}`,
    );

    const result = await S3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    logger.info(`[S3 UPLOAD] Upload successful - userId: ${userId}, key: ${key}, ETag: ${result.ETag}`);

    return key;
  } catch (error: any) {
    logger.error(
      `[S3 UPLOAD] Upload failed - userId: ${userId}, filename: ${file.originalname}, error: ${error.message}`,
    );
    throw new AppError(
      `Failed to upload profile image to S3`,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
}

export async function getProfileImageUrl(key: string): Promise<string> {
  try {
    logger.info(`[S3 PRESIGN] Generating signed URL - key: ${key}, expiresIn: 3600s`);

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    });

    const url = await getSignedUrl(S3, command, {
      expiresIn: 3600,
    });

    logger.info(
      `[S3 PRESIGN] Signed URL generated successfully - key: ${key}`,
    );

    return url;
  } catch (error: any) {
    logger.error(
      `[S3 PRESIGN] Failed to generate signed URL - key: ${key}, error: ${error.message}`,
    );
    throw new AppError(
      `Failed to generate profile image URL`,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
}

export async function deleteProfileImg(imgKey: string) {
  try {
    logger.info(`[S3 DELETE] Deleting object from bucket - key: ${imgKey}`);

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: imgKey,
    });

    const result = await S3.send(command);

    logger.info(
      `[S3 DELETE] Delete successful - key: ${imgKey}, versionId: ${result.VersionId || 'N/A'}`,
    );
  } catch (err: any) {
    logger.error(
      `[S3 DELETE] Failed to delete object - key: ${imgKey}, error: ${err.message}`,
    );
    throw new AppError(
      `Failed to delete old profile image from S3`,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
}
