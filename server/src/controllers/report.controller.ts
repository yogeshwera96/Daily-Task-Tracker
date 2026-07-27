import { Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export class ReportController {
  static async generate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const report = await ReportService.generate(req.user!.id);

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'EOD_GENERATED',
          entity: 'EodReport',
          entityId: report.id,
          details: 'AI-generated EOD report',
          ipAddress: req.ip,
        },
      });

      res.json({ message: 'EOD report generated', report });
    } catch (error) {
      next(error);
    }
  }

  static async submit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const report = await ReportService.submit(req.params.id, req.user!.id);
      res.json({ message: 'Report submitted successfully', report });
    } catch (error) {
      next(error);
    }
  }

  static async updateContent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { content, tomorrowPlan } = req.body;
      const report = await ReportService.updateContent(req.params.id, req.user!.id, content, tomorrowPlan);
      res.json({ message: 'Report updated', report });
    } catch (error) {
      next(error);
    }
  }

  static async getToday(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const dbDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      const report = await ReportService.getByDate(req.user!.id, dbDate);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  static async getMyReports(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await ReportService.getUserReports(req.user!.id, page, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const report = await prisma.eodReport.findUnique({
        where: { id: req.params.id },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
          reviewer: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      if (!report) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }
      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  // Manager endpoints
  static async getTeamReports(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ReportService.getTeamReports(req.user!.id, {
        status: req.query.status as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        employeeId: req.query.employeeId as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async approve(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const report = await ReportService.approveReport(req.params.id, req.user!.id, req.body.comment);
      res.json({ message: 'Report approved', report });
    } catch (error) {
      next(error);
    }
  }

  static async reject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.body.comment) {
        res.status(400).json({ error: 'Comment is required when rejecting a report' });
        return;
      }
      const report = await ReportService.rejectReport(req.params.id, req.user!.id, req.body.comment);
      res.json({ message: 'Report rejected', report });
    } catch (error) {
      next(error);
    }
  }
}
