import prisma from '../config/database';

export class AnalyticsService {
  static async getDeveloperProductivity(userId: string) {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [tasks, eodReports] = await Promise.all([
      prisma.task.findMany({
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.eodReport.findMany({
        where: {
          userId,
          date: { gte: thirtyDaysAgo }
        }
      })
    ]);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const blockedTasks = tasks.filter(t => t.status === 'BLOCKED').length;
    const averageCompletionTime = 0; // Simple dummy metric for demo, can be calculated based on completionDate - createdAt

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const totalWorkingHours = eodReports.reduce((sum, r) => sum + r.totalHours, 0);

    // AI productivity score out of 100 based on hours & completed tasks
    const productivityScore = Math.min(
      100,
      Math.round((completedTasks * 10) + (totalWorkingHours * 0.5) - (blockedTasks * 2)) || 75
    );

    return {
      completionRate: Math.round(completionRate),
      completedTasks,
      blockedTasks,
      totalWorkingHours,
      productivityScore
    };
  }
}
