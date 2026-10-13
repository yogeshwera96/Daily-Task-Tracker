import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class ManagerController {
  static async getTeam(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const managerId = req.user!.id;
      const team = await prisma.user.findMany({
        where: { managerId, role: 'DEVELOPER' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          designation: true,
          isActive: true,
          avatar: true,
          department: { select: { id: true, name: true } },
          _count: {
            select: {
              tasks: { where: { status: 'COMPLETED' } }
            }
          }
        }
      });
      res.json(team);
    } catch (error) {
      next(error);
    }
  }

  static async getEmployeeStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.params;
      const managerId = req.user!.id;

      // Verify the developer belongs to this manager
      const employee = await prisma.user.findFirst({
        where: { id: employeeId, managerId }
      });
      if (!employee) {
        throw new AppError('Employee not found or not managed by you', 404);
      }

      const totalTasks = await prisma.task.count({ where: { userId: employeeId } });
      const completedTasks = await prisma.task.count({ where: { userId: employeeId, status: 'COMPLETED' } });
      const pendingTasks = await prisma.task.count({ where: { userId: employeeId, status: { in: ['TODO', 'IN_PROGRESS', 'TESTING', 'REVIEW'] } } });
      const blockedTasks = await prisma.task.count({ where: { userId: employeeId, status: 'BLOCKED' } });

      const totalHoursAgg = await prisma.task.aggregate({
        where: { userId: employeeId },
        _sum: { actualHours: true }
      });

      res.json({
        employee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          designation: employee.designation
        },
        stats: {
          totalTasks,
          completedTasks,
          pendingTasks,
          blockedTasks,
          totalHours: totalHoursAgg._sum?.actualHours || 0
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getManagerAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const managerId = req.user!.id;
      const team = await prisma.user.findMany({
        where: { managerId, role: 'DEVELOPER' },
        select: { id: true }
      });
      const teamIds = team.map(t => t.id);

      // Simple metrics
      const totalTasks = await prisma.task.count({ where: { userId: { in: teamIds } } });
      const completedTasks = await prisma.task.count({ where: { userId: { in: teamIds }, status: 'COMPLETED' } });
      const blockedTasks = await prisma.task.count({ where: { userId: { in: teamIds }, status: 'BLOCKED' } });

      res.json({
        teamSize: teamIds.length,
        totalTasks,
        completedTasks,
        blockedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      });
    } catch (error) {
      next(error);
    }
  }
}
