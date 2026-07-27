import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

// User CRUD
router.get('/users', AdminController.getUsers);
router.post('/users', AdminController.createUser);
router.put('/users/:id', AdminController.updateUser);
router.delete('/users/:id', AdminController.deleteUser);

// Department CRUD
router.get('/departments', AdminController.getDepartments);
router.post('/departments', AdminController.createDepartment);
router.put('/departments/:id', AdminController.updateDepartment);

// Project CRUD
router.get('/projects', AdminController.getProjects);
router.post('/projects', AdminController.createProject);
router.put('/projects/:id', AdminController.updateProject);
router.post('/projects/assign', AdminController.assignUserToProject);

// Settings
router.get('/settings', AdminController.getSettings);
router.post('/settings', AdminController.updateSetting);

// Audit logs
router.get('/audit-logs', AdminController.getAuditLogs);

// Holidays
router.get('/holidays', AdminController.getHolidays);
router.post('/holidays', AdminController.createHoliday);
router.delete('/holidays/:id', AdminController.deleteHoliday);

export default router;
