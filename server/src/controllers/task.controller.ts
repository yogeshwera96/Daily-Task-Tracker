import { Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { ExportService } from '../services/export.service';

export class TaskController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const task = await TaskService.create(req.user!.id, req.user!.role, req.body);

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'TASK_CREATED',
          entity: 'Task',
          entityId: task.id,
          details: `Created task: ${task.title}`,
          ipAddress: req.ip,
        },
      });

      res.status(201).json({ message: 'Task created', task });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const task = await TaskService.update(req.params.id, req.user!.id, req.user!.role, req.body);

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'TASK_UPDATED',
          entity: 'Task',
          entityId: task.id,
          details: `Updated task: ${task.title}`,
          ipAddress: req.ip,
        },
      });

      res.json({ message: 'Task updated', task });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await TaskService.delete(req.params.id, req.user!.id, req.user!.role);

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'TASK_DELETED',
          entity: 'Task',
          entityId: req.params.id,
          details: `Deleted task`,
          ipAddress: req.ip,
        },
      });

      res.json({ message: 'Task deleted' });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const task = await TaskService.getById(req.params.id, req.user!.id, req.user!.role);
      res.json(task);
    } catch (error) {
      next(error);
    }
  }

  static async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await TaskService.list(req.user!.id, req.user!.role, req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getTodayTasks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tasks = await TaskService.getTodayTasks(req.user!.id);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await TaskService.getTaskStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async exportTasks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const format = req.query.format as string;
      const userId = req.user!.id;
      const employeeName = `${req.user!.firstName} ${req.user!.lastName}`;

      // Get all tasks for this developer
      const result = await TaskService.list(userId, req.user!.role, { limit: '1000' });
      const tasks = result.tasks;

      if (format === 'pdf') {
        await ExportService.exportTasksPDF(res, tasks, employeeName);
      } else if (format === 'excel' || format === 'xlsx') {
        await ExportService.exportTasksExcel(res, tasks, employeeName);
      } else {
        await ExportService.exportTasksCSV(res, tasks, employeeName);
      }
    } catch (error) {
      next(error);
    }
  }
}
