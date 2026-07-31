import logger from '../shared/config/logger.config';

export const queueJob = async (jobName: string, data: any): Promise<void> => {
  logger.info({ jobName, data }, `Background job queued: ${jobName}`);

  // Simulating asynchronous processing
  setTimeout(async () => {
    try {
      logger.info({ jobName }, `Starting background worker task: ${jobName}`);

      switch (jobName) {
        case 'QR_GENERATION':
          logger.info('Background worker: Processing QR image upload');
          break;
        case 'SEND_EMAIL':
          logger.info('Background worker: Processing email delivery alert');
          break;
        case 'SEND_WHATSAPP':
          logger.info('Background worker: Processing WhatsApp alert message');
          break;
        case 'GENERATE_PDF':
          logger.info('Background worker: Processing PDF document export compilation');
          break;
        default:
          logger.warn(`Background worker: Unrecognized job handler name: ${jobName}`);
      }

      logger.info({ jobName }, `Completed worker task: ${jobName}`);
    } catch (error: any) {
      logger.error({ jobName, error: error.message }, `Background job failed: ${jobName}`);
    }
  }, 100);
};

export default queueJob;
