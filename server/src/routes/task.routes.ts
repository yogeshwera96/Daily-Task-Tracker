import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createTaskSchema, updateTaskSchema, taskFilterSchema } from '../validators/task.validator';

const router = Router();

router.use(authenticate);

router.post('/', validate(createTaskSchema), TaskController.create);
router.get('/', validate(taskFilterSchema, 'query'), TaskController.list);
router.get('/today', TaskController.getTodayTasks);
router.get('/stats', TaskController.getStats);
router.get('/export', TaskController.exportTasks);
router.get('/:id', TaskController.getById);
router.put('/:id', validate(updateTaskSchema), TaskController.update);
router.delete('/:id', TaskController.delete);

export default router;
