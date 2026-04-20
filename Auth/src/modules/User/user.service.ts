import { Request } from "express";
import { prisma } from "../../lib/prisma";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  USER_MESSAGES,
} from "../../common/constant/constants";
import { logger } from "../../lib/logger";
import {
  AuthProvider,
  Prisma,
  USER_ROLE,
} from "../../../generated/prisma/client";
import { AppError } from "../../common/errors/AppError";
import { hashPassword } from "../../common/utils/utils";
import {
  deleteProfileImg,
  getProfileImageUrl,
  uploadProfileImgToS3,
} from "../Bucket/s3.service";
import { v4 as uuid } from "uuid";

export async function registerUser(req: Request) {
  let { firstname, lastname, email, username, authProvider, role } = req.body;

  let userId = uuid();

  // req.file is populated by multer when the client sends a multipart/form-data request.
  // req.file.buffer contains the raw image bytes (because we use memoryStorage).
  const profileImg = req.file ?? null;

  if (!firstname) {
    logger.error(`[REGISTER] Validation failed - firstname is required`);
    throw new AppError(
      "No firstname provided in the request.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (!email) {
    logger.error(`[REGISTER] Validation failed - email is required`);
    throw new AppError(
      "No email provided in the request.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  let user: Prisma.UserCreateInput = {
    id: userId,
    firstname: firstname,
    email: email,
  };

  if (profileImg) {
    logger.info(
      `[REGISTER] Profile image detected - initiating S3 upload for userId: ${userId}`,
    );
    try {
      let key = await uploadProfileImgToS3(profileImg, userId);
      user.profileImgKey = key;
      logger.info(
        `[REGISTER] Profile image uploaded to S3 successfully - userId: ${userId}, key: ${key}`,
      );
    } catch (err: any) {
      logger.error(
        `[REGISTER] S3 upload failed - continuing registration without profile image. userId: ${userId}, error: ${err.message}`,
      );
    }
  }

  if (lastname) {
    user.lastname = lastname;
  }
  if (username) {
    user.username = username;
  } else {
    user.username = email;
  }

  if (authProvider) {
    logger.info(`[REGISTER] Auth provider received - ${authProvider}`);
    if (authProvider === AuthProvider.GOOGLE.toString()) {
      user.authProvider = AuthProvider.GOOGLE;
    } else if (authProvider === AuthProvider.META.toString()) {
      user.authProvider = AuthProvider.META;
    } else {
      logger.warn(
        `[REGISTER] Unknown auth provider "${authProvider}" - defaulting to LOCAL`,
      );
      user.authProvider = AuthProvider.LOCAL;
    }
  } else {
    logger.info(`[REGISTER] No auth provider - defaulting to LOCAL`);
    user.authProvider = AuthProvider.LOCAL;
  }

  if (role) {
    logger.info(`[REGISTER] Role received - ${role}`);
    if (role === USER_ROLE.ADMIN.toString()) {
      user.role = USER_ROLE.ADMIN;
    } else {
      logger.warn(`[REGISTER] Unknown role "${role}" - defaulting to USER`);
      user.role = USER_ROLE.USER;
    }
  } else {
    logger.info(`[REGISTER] No role provided - defaulting to USER`);
    user.role = USER_ROLE.USER;
  }

  // // make the password field madatory. when the authProvider is LOCAL.
  // if (!password) {
  //   logger.warn(`[REGISTER] No password provided for email: ${email}`);
  //   if (user.authProvider === AuthProvider.LOCAL) {
  //     throw new AppError(
  //       ERROR_MESSAGES.USER_PASSWORD_REQUIRED,
  //       HTTP_STATUS.BAD_REQUEST,
  //     );
  //   }
  // } else {
  //   user.password = await hashPassword(password);
  //   logger.info(`[REGISTER] Password hashed successfully`);
  // }

  const result = await createUserInDB(user);

  logger.info(
    `[REGISTER] User saved - id: ${result.id}, email: ${result.email}`,
  );

  return result;
}

export async function createUserInDB(user: Prisma.UserCreateInput) {
  return await prisma.user.create({
    data: user,
    omit: {
      password: true,
    },
  });
}

export async function userExists(
  email: string | null,
  username: string | null,
  id: string | null,
) {
  try {
    let result = null;

    if (id) {
      logger.info(`[User Exists] - Trying to find the user with id: ${id}`);
      result = await prisma.user.findUnique({
        where: {
          id,
        },
      });
    } else if (email) {
      logger.info(
        `[User Exists] - Trying to find the user with email: ${email}`,
      );
      result = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });
    } else if (username) {
      logger.info(
        `[User Exists] - Trying to find the user with username: ${username}`,
      );
      result = await prisma.user.findUnique({
        where: {
          username: username,
        },
      });
    }
    // if (result) {
    //   logger.error(
    //     `[User Exists] - User already exits with this email / username - ${result.email} / ${result.username}`,
    //   );
    //   throw new AppError(
    //     `User exists with email - ${result.email}`,
    //     HTTP_STATUS.BAD_REQUEST,
    //   );
    // }
    return result;
  } catch (err: any) {
    throw err;
  }
}

