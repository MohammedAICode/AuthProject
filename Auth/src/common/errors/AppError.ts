import { HTTP_STATUS } from "../constant/constants";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}
