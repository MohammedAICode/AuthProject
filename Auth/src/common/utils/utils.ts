import { logger } from "../../lib/logger";
import bcrypt from "bcrypt";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import {
  AuthProvider,
  Prisma,
  User,
  USER_ROLE,
} from "../../../generated/prisma/client";
import { AppError } from "../errors/AppError";
import { ERROR_MESSAGES, HTTP_STATUS } from "../constant/constants";
import { storeRefreshToken } from "../../modules/Auth/auth.service";
import { validateServices } from "../../modules/ServiceValidation/validate.service";
import crypto from "crypto";



export async function startServer() {
    try {
      await validateServices();
    } catch(err: any) {
      logger.error(`Failed to start server: ${err.message}`)
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
  let result = await bcrypt.compare(token, hToken);
  return result;
}

export async function checkPassword(userPassword: string, dbPassword: string) {
  let result = await bcrypt.compare(userPassword, dbPassword);
  return result;
}

export async function generateAccToken(user: User | Prisma.UserCreateInput, refreshId: string) {
  // this access token should contain the refresh token Id. so that we will have the refresh token as well as the id.
  // while checking we can find the refresh token by Id. then compare the encrypted token with raw token.
  // then check the expiration | revoked thing

  try {
    let payload: {} = {
      userId: user.id,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider,
      refreshId: refreshId,
      type: "ACCESS",
    };

    let key = process.env.ACCESS_TOKEN_SECRET;
    let duration = process.env.ACCESS_TOKEN_EXPIRY;

    if (!key || !duration) {
      logger.error(`Unable to access the environment variables. key: ${key}`);
      throw new AppError(
        ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    let result = jwt.sign(payload, key, {
      expiresIn: duration as SignOptions["expiresIn"],
    });

    return result;
  } catch (err: any) {
    throw new AppError(
      err.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
}

export async function generateRefToken(user: User | Prisma.UserCreateInput) {
  try {
    let payload: {} = {
      userId: user.id,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider,
      type: "REFRESH",
    };

    let key = process.env.REFRESH_TOKEN_SECRET;
    let duration = process.env.REFRESH_TOKEN_EXPIRY;

    if (!key || !duration) {
      logger.error(`Unable to access the environment variables. key: ${key}`);
      throw new AppError(
        ERROR_MESSAGES.INVALID_ENV,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    let result = jwt.sign(payload, key, {
      expiresIn: duration as SignOptions["expiresIn"],
    });

    return result;
  } catch (err: any) {
    throw new AppError(
      err.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
}

export function convertRole(role: string): USER_ROLE {
  if (role === USER_ROLE.ADMIN.toString()) {
    return USER_ROLE.ADMIN;
  }
  return (role = USER_ROLE.USER);
}

export function convertAuthProvider(authProvider: string): AuthProvider {
  if (authProvider === AuthProvider.GOOGLE.toString()) {
    return (authProvider = AuthProvider.GOOGLE);
  } else if (authProvider === AuthProvider.META.toString()) {
    return (authProvider = AuthProvider.META);
  }
  return (authProvider = AuthProvider.LOCAL);
}

export function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}


