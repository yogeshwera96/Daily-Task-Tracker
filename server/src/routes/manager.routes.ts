import { Router } from 'express';
import { ManagerController } from '../controllers/manager.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('MANAGER', 'ADMIN'));

router.get('/team', ManagerController.getTeam);
router.get('/employee/:employeeId/stats', ManagerController.getEmployeeStats);
router.get('/analytics', ManagerController.getManagerAnalytics);

export default router;
