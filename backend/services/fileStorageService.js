import fs from 'fs/promises';
import path from 'path';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

export const storeUploadedFiles = async (files = [], folder = 'job-evidence') => {
  if (files.length === 0) return [];

  if (!isCloudinaryConfigured()) {
    return files.map((file) => `/api/v1/files/${encodeURIComponent(file.filename)}`);
  }

  const urls = [];
  for (const file of files) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `careconnect/${folder}`,
        resource_type: 'auto'
      });
      urls.push(result.secure_url);
    } finally {
      await fs.unlink(file.path).catch(() => {});
    }
  }

  return urls;
};

export const validateUploadedFiles = async (files = []) => {
  for (const file of files) {
    const header = await fs.readFile(file.path, { encoding: null, length: 12 }).catch(() => null);
    if (!header) throw new Error('Uploaded file could not be read');
    const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    const isPng = header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isWebp = header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'WEBP';
    const isPdf = header.subarray(0, 5).toString() === '%PDF-';
    if (!(isJpeg || isPng || isWebp || isPdf)) {
      await fs.unlink(file.path).catch(() => {});
      const error = new Error('Uploaded file content does not match an allowed file type');
      error.statusCode = 400;
      throw error;
    }
  }
};

export const removeLocalUpload = async (file) => {
  if (file?.path && !isCloudinaryConfigured()) {
    await fs.unlink(path.resolve(file.path)).catch(() => {});
  }
};
