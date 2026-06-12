import { logger } from "../../lib/logger";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import {
  AuthProvider,
  Prisma,
  User,
  USER_ROLE,
} from "../../../generated/prisma/client";
import { AppError } from "../errors/AppError";
import { ERROR_MESSAGES, HTTP_STATUS } from "../constant/constants";
import { validateServices } from "../../modules/ServiceValidation/validate.service";
import crypto from "crypto";



export async function startServer() {
    try {
      await validateServices();
    } catch(err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error(`Failed to start server: ${error.message}`)
      process.exit(1)
    }
}

export async function hashPassword(password: string) {
  let round = 10;
  if (!process.env.SALT) {
    logger.warn(`[REGISTER] SALT env var missing - using default value`);
  } else {
    round = parseInt(process.env.SALT);
  }

  // encrypt the password then save.
  password = await bcrypt.hash(password, round);
  return password;
}

export async function hashToken(token: string) {
  let round = 15;
  if (!process.env.SALT) {
    logger.warn(`[REGISTER] SALT env var missing - using default value`);
  } else {
    round = parseInt(process.env.SALT);
  }

  // encrypt the password then save.
  token = await bcrypt.hash(token, round);
  return token;
}

export async function checkToken(token: string, hToken: string) {
  const result = await bcrypt.compare(token, hToken);
  return result;
}

export async function checkPassword(userPassword: string, dbPassword: string) {
  const result = await bcrypt.compare(userPassword, dbPassword);
  return result;
}

export async function generateAccToken(user: User | Prisma.UserCreateInput, refreshId: string) {
  // this access token should contain the refresh token Id. so that we will have the refresh token as well as the id.
  // while checking we can find the refresh token by Id. then compare the encrypted token with raw token.
  // then check the expiration | revoked thing

  try {
    const payload: object = {
      userId: user.id,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider,
      refreshId: refreshId,
      type: "ACCESS",
    };

    const key = process.env.ACCESS_TOKEN_SECRET;
    const duration = process.env.ACCESS_TOKEN_EXPIRY;

    if (!key || !duration) {
      logger.error(`Unable to access the environment variables. key: ${key}`);
      throw new AppError(
        ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    const result = jwt.sign(payload, key, {
      expiresIn: duration as SignOptions["expiresIn"],
    });

    return result;
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    const statusCode = (error as { statusCode?: number }).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    throw new AppError(
      err.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      statusCode,
    );
  }
}

export async function generateRefToken(user: User | Prisma.UserCreateInput) {
  try {
    const payload: object = {
      userId: user.id,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider,
      type: "REFRESH",
    };

    const key = process.env.REFRESH_TOKEN_SECRET;
    const duration = process.env.REFRESH_TOKEN_EXPIRY;

    if (!key || !duration) {
      logger.error(`Unable to access the environment variables. key: ${key}`);
      throw new AppError(
        ERROR_MESSAGES.INVALID_ENV,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    const result = jwt.sign(payload, key, {
      expiresIn: duration as SignOptions["expiresIn"],
    });

    return result;
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    const statusCode = (err as { statusCode?: number }).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    throw new AppError(
      error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      statusCode,
    );
  }
}

export async function generateVerifyToken(user: User | Prisma.UserCreateInput, ) {
  // this access token should contain the refresh token Id. so that we will have the refresh token as well as the id.
  // while checking we can find the refresh token by Id. then compare the encrypted token with raw token.
  // then check the expiration | revoked thing

  try {
    const payload: object = {
      userId: user.id,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider,
      type: "VERIFY",
    };

    const key = process.env.VERIFY_TOKEN_SECRET;
    const duration = process.env.VERIFY_TOKEN_EXPIRY;

    if (!key || !duration) {
      logger.error(`Unable to access the environment variables. key: ${key}`);
      throw new AppError(
        ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    const result = jwt.sign(payload, key, {
      expiresIn: duration as SignOptions["expiresIn"],
    });

    return result;
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    const statusCode = (err as { statusCode?: number }).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    throw new AppError(
      error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      statusCode,
    );
  }
}

export function convertRole(role: string): USER_ROLE {
  if (role === USER_ROLE.ADMIN.toString()) {
    return USER_ROLE.ADMIN;
  }
  return USER_ROLE.USER;
}

export function convertAuthProvider(authProvider: string): AuthProvider {
  if (authProvider === AuthProvider.GOOGLE.toString()) {
    return AuthProvider.GOOGLE;
  } else if (authProvider === AuthProvider.META.toString()) {
    return AuthProvider.META;
  }
  return AuthProvider.LOCAL;
}

export function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}


export function buildOtpDigitsHtml(otp: string): string {
  return otp
    .split("")
    .map(
      (digit) =>
        `<div class="otp-digit">${digit}</div>`
    )
    .join("");
}

