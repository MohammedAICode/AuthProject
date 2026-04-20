import { User } from "../../../generated/prisma/client";
import { eventBus } from "../../lib/eventBus";
import { sendEmail } from "../../modules/Email/email.service";
import { loadTemplate } from "../../modules/Email/template.util";
import { logger } from "../../lib/logger";
import { EMAIL_MESSAGES } from "../constant/constants";
import { buildOtpDigitsHtml, generateOTP } from "../utils/utils";
import { redisClient } from "../../lib/redis";

export const EVENT_CONSTANTS = {
  USER_CREATE: "user-create",
  USER_FORGET_PASSWORD: "forget-password",
};

eventBus.on(EVENT_CONSTANTS.USER_CREATE, sendActivationMail);
eventBus.on(EVENT_CONSTANTS.USER_FORGET_PASSWORD, sendForgetPasswordMail);

async function sendActivationMail(user: Omit<User, "password">) {
  try {
    logger.info(
      `[EVENT USER_CREATE] Processing activation email - userId: ${user.id}, email: ${user.email}`,
    );

    const otp = generateOTP();

    const link = `${process.env.UIOrigin || "http://localhost:4000"}/verify?email=${user.email}&otp=${otp}`;

    let body = loadTemplate("activation.html", {
      NAME: user.firstname + " " + user.lastname,
      OTP_DIGITS_HTML: buildOtpDigitsHtml(otp),
      EXPIRY_MINUTES: "10",
      ACTIVATION_LINK: link,
    });

    redisClient.set(user.id, otp, {
      EX: 10 * 60 ,
    });

    await sendEmail({
      to: [user.email],
      body: body,
      subject: "Activate Your Account - Welcome!",
    });

    logger.info(
      `[EVENT USER_CREATE] ${EMAIL_MESSAGES.ACTIVATION_EMAIL_SENT} - userId: ${user.id}, email: ${user.email}`,
    );
  } catch (error: any) {
    logger.error(
      `[EVENT USER_CREATE] ${EMAIL_MESSAGES.ACTIVATION_EMAIL_FAILED} - userId: ${user.id}, email: ${user.email}, error: ${error.message}`,
    );
  }
}

async function sendForgetPasswordMail(user: Omit<User, "password">) {
  try {
    logger.info(
      `[EVENT FORGET_PASSWORD] Processing activation email - email: ${user.email}`,
    );

    const otp = generateOTP();

    const link = `${process.env.UIOrigin || "http://localhost:4000"}/verify?email=${user.email}&otp=${otp}`;

    let body = loadTemplate("reset.html", {
      NAME: user.firstname + " " + user.lastname,
      OTP_DIGITS_HTML: buildOtpDigitsHtml(otp),
      EXPIRY_MINUTES: "10",
      RESET_LINK: link,
    });

    redisClient.set(user.id, otp, {
      EX: 10 * 60,
    });

    await sendEmail({
      to: [user.email],
      body: body,
      subject: "Reset your password - Auth System",
    });

    logger.info(
      `[EVENT FORGET_PASSWORD] ${EMAIL_MESSAGES.FORGET_EMAIL_SENT} - userId: ${user.id}, email: ${user.email}`,
    );
  } catch (error: any) {
    logger.error(
      `[EVENT FORGET_PASSWORD] ${EMAIL_MESSAGES.FORGET_EMAIL_FAILED} - userId: ${user.id},  email: ${user.email}, error: ${error.message}`,
    );
  }
}
