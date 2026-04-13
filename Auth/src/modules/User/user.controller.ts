import { Request, Response } from "express";
import {
  deleteUser,
  getAllUsers,
  getUser,
  registerUser,
  updateUser,
  userExists,
} from "./user.service";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  USER_MESSAGES,
} from "../../common/constant/constants";
import { logger } from "../../lib/logger";
import { AppError } from "../../common/errors/AppError";
import { eventBus } from "../../lib/eventBut";
import { EVENT_CONSTANTS } from "../../common/EventListener/Listener";

export async function register(req: Request, res: Response) {
  try {
    const { password: _, ...safeBody } = req.body;

    logger.info(`[REGISTER] Request received - ${JSON.stringify(safeBody)}`);
    let exists = await userExists("", req.body.email, req.body.username);
    if (exists) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: true,
        data: null,
        message: ERROR_MESSAGES.USER_ALREADY_EXISTS,
      });
    }
    const result = await registerUser(req);

    logger.info(`[REGISTER] Success - email: ${result.email}`);

    setImmediate(() => {
      eventBus.emit(EVENT_CONSTANTS.USER_CREATE, result);
    });
    
    return res.status(HTTP_STATUS.CREATED).json({
      error: false,
      data: result.email,
      message: USER_MESSAGES.USER_SAVE_SUCCESS,
    });
  } catch (err: any) {
    logger.error(`[REGISTER] Failed - ${err.message}`);
    let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    if (err instanceof AppError) {
      statusCode = err.statusCode;
    }
    return res.status(statusCode).json({
      error: true,
      data: null,
      message: err.message || USER_MESSAGES.USER_SAVE_FAILED,
    });
  }
}

export async function get(req: Request, res: Response) {
  logger.info(`[GET USER] Request to get the user with id: ${req.params.id}`);
  try {
    let { id } = req.params; // use 'ZOD' to validate the id.
    if (!id) {
      logger.error(`[GET USER] No id present in the requesting object`);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: true,
        data: null,
        message: ERROR_MESSAGES.USER_ID_MISSING,
      });
    }

    let result = await getUser(id as string);

    result != null
      ? logger.info(
          `[GET USER] User found sucessfully. id: ${result.id} & email: ${result.email}`,
        )
      : logger.info(`[GET USER] User not found, result : ${result}`);

    return res.status(HTTP_STATUS.OK).json({
      error: false,
      data: result,
      message: USER_MESSAGES.USER_GET_SUCCESS,
    });
  } catch (err: any) {
    logger.error(`[GET USER] Error occurred, ${err}`);
    let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    if (err instanceof AppError) {
      statusCode = err.statusCode;
    }
    return res.status(statusCode).json({
      error: false,
      data: null,
      message: err.message || USER_MESSAGES.USER_GET_FAILED,
    });
  }
}

export async function getAll(req: Request, res: Response) {
  logger.info(`[GET USERS] Request to get all the users.`); // we need to log who is trying to access / view all the users details
  try {
    // handle the query parameters to handle pagination, search and simple filters.
    let { search, page, size, isActive, role } = req.query;

    const filter = {
      search: search ? String(search) : undefined,
      page: page && Number(page) > 0 ? Number(page) : 1,
      size: size ? Number(size) : 10,
      isActive: isActive ? String(isActive) : undefined,
      role: role ? String(role) : undefined,
    };

    logger.info(
      `[GET USERS] Finding the users with these filters: ${JSON.stringify(filter)}`,
    );

    let { totalCount, filteredCount, users } = await getAllUsers(filter);

    users != null
      ? logger.info(
          `[GET USERS] User found sucessfully. numfound : ${users.length}`,
        )
      : logger.info(`[GET USERS] User not found, result : ${users}`);

    return res.status(HTTP_STATUS.OK).json({
      error: false,
      data: {
        totalCount,
        filteredCount,
        users,
      },
      message: USER_MESSAGES.USER_GET_SUCCESS,
    });
  } catch (err: any) {
    logger.error(`[GET USERS] Error occurred, ${err}`);
    let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    if (err instanceof AppError) {
      statusCode = err.statusCode;
    }
    return res.status(statusCode).json({
      error: true,
      data: null,
      message: USER_MESSAGES.USER_GET_FAILED,
    });
  }
}

export async function remove(req: Request, res: Response) {
  logger.info(`[USER DELETE] Request to delete the user. id: ${req.params.id}`);
  try {
    let { id } = req.params;

    if (!id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: true,
        data: null,
        message: ERROR_MESSAGES.USER_ID_MISSING,
      });
    }
    let exists = await userExists("", "",id as string);
    if (!exists) {
      throw new AppError(
        ERROR_MESSAGES.USER_ID_MISSING,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    let result = await deleteUser(id as string);

    return res.status(HTTP_STATUS.OK).json({
      error: false,
      data: {
        id: result.id,
      },
      message: USER_MESSAGES.USER_DELETE_SUCCESS,
    });
  } catch (err: any) {
    logger.error(`[USER DELETE] Error occurred, ${err}`);
    let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    if (err instanceof AppError) {
      statusCode = err.statusCode;
    }
    return res.status(statusCode).json({
      error: true,
      data: null,
      message: err.message || USER_MESSAGES.USER_DELETE_FAILED,
    });
  }
}

export async function update(req: Request, res: Response) {
  logger.info(`[USER UPDATE] Request to update the user. id: ${req.params.id}`);
  try {
    let { id } = req.params;

    let exists = await userExists("", "", id as string);
    if (!exists) {
      throw new AppError(
        ERROR_MESSAGES.USER_ID_MISSING,
        HTTP_STATUS.BAD_REQUEST,
      );
    }
    let result = await updateUser(id as string, req, exists.profileImgKey);

    return res.status(HTTP_STATUS.OK).json({
      error: false,
      data: result,
      message: USER_MESSAGES.USER_UPDATE_SUCCESS,
    });
  } catch (err: any) {
    logger.error(`[USER UPDATE] Error occurred, ${err}`);
    let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    if (err instanceof AppError) {
      statusCode = err.statusCode;
    }
    return res.status(statusCode).json({
      error: true,
      data: null,
      message: err.message || USER_MESSAGES.USER_UPDATE_FAILED,
    });
  }
}



