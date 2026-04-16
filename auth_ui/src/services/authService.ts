import { loginApi, logoutApi, meApi } from "../api/authApi";
import type { userLoginInfo } from "../Pages/Login";

export interface apiResponse {
  err: boolean;
  message: string;
  data: any;
}

export async function loginUser(
  loginData: userLoginInfo,
): Promise<apiResponse> {
  try {
    let response = await loginApi(loginData);
    console.log(`login response: ${response}`);
    return {
      err: false,
      message: "data fetched successfully",
      data: response.data,
    };
  } catch (err: any) {
    return {
      err: true,
      message: err.response.data.message,
      data: null,
    };
  }
}

export async function me(): Promise<apiResponse> {
  try {
    let response = await meApi();
    return {
      err: false,
      message: "data fetched successfully",
      data: response.data,
    };
  } catch (err: any) {
    return {
      err: true,
      message: err.response.data.message,
      data: null,
    };
  }
}

export async function logout(): Promise<apiResponse> {
  try {
    let response = await logoutApi();
    return {
      err: false,
      message: "logout successfully",
      data: response.data,
    };
  } catch (err: any) {
    return {
      err: true,
      message: err.response.data.message,
      data: null,
    };
  }
}
