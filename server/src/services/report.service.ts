import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AiService } from './ai.service';
import { ReportStatus, Prisma } from '@prisma/client';

export class ReportService {
  static async generate(userId: string) {
    const now = new Date();
    
    // For tasks query (using local timezone midnight)
    const localTodayStart = new Date(now);
    localTodayStart.setHours(0, 0, 0, 0);
    const localTomorrowStart = new Date(localTodayStart);
    localTomorrowStart.setDate(localTomorrowStart.getDate() + 1);

    // For EodReport queries/mutations (MySQL DATE column: normalized to UTC midnight)
    const dbDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    // Check if report already exists for today
    const existing = await prisma.eodReport.findFirst({
      where: { userId, date: dbDate },
    });

    if (existing && existing.status === 'SUBMITTED') {
      throw new AppError('EOD report already submitted for today', 400);
    }

    // Get today's tasks
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        assignedDate: { gte: localTodayStart, lt: localTomorrowStart },
      },
      include: { project: { select: { id: true, name: true } } },
    });

    if (tasks.length === 0) {
      throw new AppError('No tasks found for today. Add tasks before generating EOD.', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    const userName = `${user!.firstName} ${user!.lastName}`;
    const dateStr = localTodayStart.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Generate AI report
    const content = await AiService.generateEodReport(userId, tasks, userName, dateStr);

    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
    const pendingTasks = tasks.filter((t) => ['TODO', 'IN_PROGRESS'].includes(t.status)).length;
    const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED').length;
    const totalHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

    // Upsert report
    const report = await prisma.eodReport.upsert({
      where: { userId_date: { userId, date: dbDate } },
      create: {
        userId,
        date: dbDate,
        content,
        rawTaskData: JSON.stringify(tasks),
        aiGenerated: true,
        status: 'DRAFT',
        completedTasks,
        pendingTasks,
        blockedTasks,
        totalHours,
      },
      update: {
        content,
        rawTaskData: JSON.stringify(tasks),
        aiGenerated: true,
        completedTasks,
        pendingTasks,
        blockedTasks,
        totalHours,
      },
    });

    return report;
  }

  static async submit(reportId: string, userId: string) {
    const report = await prisma.eodReport.findFirst({
      where: { id: reportId, userId },
    });
    if (!report) throw new AppError('Report not found', 404);
    if (report.status === 'SUBMITTED') throw new AppError('Report already submitted', 400);

    return prisma.eodReport.update({
      where: { id: reportId },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    });
  }

  static async updateContent(reportId: string, userId: string, content: string, tomorrowPlan?: string) {
    const report = await prisma.eodReport.findFirst({
      where: { id: reportId, userId },
    });
    if (!report) throw new AppError('Report not found', 404);
    if (report.status === 'SUBMITTED' || report.status === 'APPROVED') {
      throw new AppError('Cannot edit a submitted/approved report', 400);
    }

    return prisma.eodReport.update({
      where: { id: reportId },
      data: { content, tomorrowPlan },
    });
  }

  static async getByDate(userId: string, date: Date) {
    return prisma.eodReport.findFirst({
      where: { userId, date },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      },
    });
  }

  static async getUserReports(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      prisma.eodReport.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.eodReport.count({ where: { userId } }),
    ]);

    return {
      reports,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // --- Manager Operations ---

  static async getTeamReports(managerId: string, filters: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    employeeId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Get all developers under this manager
    const developers = await prisma.user.findMany({
      where: { managerId },
      select: { id: true },
    });
    const devIds = developers.map((d) => d.id);

    const where: Prisma.EodReportWhereInput = {
      userId: filters.employeeId ? filters.employeeId : { in: devIds },
    };

    if (filters.status) where.status = filters.status as ReportStatus;
    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
    }

    const [reports, total] = await Promise.all([
      prisma.eodReport.findMany({
        where,
        include: {
          user: {
            select: {
              id: true, firstName: true, lastName: true, email: true,
              avatar: true, designation: true, department: { select: { name: true } },
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.eodReport.count({ where }),
    ]);

    return {
      reports,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async approveReport(reportId: string, reviewerId: string, comment?: string) {
    const report = await prisma.eodReport.findUnique({ where: { id: reportId } });
    if (!report) throw new AppError('Report not found', 404);

    return prisma.eodReport.update({
      where: { id: reportId },
      data: {
        status: 'APPROVED',
        reviewerId,
        reviewedAt: new Date(),
        managerComment: comment,
      },
    });
  }

  static async rejectReport(reportId: string, reviewerId: string, comment: string) {
    const report = await prisma.eodReport.findUnique({ where: { id: reportId } });
    if (!report) throw new AppError('Report not found', 404);

    return prisma.eodReport.update({
      where: { id: reportId },
      data: {
        status: 'REJECTED',
        reviewerId,
        reviewedAt: new Date(),
        managerComment: comment,
      },
    });
  }
}
