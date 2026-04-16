export const ERROR_MESSAGES = {
  // common
  INTERNAL_SERVER_ERROR: "An unexpected error occurred on the server.",
  INVALID_REQUEST: "Invalid request formatting or parameters.",

  // user
  USER_FIRSTNAME_REQUIRED: "Firstname is required.",
  USER_EMAIL_REQUIRED: "Email is required.",
  USER_ALREADY_EXISTS: "User with this email or username already exists.",
  USER_NOT_FOUND: "User not found.",
  USER_ID_MISSING: "User ID is required.",
  USER_PASSWORD_REQUIRED: "User password is required",
  USER_MISSING_FIELDS: "User has missing fields",
  USER_INCORRECT_PASSSWORD: "Incorrect Password",
  USER_LOGOUT_SUCCESS: "User logout success.",
  USER_LOGOUT_FAILED: "User logout failed.",

  // auth
  INVALID_CREDENTIALS: "Invalid email or password.",
  UNAUTHORIZED: "Unauthorized access. Please log in.",
  FORBIDDEN: "You do not have permission to perform this action.",

  INVALID_ENV: "Server configuration error: Environment values are missing.",

  REFRESH_TOKEN_REVOKED: "TOKEN(s) is revoked, login again!",
} as const;

export const USER_MESSAGES = {
  USER_SAVE_SUCCESS: "User registered successfully.",
  USER_SAVE_FAILED: "Failed to register user.",

  USER_GET_FAILED: "Failed to retrieve user(s).",
  USER_GET_SUCCESS: "User(s) retrieved successfully.",

  USER_DELETE_FAILED: "Failed to delete user.",
  USER_DELETE_SUCCESS: "User deleted successfully.",

  USER_UPDATE_SUCCESS: "User updated successfully.",
  USER_UPDATE_FAILED: "Failed to update user.",

  USER_FORGET_SUCCESS: "User forget password successful.",
  USER_FORGET_FAILED: "Failed user forget password.",
} as const;

export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: "User login successful",
  LOGOUT_SUCCESS: "User logged out successfully",
  ME_SUCCESS: "User details retrieved successfully",
  PASSWORD_RESET_SUCCESS: "Password reset successfully",
};

export const EMAIL_MESSAGES = {
  ACTIVATION_EMAIL_SENT: "Activation email sent successfully",
  ACTIVATION_EMAIL_FAILED: "Failed to send activation email",

  FORGET_EMAIL_SENT: "forget email sent successfully",
  FORGET_EMAIL_FAILED: "Failed to send forget email",

} as const;

export const HTTP_STATUS = {
  // success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // client errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,

  // server errors
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;
