import { User } from "../../../generated/prisma/client";
import { eventBus } from "../../lib/eventBut";
import { sendEmail } from "../../modules/Email/email.service";
import { loadTemplate } from "../../modules/Email/template.util";
import { logger } from "../../lib/logger";
import { EMAIL_MESSAGES } from "../constant/constants";

export const EVENT_CONSTANTS = {
  USER_CREATE: "user-create",
};

eventBus.on(EVENT_CONSTANTS.USER_CREATE, sendActivationMail);

async function sendActivationMail(user: Omit<User, "password">) {
  try {
    logger.info(`[EVENT USER_CREATE] Processing activation email - userId: ${user.id}, email: ${user.email}`);
    
    const activationLink = `${process.env.APP_URL || 'http://localhost:4000'}/api/v1/auth/activate/${user.id}`;
    
    let body = loadTemplate("activation.html", {
      activation_link: activationLink,
    });

    await sendEmail({
      to: [user.email],
      body: body,
      subject: "Activate Your Account - Welcome!",
    });
    
    logger.info(`[EVENT USER_CREATE] ${EMAIL_MESSAGES.ACTIVATION_EMAIL_SENT} - userId: ${user.id}, email: ${user.email}`);
  } catch (error: any) {
    logger.error(`[EVENT USER_CREATE] ${EMAIL_MESSAGES.ACTIVATION_EMAIL_FAILED} - userId: ${user.id}, email: ${user.email}, error: ${error.message}`);
  }
}
