export type ReqUser = {
  userId: string;
  email: string;
  role: string;
  authProvider: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: ReqUser;
    }
  }
}
