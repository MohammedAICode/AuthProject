import { NextFunction, Request, Response } from "express";
import {
  AUTH_MESSAGES,
  ERROR_MESSAGES,
  HTTP_STATUS,
  USER_MESSAGES,
} from "../../common/constant/constants";
import {
  loginUser,
  logoutUser,
  meDetails,
  resetPassword,
  storeRefreshToken,
  updatePass,
  verifyUserEmail,
} from "./auth.service";
import { logger } from "../../lib/logger";
import { AppError } from "../../common/errors/AppError";
import { ReqUser } from "../../common/types/express";
import { userExists } from "../User/user.service";
import { eventBus } from "../../lib/eventBus";
import { EVENT_CONSTANTS } from "../../common/EventListener/Listener";
import { error } from "node:console";
import passport from "passport";
import { generateAccToken, generateRefToken } from "../../common/utils/utils";
// import { sendEmail } from "../../lib/simpleEmailService";

export async function login(req: Request, res: Response) {
  try {
    let {
      email, // extend this to support for the username
      password,
    } = req.body;

    if (!email || !password) {
      throw new AppError(
        ERROR_MESSAGES.USER_MISSING_FIELDS,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // sendEmail();

    let { refToken, accToken } = await loginUser({
      email,
      password,
    });

    if (!refToken || !accToken) {
      throw new AppError(
        ERROR_MESSAGES.INVALID_CREDENTIALS,
        HTTP_STATUS.BAD_REQUEST,
      );
    }
    res.cookie("accessToken", accToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie("refreshToken", refToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(HTTP_STATUS.OK).json({
      error: false,
      data: email,
      message: AUTH_MESSAGES.LOGIN_SUCCESS,
    });
  } catch (err: any) {
    logger.error(`[LOGIN] ERROR OCCURED, while login err: ${err}`);
    return res
      .status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({
        error: true,
        data: null,
        message: err.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
  }
}

export async function logout(req: Request, res: Response) {
  logger.info(
    `[LOGOUT] Request to logout the user with email: ${req.user?.email}`,
  );
  try {
    let user: ReqUser | undefined = req.user;

    if (!user) {
      logger.error(
        `[LOGOUT] User does not exists in the requesting object to logout.`,
      );
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }
    // this will revoke all the existing tokens.
    logoutUser(user);

    // remove from the cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    logger.info(`[LOGOUT] removed the tokens. logout successful.`);
    return res.status(HTTP_STATUS.OK).json({
      error: false,
      data: user.email,
      message: ERROR_MESSAGES.USER_LOGOUT_SUCCESS,
    });
  } catch (err: any) {
    logger.error(`[LOGOUT] Error occured: ${err}`);
    return res
      .status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({
        error: true,
        data: null,
        message: ERROR_MESSAGES.USER_LOGOUT_FAILED,
      });
  }
}

export async function me(req: Request, res: Response) {
  logger.info(
    `[ME] Request to get /me details for the user : ${req.user?.email}`,
  );
  try {
    let user: ReqUser | undefined = req.user;

    if (!user) {
      logger.info(`[ME] No user found in the requesting object.`);
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    let result = await meDetails(user.userId);

    if (!result) {
      logger.error(`[ME] No user found in the database. ${result}`);
      throw new AppError(
        ERROR_MESSAGES.USER_NOT_FOUND,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    logger.info(`[ME] User found successfully returning in the response.`);
    res.status(HTTP_STATUS.OK).json({
      error: false,
      data: result,
      message: USER_MESSAGES.USER_GET_SUCCESS,
    });
  } catch (err: any) {
    logger.error(`[ME] Error occured: ${err}`);
    return res
      .status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({
        error: true,
        data: null,
        message:
          USER_MESSAGES.USER_GET_FAILED || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
  }
}

export async function reset(req: Request, res: Response) {
  try {
    let { email } = req.params;
    let { newPassword, oldPassword } = req.body;

    let userResult = await userExists(email as string, null, null);

    if (!userResult) {
      throw new AppError(
        ERROR_MESSAGES.USER_NOT_FOUND,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    let result = await resetPassword(oldPassword, newPassword, userResult);

    if (!result) {
      throw new AppError(
        ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      error: false,
      data: result.email,
      message: USER_MESSAGES.USER_UPDATE_SUCCESS,
    });
  } catch (err: any) {
    return res
      .status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({
        error: true,
        data: null,
        message: USER_MESSAGES.USER_UPDATE_FAILED,
      });
  }
}

// check the user-exists in the system.
// if the user exists send the mail. else make the silent closing / logging
// if present send the email using the ses system. with otp. and the link. which will again re-direct to the otp page.
// not required the service method.

export async function forgetPassword(req: Request, res: Response) {
  try {
    const { email } = req.query;
    logger.info(
      `[FORGET_PASSWORD] request to perform the forget password for user: ${email}.`,
    );

    if (!email) {
      logger.error(`[FORGET_PASSWORD] email does not exists.`);
      throw new AppError(
        ERROR_MESSAGES.USER_EMAIL_REQUIRED,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    let result = await userExists(email as string, null, null);

    if (!result) {
      logger.info(
        `[FORGET_PASSWORD] user does not exits in the system, trying to perform forget password`,
      );
    }

    if (result) {
      // create the event
      setImmediate(() => {
        eventBus.emit(EVENT_CONSTANTS.USER_FORGET_PASSWORD, result);
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      error: false,
      data: null,
      message: USER_MESSAGES.USER_FORGET_SUCCESS,
    });
  } catch (err: any) {
    return res
      .status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({
        error: true,
        data: null,
        message: USER_MESSAGES.USER_FORGET_FAILED,
      });
  }
}

// method which get the user. through user Exists.
// then verify the otp. from the redis.
// if matches. generate a short term-jwt token for 10 min to setup the password

export async function verifyOTP(req: Request, res: Response) {
  logger.info(
    `[VERIFY_OTP] Request to verify the user with email: ${req.query.email}, otp:${req.query.otp} `,
  );
  try {
    const { email, otp } = req.query;

    if (!email || !otp) {
      if (!email) logger.error(`[VERIFY_OTP] No email was provided to verify`);

      if (!otp) logger.error(`[VEIRFY_OTP] No OTP was provided to verify`);

      throw new AppError(
        ERROR_MESSAGES.INVALID_REQUEST,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const result = await userExists(email as string, null, null);

    if (!result) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: true,
        data: null,
        message: "user not found in the db",
      });
    }

    let key = await verifyUserEmail(result);

    res.cookie("verify", key, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    return res.status(HTTP_STATUS.OK).json({
      error: false,
      data: null,
      message: "User verify successfully",
    });
  } catch (err: any) {
    return res
      .status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({
        error: true,
        data: null,
        message: USER_MESSAGES.USER_FORGET_FAILED,
      });
  }
}

export async function updatePassword(req: Request, res: Response) {
  try {
    const { password, confirmPassword } = req.body;
    let currUser = req.user;

    if (!currUser) {
      logger.error(`[UPDATE_PASSWORD] current user not found.`);
      throw new AppError(
        ERROR_MESSAGES.USER_NOT_FOUND,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    if (password !== confirmPassword) {
      logger.error(
        `[UPDATE_PASSWORD] password and confirm password. are not matched!`,
      );
      throw new AppError(
        ERROR_MESSAGES.INVALID_REQUEST,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    let userResult = await userExists(currUser.email, null, null);

    if (!userResult) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: true,
        data: null,
        message: "user not found in the db",
      });
    }

    let result = await updatePass(userResult, password);

    res.clearCookie("verify");

    return res.status(HTTP_STATUS.OK).json({
      error: false,
      data: result.email,
      message: USER_MESSAGES.USER_UPDATE_SUCCESS,
    });
  } catch (err: any) {
    return res
      .status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({
        error: true,
        data: null,
        message: USER_MESSAGES.USER_FORGET_FAILED,
      });
  }
}

export const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

export function googleCallBack(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  passport.authenticate("google", { session: false }, async (error, user) => {
    if (error || !user)
      return res.redirect(`${process.env.UIOrigin}/login?error=failed`);

    const refToken = await generateRefToken(user);
    const { id } = await storeRefreshToken(refToken, user);
    const accToken = await generateAccToken(user, id!);

    // Set the same cookies your app uses for auth
    res.cookie("accessToken", accToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie("refreshToken", refToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.redirect(`${process.env.UIOrigin}/`); // Send user back to front-end
  })(req, res, next);
}
