import cron from 'node-cron';
import { runAutoEodGenerator } from './eodGenerator';
import { runReminderSender } from './reminderSender';
import { config } from '../config';
import logger from '../config/logger';

export function initCronJobs() {
  logger.info('Initializing background cron schedules...');

  // EOD generation: 6 PM Monday-Friday
  cron.schedule(config.cron.eodTime, async () => {
    try {
      await runAutoEodGenerator();
    } catch (err: any) {
      logger.error(`Error executing auto EOD generator cron: ${err.message}`);
    }
  });

  // EOD Reminders: 5 PM Monday-Friday
  cron.schedule(config.cron.reminderTime, async () => {
    try {
      await runReminderSender();
    } catch (err: any) {
      logger.error(`Error executing reminder sender cron: ${err.message}`);
    }
  });

  logger.info(`Scheduled auto-EOD (cron: ${config.cron.eodTime})`);
  logger.info(`Scheduled reminder (cron: ${config.cron.reminderTime})`);
}
