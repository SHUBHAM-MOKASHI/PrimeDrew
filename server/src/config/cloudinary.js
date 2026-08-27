import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload buffer or base64 data to Cloudinary via stream
 * @param {Buffer|string} fileBufferOrBase64
 * @param {Object} options - folder, resource_type, transformation, etc.
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadToCloudinary = (fileBufferOrBase64, options = {}) => {
  return new Promise((resolve, reject) => {
    // If it's already a hosted URL (http/https), return it directly
    if (typeof fileBufferOrBase64 === 'string' && (fileBufferOrBase64.startsWith('http://') || fileBufferOrBase64.startsWith('https://'))) {
      return resolve({ secure_url: fileBufferOrBase64 });
    }

    // If Cloudinary credentials are missing in dev, return data URI or safe fallback
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      if (typeof fileBufferOrBase64 === 'string') {
        return resolve({ secure_url: fileBufferOrBase64 });
      }
      const b64 = Buffer.isBuffer(fileBufferOrBase64) ? fileBufferOrBase64.toString('base64') : '';
      return resolve({ secure_url: `data:image/jpeg;base64,${b64}` });
    }

    const defaultOptions = {
      folder: 'primedrew/vehicles',
      resource_type: 'auto',
      ...options
    };

    if (typeof fileBufferOrBase64 === 'string' && fileBufferOrBase64.startsWith('data:')) {
      cloudinary.uploader.upload(fileBufferOrBase64, defaultOptions, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    } else {
      const uploadStream = cloudinary.uploader.upload_stream(defaultOptions, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
      uploadStream.end(fileBufferOrBase64);
    }
  });
};

export { cloudinary };
export default cloudinary;
