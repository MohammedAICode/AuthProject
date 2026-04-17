import {
  forgetPassApi,
  loginApi,
  logoutApi,
  meApi,
  passwordSetupApi,
  signupApi,
  verifyApi,
} from "../api/authApi";
import type { userLoginInfo, userSignupInfo } from "../utils/utils";

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

export async function signupUser(
  signupData: userSignupInfo,
): Promise<apiResponse> {
  try {
    const fd = new FormData();
    fd.append("firstname", signupData.firstname);
    fd.append("lastname", signupData.lastname);
    fd.append("email", signupData.email);
    fd.append("username", signupData.username);
    fd.append("password", "");
    fd.append("role", "");
    fd.append("authProvider", "");
    if (signupData.profileImg) {
      fd.append("profileImg", signupData.profileImg);
    }
    let response = await signupApi(fd);
    return {
      err: false,
      message: "user signup successful",
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

export async function verifyUser(
  email: string,
  otp: string,
): Promise<apiResponse> {
  try {
    if (!email || !otp) {
      console.log(`Trying to access the verify without email: ${email}`);
    }
    let response = await verifyApi(email, otp);
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

export async function setUpPass(
  pass: string,
  confirmPass: string,
): Promise<apiResponse> {
  try {
    if (!pass || !confirmPass) {
      console.log(`Trying to update the password without password: ${pass}`);
    }
    let response = await passwordSetupApi(pass, confirmPass);
    return {
      err: false,
      message: "setup successfully",
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

export async function forgetPass(email: string): Promise<apiResponse> {
  try {
    if (!email) {
      console.log(`Trying to update the password without password: ${email}`);
    }
    let response = await forgetPassApi(email);
    return {
      err: false,
      message: "setup successfully",
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
