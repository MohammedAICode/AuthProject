import type { userLoginInfo } from "../Pages/Login";
import api from "./axios";

export const loginApi = async (loginData: userLoginInfo) => {
  return api.post("/auth/login", loginData);
};

export const signupApi = async (formData: FormData) => {
  return api.post("auth/signup", formData, {
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


