import { Router } from 'express';
import authRoutes from './auth.routes';
import taskRoutes from './task.routes';
import reportRoutes from './report.routes';
import adminRoutes from './admin.routes';
import managerRoutes from './manager.routes';
import dashboardRoutes from './dashboard.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/reports', reportRoutes);
router.use('/admin', adminRoutes);
router.use('/manager', managerRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);

export default router;
