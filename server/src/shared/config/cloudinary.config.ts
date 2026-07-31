import { v2 as cloudinary } from 'cloudinary';
import env from './env.config';
import logger from './logger.config';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

logger.info('Cloudinary SDK initialized');

export default cloudinary;
