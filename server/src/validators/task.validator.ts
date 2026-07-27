import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  projectId: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'ON_HOLD', 'TESTING', 'REVIEW']).optional().default('TODO'),
  category: z.string().optional(),
  module: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
  dueDate: z.string().datetime().optional(),
  remarks: z.string().optional(),
  tags: z.string().optional(),
  dependencies: z.string().optional(),
  userId: z.string().uuid().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  completionDate: z.string().datetime().optional().nullable(),
});

export const taskFilterSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  projectId: z.string().optional(),
  userId: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;
