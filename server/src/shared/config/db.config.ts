import mongoose from 'mongoose';
import env from './env.config';
import logger from './logger.config';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(error as Error, 'Database connection error');
    process.exit(1);
  }
};

export default connectDB;
