import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../config/cloudinary.js';

// File filter to enforce image and document formats (JPEG, PNG, WEBP, PDF)
export const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/webp'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WEBP) and PDF documents are allowed!'), false);
  }
};

// In-memory buffer storage configuration (Default, high compatibility with AI & Cloudinary stream)
export const memoryStorage = multer.memoryStorage();

// Cloudinary Direct Storage for Vehicles & Documents
export const cloudinaryVehicleStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'primedrew/vehicles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    transformation: [{ width: 1920, height: 1080, crop: 'limit', quality: 'auto' }]
  }
});

// Cloudinary Direct Storage for KYC & RC Documents
export const cloudinaryDocumentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'primedrew/documents',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf']
  }
});

// Standard 10MB memory upload middleware
export const upload = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB maximum file size
  }
});

export default upload;
