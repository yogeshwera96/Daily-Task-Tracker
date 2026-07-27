import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { TaskStatus, Prisma } from '@prisma/client';
import type { CreateTaskInput, UpdateTaskInput, TaskFilterInput } from '../validators/task.validator';

export class TaskService {
  static async create(loggedInUserId: string, loggedInUserRole: string, input: CreateTaskInput) {
    let targetUserId = loggedInUserId;

    if (input.userId && input.userId !== loggedInUserId) {
      if (loggedInUserRole === 'ADMIN' || loggedInUserRole === 'MANAGER') {
        // If manager, check if developer belongs to this manager
        if (loggedInUserRole === 'MANAGER') {
          const isManaged = await prisma.user.findFirst({
            where: { id: input.userId, managerId: loggedInUserId },
          });
          if (!isManaged) {
            throw new AppError('You can only assign tasks to developers you manage', 403);
          }
        }
        targetUserId = input.userId;
      } else {
        throw new AppError('Developers can only create tasks for themselves', 403);
      }
    }

    // Extract userId from input to prevent schema collision
    const { userId: _, ...taskData } = input;

    return prisma.task.create({
      data: {
        ...taskData,
        userId: targetUserId,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      },
      include: {
        project: { select: { id: true, name: true } },
        attachments: true,
      },
    });
  }

  static async update(taskId: string, loggedInUserId: string, loggedInUserRole: string, input: UpdateTaskInput) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { user: true },
    });
    if (!task) throw new AppError('Task not found', 404);

    const isOwner = task.userId === loggedInUserId;
    const isManagerOfOwner = loggedInUserRole === 'MANAGER' && task.user.managerId === loggedInUserId;
    const isAdmin = loggedInUserRole === 'ADMIN';

    if (!isOwner && !isManagerOfOwner && !isAdmin) {
      throw new AppError('You do not have permission to update this task', 403);
    }

    const updateData: any = { ...input };
    if (input.dueDate) updateData.dueDate = new Date(input.dueDate);
    if (input.completionDate) updateData.completionDate = new Date(input.completionDate);

    // Auto-set completion date when status changes to COMPLETED
    if (input.status === 'COMPLETED' && task.status !== TaskStatus.COMPLETED) {
      updateData.completionDate = new Date();
    }

    // Handle assigning to different developer
    if (input.userId && input.userId !== task.userId) {
      if (loggedInUserRole === 'ADMIN' || loggedInUserRole === 'MANAGER') {
        if (loggedInUserRole === 'MANAGER') {
          const isManaged = await prisma.user.findFirst({
            where: { id: input.userId, managerId: loggedInUserId },
          });
          if (!isManaged) {
            throw new AppError('You can only assign tasks to developers you manage', 403);
          }
        }
      } else {
        delete updateData.userId;
      }
    }

    return prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        attachments: true,
      },
    });
  }

  static async delete(taskId: string, loggedInUserId: string, loggedInUserRole: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { user: true },
    });
    if (!task) throw new AppError('Task not found', 404);

    const isOwner = task.userId === loggedInUserId;
    const isManagerOfOwner = loggedInUserRole === 'MANAGER' && task.user.managerId === loggedInUserId;
    const isAdmin = loggedInUserRole === 'ADMIN';

    if (!isOwner && !isManagerOfOwner && !isAdmin) {
      throw new AppError('You do not have permission to delete this task', 403);
    }

    await prisma.task.delete({ where: { id: taskId } });
  }

  static async getById(taskId: string, loggedInUserId: string, loggedInUserRole: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: { select: { id: true, name: true } },
        attachments: true,
        user: true,
      },
    });
    if (!task) throw new AppError('Task not found', 404);

    const isOwner = task.userId === loggedInUserId;
    const isManagerOfOwner = loggedInUserRole === 'MANAGER' && task.user.managerId === loggedInUserId;
    const isAdmin = loggedInUserRole === 'ADMIN';

    if (!isOwner && !isManagerOfOwner && !isAdmin) {
      throw new AppError('You do not have permission to view this task', 403);
    }

    return task;
  }

  static async list(userId: string, userRole: string, filters: TaskFilterInput) {
    const page = parseInt(filters.page || '1');
    const limit = parseInt(filters.limit || '20');
    const skip = (page - 1) * limit;

    let targetUserId = userId;
    if (filters.userId && filters.userId !== userId) {
      if (userRole === 'ADMIN') {
        targetUserId = filters.userId;
      } else if (userRole === 'MANAGER') {
        const isManaged = await prisma.user.findFirst({
          where: { id: filters.userId, managerId: userId },
        });
        if (!isManaged) {
          throw new AppError('You can only view tasks of developers you manage', 403);
        }
        targetUserId = filters.userId;
      } else {
        throw new AppError('Developers cannot view other users\' tasks', 403);
      }
    }

    const where: Prisma.TaskWhereInput = { userId: targetUserId };

    if (filters.status) {
      where.status = filters.status as TaskStatus;
    }
    if (filters.priority) {
      where.priority = filters.priority as any;
    }
    if (filters.projectId) {
      where.projectId = filters.projectId;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
        { tags: { contains: filters.search } },
      ];
    }
    if (filters.dateFrom || filters.dateTo) {
      where.assignedDate = {};
      if (filters.dateFrom) where.assignedDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.assignedDate.lte = new Date(filters.dateTo);
    }

    const orderBy: any = {};
    orderBy[filters.sortBy || 'createdAt'] = filters.sortOrder || 'desc';

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          attachments: { select: { id: true, fileName: true, fileType: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getTodayTasks(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.task.findMany({
      where: {
        userId,
        assignedDate: { gte: today, lt: tomorrow },
      },
      include: {
        project: { select: { id: true, name: true } },
        attachments: true,
      },
      orderBy: [{ priority: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  static async getTaskStats(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayTasks, completed, pending, blocked, totalHours] = await Promise.all([
      prisma.task.count({
        where: { userId, assignedDate: { gte: today, lt: tomorrow } },
      }),
      prisma.task.count({
        where: { userId, assignedDate: { gte: today, lt: tomorrow }, status: 'COMPLETED' },
      }),
      prisma.task.count({
        where: { userId, assignedDate: { gte: today, lt: tomorrow }, status: { in: ['TODO', 'IN_PROGRESS'] } },
      }),
      prisma.task.count({
        where: { userId, assignedDate: { gte: today, lt: tomorrow }, status: 'BLOCKED' },
      }),
      prisma.task.aggregate({
        where: { userId, assignedDate: { gte: today, lt: tomorrow } },
        _sum: { actualHours: true },
      }),
    ]);

    const completionPercent = todayTasks > 0 ? Math.round((completed / todayTasks) * 100) : 0;

    return {
      todayTasks,
      completed,
      pending,
      blocked,
      totalHours: totalHours._sum.actualHours || 0,
      completionPercent,
    };
  }
}
