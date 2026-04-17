export interface User {
  authProvider: string;
  createdAt: Date;
  email: string;
  firstname: string;
  isActive: boolean;
  lastname: string;
  profileImg: string | null;
  profileImgKey: string | null;
  role: string;
  updatedAt: Date;
  username: string | null;
}

export interface userSignupInfo {
  firstname: string;
  lastname: string;
  email: string;
  username: string;
  profileImg: File | null;
}

export interface userLoginInfo {
  email: string;
  password: String;
}

export function convertJsonToUserObj(userJson: any): User {
  if (!userJson) {
    throw new Error("user json does not have values.");
  }
  return {
    firstname: userJson.firstname,
    lastname: userJson.lastname,
    authProvider: userJson.authProvider,
    createdAt: userJson.createdAt,
    email: userJson.email,
    isActive: userJson.isActive,
    profileImg: userJson.profileImg,
    profileImgKey: userJson.profileImgKey,
    role: userJson.role,
    updatedAt: userJson.updatedAt,
    username: userJson.username,
  };
}

export function getInitialOfFullName(fn: string, ln: string) {
  let fnArr = fn.trim().split(" ");
  let lnArr = ln.trim().split(" ");

  return fnArr[0].charAt(0) + lnArr[0].charAt(0);
}
