import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/developer', authorize('DEVELOPER'), DashboardController.getDeveloperDashboard);
router.get('/manager', authorize('MANAGER'), DashboardController.getManagerDashboard);
router.get('/admin', authorize('ADMIN'), DashboardController.getAdminDashboard);

export default router;
