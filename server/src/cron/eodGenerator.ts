import prisma from '../config/database';
import { ReportService } from '../services/report.service';
import { EmailService } from '../services/email.service';
import logger from '../config/logger';

export async function runAutoEodGenerator() {
  logger.info('⏰ Running Scheduled Auto-EOD Generator...');
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  try {
    // 1. Find all active developers
    const developers = await prisma.user.findMany({
      where: { role: 'DEVELOPER', isActive: true },
      include: { manager: true }
    });

    for (const dev of developers) {
      try {
        // Check if report already exists and is submitted
        const existingReport = await prisma.eodReport.findFirst({
          where: { userId: dev.id, date: today }
        });

        if (existingReport && (existingReport.status === 'SUBMITTED' || existingReport.status === 'APPROVED')) {
          logger.info(`Skipping Auto-EOD for ${dev.email} (already submitted)`);
          continue;
        }

        // Generate report (which builds/updates the report draft)
        const report = await ReportService.generate(dev.id);

        // Submit the report
        await prisma.eodReport.update({
          where: { id: report.id },
          data: { status: 'SUBMITTED', submittedAt: new Date() }
        });

        // Notify user in app
        await prisma.notification.create({
          data: {
            userId: dev.id,
            title: 'Auto-EOD Submitted',
            message: 'Your End of Day report was automatically compiled and submitted to your manager.',
            type: 'SUCCESS'
          }
        });

        // Email to manager if configured
        if (dev.manager?.email) {
          await EmailService.sendEodReport(
            dev.manager.email,
            `${dev.firstName} ${dev.lastName}`,
            today.toDateString(),
            report.content,
            report.completedTasks,
            report.pendingTasks,
            report.blockedTasks,
            report.totalHours
          );
        }

        logger.info(`Auto-EOD generated & submitted for ${dev.email}`);
      } catch (devError: any) {
        logger.error(`Failed to auto-generate EOD for developer ${dev.email}: ${devError.message}`);
      }
    }
  } catch (error: any) {
    logger.error(`Error in runAutoEodGenerator: ${error.message}`);
  }
}
