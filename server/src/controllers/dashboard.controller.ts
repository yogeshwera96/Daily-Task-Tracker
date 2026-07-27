import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { TaskService } from '../services/task.service';

export class DashboardController {
  static async getDeveloperDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [taskStats, recentReports, todayTasks, weeklyData] = await Promise.all([
        TaskService.getTaskStats(userId),
        prisma.eodReport.findMany({
          where: { userId },
          orderBy: { date: 'desc' },
          take: 5,
          select: { id: true, date: true, status: true, completedTasks: true, totalHours: true },
        }),
        TaskService.getTodayTasks(userId),
        // Get last 7 days productivity
        prisma.eodReport.findMany({
          where: {
            userId,
            date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
          orderBy: { date: 'asc' },
          select: { date: true, completedTasks: true, totalHours: true, pendingTasks: true },
        }),
      ]);

      res.json({
        taskStats,
        recentReports,
        todayTasks,
        weeklyProductivity: weeklyData,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getManagerDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const managerId = req.user!.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const developers = await prisma.user.findMany({
        where: { managerId, role: 'DEVELOPER' },
        select: { id: true, firstName: true, lastName: true, email: true, avatar: true, designation: true },
      });
      const devIds = developers.map((d) => d.id);

      const [
        totalEmployees,
        projects,
        todaySubmitted,
        todayPending,
        lateReports,
        recentReports,
      ] = await Promise.all([
        prisma.user.count({ where: { managerId, role: 'DEVELOPER', isActive: true } }),
        prisma.project.count({ where: { managerId, status: 'ACTIVE' } }),
        prisma.eodReport.count({
          where: { userId: { in: devIds }, date: { gte: today }, status: 'SUBMITTED' },
        }),
        devIds.length - await prisma.eodReport.count({
          where: { userId: { in: devIds }, date: { gte: today }, status: { in: ['SUBMITTED', 'APPROVED'] } },
        }),
        prisma.eodReport.count({
          where: { userId: { in: devIds }, status: 'DRAFT', date: { lt: today } },
        }),
        prisma.eodReport.findMany({
          where: { userId: { in: devIds } },
          include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
          orderBy: { date: 'desc' },
          take: 10,
        }),
      ]);

      res.json({
        totalEmployees,
        projects,
        todaySubmitted,
        todayPending,
        lateReports,
        developers,
        recentReports,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAdminDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalEmployees,
        totalManagers,
        totalProjects,
        totalDepartments,
        todayReports,
        totalReports,
        aiUsage,
        recentLogs,
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'DEVELOPER', isActive: true } }),
        prisma.user.count({ where: { role: 'MANAGER', isActive: true } }),
        prisma.project.count({ where: { status: 'ACTIVE' } }),
        prisma.department.count({ where: { isActive: true } }),
        prisma.eodReport.count({ where: { date: { gte: today } } }),
        prisma.eodReport.count(),
        prisma.aiLog.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
        prisma.auditLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        }),
      ]);

      res.json({
        totalEmployees,
        totalManagers,
        totalProjects,
        totalDepartments,
        todayReports,
        totalReports,
        aiUsage,
        recentLogs,
      });
    } catch (error) {
      next(error);
    }
  }
}
