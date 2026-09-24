import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${crypto.randomUUID()}${ext.toLowerCase()}`);
  }
});

function checkFileType(file, cb) {
  const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);
  const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
  const extname = allowedExtensions.has(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.has(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    const error = new Error('Only JPG, PNG, WEBP, and PDF files are allowed');
    error.statusCode = 400;
    cb(error);
  }
}

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5, fields: 20, parts: 30 }, // 10MB per file, five files per request
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});
