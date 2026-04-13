import { SendEmailCommand } from "@aws-sdk/client-ses";
import { logger } from "../../lib/logger";
import { ses } from "../../lib/ses";

type EmailData = {
  to: [string];
  subject: string;
  body: string;
};

export async function sendEmail(emailData: EmailData) {
  try {
    logger.info(`[SES EMAIL] Sending email - to: ${emailData.to.join(', ')}, subject: "${emailData.subject}"`);
    
    const command = new SendEmailCommand({
      Source: process.env.SES_FROM_EMAIL!,
      Destination: {
        ToAddresses: emailData.to,
      },
      Message: {
        Subject: { Data: emailData.subject },
        Body: {
          Html: {
            Data: emailData.body,
          },
        },
      },
    });

    const result = await ses.send(command);
    
    logger.info(`[SES EMAIL] Email sent successfully - MessageId: ${result.MessageId}, to: ${emailData.to.join(', ')}`);
    
    return result;
  } catch (error: any) {
    logger.error(`[SES EMAIL] Failed to send email - to: ${emailData.to.join(', ')}, subject: "${emailData.subject}", error: ${error.message}`);
    throw error;
  }
}
