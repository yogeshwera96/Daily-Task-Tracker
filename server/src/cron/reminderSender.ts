import prisma from '../config/database';
import { EmailService } from '../services/email.service';
import logger from '../config/logger';

export async function runReminderSender() {
  logger.info('⏰ Running Scheduled EOD Reminder Sender...');
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  try {
    const developers = await prisma.user.findMany({
      where: { role: 'DEVELOPER', isActive: true }
    });

    for (const dev of developers) {
      try {
        const report = await prisma.eodReport.findFirst({
          where: { userId: dev.id, date: today }
        });

        if (report && (report.status === 'SUBMITTED' || report.status === 'APPROVED')) {
          continue;
        }

        // Send app notification
        await prisma.notification.create({
          data: {
            userId: dev.id,
            title: 'Pending EOD Report',
            message: 'Please complete today\'s tasks and submit your EOD report.',
            type: 'REMINDER'
          }
        });

        // Send email reminder
        await EmailService.sendReminderEmail(dev.email, dev.firstName);
        logger.info(`EOD reminder sent to ${dev.email}`);
      } catch (devError: any) {
        logger.error(`Failed to send reminder to ${dev.email}: ${devError.message}`);
      }
    }
  } catch (error: any) {
    logger.error(`Error in runReminderSender: ${error.message}`);
  }
}