export async function getUser(id: string) {
  const result = await prisma.user.findUnique({
    where: {
      id: id,
    },
    omit: {
      password: true,
    },
  });

  if (result?.profileImgKey) {
    logger.info(
      `[GET USER] Generating signed URL for profile image - userId: ${id}, key: ${result.profileImgKey}`,
    );
    try {
      let url = await getProfileImageUrl(result.profileImgKey);
      result.profileImgKey = url;
      logger.info(
        `[GET USER] Profile image URL generated successfully - userId: ${id}`,
      );
    } catch (err: any) {
      logger.error(
        `[GET USER] Failed to generate signed URL - userId: ${id}, error: ${err.message}`,
      );
      // Return user without profile image URL instead of failing
      result.profileImgKey = null;
    }
  }

  return result;
}

// add pagination, search and filters
// 1. [Active | inactive]
// 2. [ADMIN  | USER]
export async function getAllUsers(filter: {
  search: string | undefined;
  page: number;
  size: number;
  isActive: string | undefined;
  role: string | undefined;
}) {
  const where: any = {
    ...(filter.search && {
      OR: [
        { firstname: { contains: filter.search, mode: "insensitive" } },
        { lastname: { contains: filter.search, mode: "insensitive" } },
        { email: { contains: filter.search, mode: "insensitive" } },
        { username: { contains: filter.search, mode: "insensitive" } },
      ],
    }),

    ...(filter.isActive && {
      isActive: filter.isActive.toLowerCase() === "true",
    }),
    ...(filter.role && {
      role: filter.role,
    }),
  };

  const [totalCount, filteredCount, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: ((filter.page ?? 1) - 1) * (filter.size ?? 10),
      take: filter.size ?? 10,
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return {
    totalCount,
    filteredCount,
    users,
  };
}

export async function deleteUser(id: string) {
  // check the current status, if the current status of the user is inActive=true, then check who is deleting ? if current user is Admin. hard delete (2nd time) : soft delete (isActive = true)

  let result = await prisma.user.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });

  logger.info(
    `[USER DELETE] Converted the user isActive status : ${result.isActive}`,
  );

  return result;
}

export async function updateUser(
  id: string,
  req: Request,
  imgKey: string | null,
) {
  let { firstname, lastname, email, username, password, role, profileImgKey } =
    req.body;

  const profileImg = req.file ?? null;

  let updateUser: Prisma.UserUpdateInput = {
    firstname: firstname ? firstname : undefined,
    lastname: lastname ? lastname : undefined,
    email: email ? email : undefined,
    username: username ? username : undefined,
    password: password ? await hashPassword(password) : undefined,
    // profileImg: profileImg
    //   ? (profileImg as unknown as Uint8Array<ArrayBuffer>)
    //   : undefined,
    profileImgKey: profileImg
      ? imgKey
        ? await updateProImg(imgKey, profileImg, id) // Replace existing
        : await uploadProfileImgToS3(profileImg, id) // First upload
      : undefined,

    ...(role && {
      role:
        role.toLowerCase() === USER_ROLE.ADMIN.toString().toLowerCase()
          ? USER_ROLE.ADMIN
          : USER_ROLE.USER,
    }),
  };

  let result = await prisma.user.update({
    where: {
      id: id,
    },
    data: updateUser,
    omit: {
      password: true,
    },
  });

  return result;
}

async function updateProImg(
  imgKey: string,
  file: Express.Multer.File,
  userId: string,
) {
  logger.info(
    `[UPDATE USER] Replacing profile image - userId: ${userId}, oldKey: ${imgKey}`,
  );

  await deleteProfileImg(imgKey);
  const newKey = await uploadProfileImgToS3(file, userId);

  logger.info(
    `[UPDATE USER] Profile image replaced successfully - userId: ${userId}, newKey: ${newKey}`,
  );

  return newKey;
}
