import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { AppError } from "../common/errors/AppError";
import { ERROR_MESSAGES, HTTP_STATUS } from "../common/constant/constants";
import { createUserInDB, userExists } from "../modules/User/user.service";
import { AuthProvider } from "../../generated/prisma/client";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) {
          return done(
            new AppError(
              ERROR_MESSAGES.USER_NOT_FOUND,
              HTTP_STATUS.BAD_REQUEST,
            ),
          );
        }

        let userResult: any = await userExists(email, null, null);

        if (!userResult) {
          const data = {
            firstname: profile.name?.givenName || "User",
            lastname: profile.name?.familyName || "",
            email: email,
            authProvider: AuthProvider.GOOGLE,
            isActive: true,
          };

          userResult = await createUserInDB(data);
        }

        return done(null, userResult);
      } catch (err: any) {
        return done(err as Error);
      }
    },
  ),
);

export default passport;
