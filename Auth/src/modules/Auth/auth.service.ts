import { Request } from "express";
import { Prisma, User } from "../../../generated/prisma/client";
import { AuthProvider } from "../../../generated/prisma/enums";
import { ERROR_MESSAGES, HTTP_STATUS } from "../../common/constant/constants";
import { AppError } from "../../common/errors/AppError";
import {
  checkPassword,
  checkToken,
  convertAuthProvider,
  convertRole,
  generateAccToken,
  generateRefToken,
  hashPassword,
  hashToken,
} from "../../common/utils/utils";
import { logger } from "../../lib/logger";
import { prisma } from "../../lib/prisma";
import { customPayload } from "../../middleware/authenticate";
import { userExists } from "../User/user.service";
import { ReqUser } from "../../common/types/express";

export async function loginUser(user: {
  email: string;
  password: string;
}): Promise<{
  refToken: string | null;
  accToken: string | null;
}> {
  let refToken = null;
  let accToken = null;

  let found = await userExists(user.email, "", "");

  if (!found) {
    throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.BAD_REQUEST);
  }

  if (found.authProvider === AuthProvider.LOCAL) {
    if (!found.password) {
      throw new AppError(
        ERROR_MESSAGES.USER_MISSING_FIELDS,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    let result = await checkPassword(user.password, found.password);

    if (!result) {
      throw new AppError(
        ERROR_MESSAGES.USER_INCORRECT_PASSSWORD,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // generate the token and refresh token. return into the cookies.
    refToken = await generateRefToken(found);

    let { token, id } = await storeRefreshToken(refToken, found);

    if (!token || !id) {
      logger.error(`No refresh-token and Id is generated.`);
      throw new AppError(
        ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    accToken = await generateAccToken(found, id);
  }
  return {
    refToken,
    accToken,
  };
}

export async function storeRefreshToken(
  token: string,
  user: User | Prisma.UserCreateInput,
): Promise<{
  token: string | null;
  id: string | null;
}> {
  logger.info(`[AUTHENTICATE] Storing refresh token for user ${user.id}`);

  // Find all existing tokens for user
  const existingTokens = await prisma.token.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Revoke all active tokens
  const activeTokens = existingTokens.filter((t) => !t.isRevoked);
  if (activeTokens.length > 0) {
    await prisma.token.updateMany({
      where: {
        userId: user.id,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });
    logger.info(
      `[AUTHENTICATE] Revoked ${activeTokens.length} active token(s) for user ${user.id}`,
    );
  }

  // Delete old revoked tokens (older than 7 days)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const deleteResult = await prisma.token.deleteMany({
    where: {
      userId: user.id,
      isRevoked: true,
      createdAt: {
        lt: oneHourAgo,
      },
    },
  });
  if (deleteResult.count > 0) {
    logger.info(
      `[AUTHENTICATE] Deleted ${deleteResult.count} old revoked token(s) for user ${user.id}`,
    );
  }

  // Create new token
  const tokenResult = await prisma.token.create({
    data: {
      token: await hashToken(token),
      user: {
        connect: {
          id: user.id,
        },
      },
    },
  });
  logger.info(
    `[AUTHENTICATE] Created new refresh token ${tokenResult.id} for user ${user.id}`,
  );

  return {
    token,
    id: tokenResult.id,
  };
}

export async function getRefToken(id: string) {
  return await prisma.token.findUnique({
    where: {
      id: id,
    },
  });
}

export async function getRefTokenByUserID(userId: string) {
  logger.info(
    `[AUTHENTICATE] Retrieving active refresh token for user ${userId}`,
  );

  const token = await prisma.token.findFirst({
    where: {
      userId: userId,
      isRevoked: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (token) {
    logger.info(
      `[AUTHENTICATE] Found active token ${token.id} for user ${userId}`,
    );
  } else {
    logger.warn(`[AUTHENTICATE] No active token found for user ${userId}`);
  }

  return token;
}

export async function revokeToken(id: string) {
  logger.info(`[AUTHENTICATE] Revoking token ${id}`);

  const result = await prisma.token.update({
    where: {
      id: id,
    },
    data: {
      isRevoked: true,
    },
  });

  logger.info(
    `[AUTHENTICATE] Successfully revoked token ${id} for user ${result.userId}`,
  );
  return result;
}

// write a rotate method. find the refresh token by Id. and then generate both new ref token and acc token.
export async function rotateToken(
  oldToken: string,
  refToken: customPayload,
): Promise<{
  newRef: string;
  newAcc: string;
}> {
  logger.info(`[AUTHENTICATE] Rotating token for user ${refToken.userId}`);

  let refResult = await getRefTokenByUserID(refToken.userId);

  if (!refResult) {
    logger.error(
      `[AUTHENTICATE] No active token found for rotation for user ${refToken.userId}`,
    );
    throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  if (!(await checkToken(oldToken, refResult.token))) {
    logger.error(
      `[AUTHENTICATE] Token mismatch during rotation for user ${refToken.userId}`,
    );
    throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  if (refResult.isRevoked) {
    logger.error(
      `[AUTHENTICATE] Attempted to rotate revoked token for user ${refToken.userId}`,
    );
    throw new AppError(
      ERROR_MESSAGES.INVALID_CREDENTIALS,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  let user: Prisma.UserCreateInput = {
    firstname: "",
    id: refToken.userId,
    email: refToken.email,
    role: convertRole(refToken.role),
    authProvider: convertAuthProvider(refToken.authProvider),
  };

  let newRef = await generateRefToken(user);

  let { token, id } = await storeRefreshToken(newRef, user);

  if (!token || !id) {
    logger.error(
      `[AUTHENTICATE] Failed to generate new refresh token for user ${refToken.userId}`,
    );
    throw new AppError(
      ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  let newAcc = await generateAccToken(user, id);
  logger.info(
    `[AUTHENTICATE] Successfully rotated tokens for user ${refToken.userId}`,
  );

  return {
    newRef,
    newAcc,
  };
}

export async function logoutUser(user: ReqUser): Promise<void> {
  logger.info(`[LOGOUT] Logging out user ${user.userId}`);

  let existingTokens = await prisma.token.findMany({
    where: {
      userId: user.userId,
    },
  });

  // Revoke all active tokens
  const activeTokens = existingTokens.filter((t) => !t.isRevoked);
  if (activeTokens.length > 0) {
    await prisma.token.updateMany({
      where: {
        userId: user.userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });
    logger.info(
      `[LOGOUT] Revoked ${activeTokens.length} active token(s) for user ${user.userId}`,
    );
  } else {
    logger.info(`[LOGOUT] No active tokens found for user ${user.userId}`);
  }

  // Delete all revoked tokens immediately
  const deleteResult = await prisma.token.deleteMany({
    where: {
      userId: user.userId,
      isRevoked: true,
    },
  });
  if (deleteResult.count > 0) {
    logger.info(
      `[LOGOUT] Deleted ${deleteResult.count} revoked token(s) for user ${user.userId}`,
    );
  }

  logger.info(`[LOGOUT] User ${user.userId} logged out successfully`);
}

export async function meDetails(
  userId: string,
): Promise<Omit<User, "password" | "id">> {
  logger.info(`[ME] Retrieving details for user ${userId}`);

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    omit: {
      password: true,
      id: true,
    },
  });

  if (!user) {
    logger.error(`[ME] User ${userId} not found in database`);
    throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  logger.info(`[ME] Successfully retrieved details for user ${userId}`);
  return user;
}

export async function resetPassword(
  oldPassword: string,
  newPassword: string,
  user: User,
): Promise<Omit<User, "password">> {
  logger.info(`[PASSWORD_RESET] Attempting password reset for user ${user.id}`);

  if (!user.password) {
    logger.error(
      `[PASSWORD_RESET] User ${user.id} has no password (auth provider: ${user.authProvider})`,
    );
    throw new AppError(
      ERROR_MESSAGES.USER_PASSWORD_REQUIRED,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const isPasswordValid = await checkPassword(oldPassword, user.password);
  if (!isPasswordValid) {
    logger.error(
      `[PASSWORD_RESET] Old password verification failed for user ${user.id}`,
    );
    throw new AppError(
      ERROR_MESSAGES.USER_INCORRECT_PASSSWORD,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  // Update password
  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: await hashPassword(newPassword),
    },
    omit: {
      password: true,
    },
  });
  logger.info(
    `[PASSWORD_RESET] Password updated successfully for user ${user.id}`,
  );

  // Revoke all active tokens for security (force re-login)
  const revokeResult = await prisma.token.updateMany({
    where: {
      userId: user.id,
      isRevoked: false,
    },
    data: {
      isRevoked: true,
    },
  });
  if (revokeResult.count > 0) {
    logger.info(
      `[PASSWORD_RESET] Revoked ${revokeResult.count} active token(s) for user ${user.id}`,
    );
  }

  logger.info(`[PASSWORD_RESET] Password reset completed for user ${user.id}`);
  return updatedUser;
}
