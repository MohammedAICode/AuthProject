import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AppError } from "../common/errors/AppError";
import { ERROR_MESSAGES, HTTP_STATUS } from "../common/constant/constants";
import { logger } from "../lib/logger";
import { getRefToken, rotateToken } from "../modules/Auth/auth.service";
import { checkToken } from "../common/utils/utils";
import { ReqUser } from "../common/types/express";

// type JwtPayload e = {
//   authProvider: string;
//   email: string;
//   refreshId: string;
//   role: string;
//   type: string;
//   userId: string;
//   exp: Number;
//   iat: Number;
// };

export interface customPayload extends JwtPayload {
  authProvider: string;
  email: string;
  refreshId: string;
  role: string;
  type: string;
  userId: string;
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    let refToken = req.cookies.refreshToken;
    let accToken = req.cookies.accessToken;
    let verifyToken = req.cookies.verify;

    verifyToken
      ? logger.info(
          `[AUTHENTICATE] verify token is present in the cookies. verify: ${verifyToken}`,
        )
      : logger.info(
          `[AUTHENTICATE] Tokens present - Access: ${!!accToken}, Refresh: ${!!refToken}`,
        );

    let accKey = process.env.ACCESS_TOKEN_SECRET;
    let refKey = process.env.REFRESH_TOKEN_SECRET;

    if (!accKey || !refKey) {
      throw new AppError(
        ERROR_MESSAGES.INVALID_ENV,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    if (refToken && accToken) {
      logger.info(`[AUTHENTICATE] Verifying access token`);
      let decodeAcc: customPayload | null = null;

      try {
        // valid / non-expired access token. no rotation.
        decodeAcc = jwt.verify(accToken, accKey) as customPayload;
        logger.info(
          `[AUTHENTICATE] Access token verified for user ${decodeAcc.userId}`,
        );

        let refResult = await getRefToken(decodeAcc.refreshId);

        if (!refResult) {
          logger.error(
            `[AUTHENTICATE] No refresh token found in DB for refreshId ${decodeAcc.refreshId}`,
          );
          throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
        }

        if (refResult.isRevoked) {
          logger.error(
            `[AUTHENTICATE] Refresh token ${refResult.id} is revoked for user ${decodeAcc.userId}`,
          );
          throw new AppError(
            ERROR_MESSAGES.REFRESH_TOKEN_REVOKED,
            HTTP_STATUS.FORBIDDEN,
          );
        }

        let match = await checkToken(refToken, refResult.token);

        if (!match) {
          logger.error(`[AUTHENTICATE] Token does not matches`);
          throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
        }

        logger.info(
          `[AUTHENTICATE] Authentication successful for user ${decodeAcc.userId}`,
        );
        attactUserToRequest(decodeAcc, req);
        next();
        return;
      } catch (err: any) {
        if (err.name === "TokenExpiredError") {
          logger.warn(
            `[AUTHENTICATE] Access token expired, attempting rotation`,
          );
          let decodeRef = jwt.verify(refToken, refKey) as customPayload;
          logger.info(
            `[AUTHENTICATE] Rotating tokens for user ${decodeRef.userId}`,
          );
          let { newRef, newAcc } = await rotateToken(refToken, decodeRef);

          res.clearCookie("accessToken");
          res.clearCookie("refreshToken");
          res.cookie("accessToken", newAcc, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 15 * 60 * 1000, // 15 minutes
          });
          res.cookie("refreshToken", newRef, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });
          logger.info(
            `[AUTHENTICATE] Token rotation successful for user ${decodeRef.userId}`,
          );
          attactUserToRequest(decodeRef, req);
          next();
          return;
        } else {
          logger.error(
            `[AUTHENTICATE] Token verification failed: ${err.message}`,
          );
          throw new AppError(
            ERROR_MESSAGES.UNAUTHORIZED,
            HTTP_STATUS.UNAUTHORIZED,
          );
        }
      }
    } else if (refToken && !accToken) {
      logger.info(
        `[AUTHENTICATE] Only refresh token present, verifying and rotating`,
      );
      let decodeRef: customPayload = jwt.verify(
        refToken,
        refKey,
      ) as customPayload;

      logger.info(
        `[AUTHENTICATE] Refresh token verified for user ${decodeRef.userId}`,
      );

      let { newRef, newAcc } = await rotateToken(refToken, decodeRef);

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.cookie("accessToken", newAcc, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
      });
      res.cookie("refreshToken", newRef, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      logger.info(
        `[AUTHENTICATE] New tokens issued for user ${decodeRef.userId}`,
      );
      attactUserToRequest(decodeRef, req);
      next();
      return;
    } else if (verifyToken) {
      let decodeVerify: customPayload = jwt.verify(
        verifyToken,
        accKey,
      ) as customPayload;

      const isVerify = req.headers["x-auth-verify"];
      if (!isVerify) {
        throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
      }

      attactUserToRequest(decodeVerify, req);
      next();
    } else {
      logger.error(`[AUTHENTICATE] No valid tokens provided`);
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      logger.warn(`[AUTHENTICATE] Token expired: ${err.message}`);
    } else {
      logger.error(`[AUTHENTICATE] Auth error (${err.name}): ${err.message}`);
    }
    return res
      .status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({
        error: true,
        data: null,
        message: err.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
  }
}

// authProvider ='LOCAL'
// email ='zahoormohammed@mail.com'
// refreshId ='4a03da61-8ebd-4760-8d57-58e4e9d64ff0'
// role ='USER'
// type ='ACCESS'
// userId ='2977909c-68b3-4c45-a6cd-7dde3293f235'
// exp =1774434578
// iat =1774433678

function attactUserToRequest(userDetails: customPayload, req: Request) {
  // if (!req.user) {
  //   throw new AppError(`No user object found.`);
  // }

  let reqUser: ReqUser = {
    email: userDetails.email,
    authProvider: userDetails.authProvider,
    role: userDetails.role,
    userId: userDetails.userId,
  };

  req.user = reqUser;
}
