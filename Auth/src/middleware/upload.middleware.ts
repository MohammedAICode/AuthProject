import multer from "multer";
import { AppError } from "../common/errors/AppError";
import { HTTP_STATUS } from "../common/constant/constants";

const storage = multer.memoryStorage();


const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // accept the file
  } else {
    cb(
      new AppError(
        `Invalid file type. Only JPEG, PNG and WEBP are allowed.`,
        HTTP_STATUS.BAD_REQUEST,
      ),
    );
  }
};


const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB in bytes
  },
});


export const uploadProfileImage = upload.single("profileImg");
