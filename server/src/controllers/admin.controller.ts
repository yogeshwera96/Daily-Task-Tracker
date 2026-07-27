import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';

export class AdminController {
  // --- User Management ---
  static async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { role, search, page = '1', limit = '20' } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};
      if (role) where.role = role;
      if (search) {
        where.OR = [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true, email: true, firstName: true, lastName: true, role: true,
            avatar: true, designation: true, isActive: true, lastLogin: true, createdAt: true,
            department: { select: { id: true, name: true } },
            manager: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit as string),
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        users,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, role, departmentId, managerId, designation } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) throw new AppError('Email already in use', 409);

      const hashedPassword = await bcrypt.hash(password || 'Password@123', 12);

      const user = await prisma.user.create({
        data: {
          email, password: hashedPassword, firstName, lastName,
          role: role || 'DEVELOPER', departmentId, managerId, designation,
          emailVerified: true,
        },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id, action: 'USER_CREATED', entity: 'User',
          entityId: user.id, details: `Created user: ${email} (${role})`, ipAddress: req.ip,
        },
      });

      res.status(201).json({ message: 'User created', user });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { firstName, lastName, role, departmentId, managerId, designation, isActive } = req.body;

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { firstName, lastName, role, departmentId, managerId, designation, isActive },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
      });

      res.json({ message: 'User updated', user });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });
      res.json({ message: 'User deactivated' });
    } catch (error) {
      next(error);
    }
  }

  // --- Department Management ---
  static async getDepartments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const departments = await prisma.department.findMany({
        include: {
          manager: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { users: true, projects: true } },
        },
        orderBy: { name: 'asc' },
      });
      res.json(departments);
    } catch (error) {
      next(error);
    }
  }

  static async createDepartment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dept = await prisma.department.create({ data: req.body });
      res.status(201).json({ message: 'Department created', department: dept });
    } catch (error) {
      next(error);
    }
  }

  static async updateDepartment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dept = await prisma.department.update({ where: { id: req.params.id }, data: req.body });
      res.json({ message: 'Department updated', department: dept });
    } catch (error) {
      next(error);
    }
  }

  // --- Project Management ---
  static async getProjects(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projects = await prisma.project.findMany({
        include: {
          manager: { select: { id: true, firstName: true, lastName: true } },
          department: { select: { id: true, name: true } },
          _count: { select: { tasks: true, assignments: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(projects);
    } catch (error) {
      next(error);
    }
  }

  static async createProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const project = await prisma.project.create({ data: req.body });
      res.status(201).json({ message: 'Project created', project });
    } catch (error) {
      next(error);
    }
  }

  static async updateProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const project = await prisma.project.update({ where: { id: req.params.id }, data: req.body });
      res.json({ message: 'Project updated', project });
    } catch (error) {
      next(error);
    }
  }

  static async assignUserToProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId, projectId, role } = req.body;
      const assignment = await prisma.projectAssignment.create({
        data: { userId, projectId, role: role || 'DEVELOPER' },
      });
      res.status(201).json({ message: 'User assigned to project', assignment });
    } catch (error) {
      next(error);
    }
  }

  // --- Settings ---
  static async getSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { category } = req.query;
      const where: any = {};
      if (category) where.category = category;

      const settings = await prisma.setting.findMany({ where, orderBy: { category: 'asc' } });
      res.json(settings);
    } catch (error) {
      next(error);
    }
  }

  static async updateSetting(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { key, value } = req.body;
      const setting = await prisma.setting.upsert({
        where: { key },
        create: { key, value, category: req.body.category || 'GENERAL' },
        update: { value },
      });
      res.json({ message: 'Setting updated', setting });
    } catch (error) {
      next(error);
    }
  }

  // --- Audit Logs ---
  static async getAuditLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '50', userId, action, entity } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};
      if (userId) where.userId = userId;
      if (action) where.action = { contains: action };
      if (entity) where.entity = entity;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit as string),
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.json({
        logs,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // --- Holidays ---
  static async getHolidays(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const holidays = await prisma.holiday.findMany({ orderBy: { date: 'asc' } });
      res.json(holidays);
    } catch (error) {
      next(error);
    }
  }

  static async createHoliday(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const holiday = await prisma.holiday.create({
        data: { ...req.body, date: new Date(req.body.date) },
      });
      res.status(201).json({ message: 'Holiday created', holiday });
    } catch (error) {
      next(error);
    }
  }

  static async deleteHoliday(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.holiday.delete({ where: { id: req.params.id } });
      res.json({ message: 'Holiday deleted' });
    } catch (error) {
      next(error);
    }
  }
}
