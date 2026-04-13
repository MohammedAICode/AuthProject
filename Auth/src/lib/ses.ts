import { SESClient } from "@aws-sdk/client-ses";

export const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// export async function sendEmail() {
//     logger.info(`[SES] Sending the mail using the SES.`)
//   const command = new SendEmailCommand({
//     Source: process.env.SES_FROM_EMAIL!,
//     Destination: {
//       ToAddresses: ["mohammedwavity@gmail.com"],
//     },
//     Message: {
//       Subject: { Data: "SES Test Email" },
//       Body: {
//         Html: {
//           Data: "<h2>Email working from AWS SES 🚀</h2>",
//         },
//       },
//     },
//   });

//   return ses.send(command);
// }

// we need 3 types of messages
// 1. Activation mail
// 2. Reset password mail
// 3. Successfull registration mail

// for now we can't change the to email as well. but we need to create the type to send the
