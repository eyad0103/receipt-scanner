import { config } from "../config";
import { Errors } from "../utils/errors";

export function validateUpload(file: Express.Multer.File | undefined): void {
  if (!file) throw Errors.emptyUpload();
  if (file.size === 0) throw Errors.emptyUpload();
  if (file.size > config.upload.maxSizeBytes) {
    throw Errors.fileTooLarge(`File exceeds ${config.upload.maxSizeBytes} bytes`);
  }
  if (!config.upload.allowedMimeTypes.includes(file.mimetype)) {
    throw Errors.unsupportedType();
  }
  const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));
  if (ext && !config.upload.allowedExtensions.includes(ext)) {
    throw Errors.unsupportedType();
  }
  if (!file.buffer || file.buffer.length < 10) {
    throw Errors.invalidImage("Corrupted or empty image");
  }
  const header = file.buffer.subarray(0, 8);
  const isJpeg = header[0] === 0xff && header[1] === 0xd8;
  const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
  const isWebp = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46;
  const isValidHeader = isJpeg || isPng || isWebp;
  if (!isValidHeader && file.buffer.length > 100) {
    throw Errors.invalidImage("Unsupported or corrupted image format");
  }
  if (file.buffer.length < 512) throw Errors.invalidImage("Image too small or corrupted");
}
