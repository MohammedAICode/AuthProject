import type { userLoginInfo } from "../utils/utils";
import api from "./axios";

export const loginApi = async (loginData: userLoginInfo) => {
  return api.post("/auth/login", loginData);
};

export const signupApi = async (formData: FormData) => {
  return api.post("user/register", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const meApi = async () => {
  return api.get("/auth/me", {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const logoutApi = async () => {
  return api.get("/auth/logout");
};

export const verifyApi = async (email: string, otp: string) => {
  return api.get(`/auth/verify?email=${email}&otp=${otp}`);
};

export const passwordSetupApi = async (
  password: string,
  confirmPassword: string,
) => {
  return api.post(
    "auth/forget",
    {
      password,
      confirmPassword,
    },
    {
      headers: {
        "x-auth-verify": true,
      },
    },
  );
};

export const forgetPassApi = async (email: string) => {
  return api.get(`auth/forget-password?email=${email}`);
};
