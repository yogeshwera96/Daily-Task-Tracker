import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Developer routes
router.post('/generate', ReportController.generate);
router.get('/today', ReportController.getToday);
router.get('/my', ReportController.getMyReports);
router.get('/:id', ReportController.getById);
router.put('/:id', ReportController.updateContent);
router.post('/:id/submit', ReportController.submit);

// Manager routes
router.get('/team/all', authorize('MANAGER', 'ADMIN'), ReportController.getTeamReports);
router.post('/:id/approve', authorize('MANAGER', 'ADMIN'), ReportController.approve);
router.post('/:id/reject', authorize('MANAGER', 'ADMIN'), ReportController.reject);

export default router;
