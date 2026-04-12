import { Router } from 'express';
import { GradeController } from '../../controllers/v1/grade.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createGradeSchema,
  updateGradeSchema,
  bulkGradeSchema,
  reportQuerySchema,
} from '../../validators/grade.validator';
import { UserRole } from '../../types';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize(UserRole.TEACHER, UserRole.ADMIN),
  validate(createGradeSchema),
  GradeController.create
);

router.post(
  '/bulk',
  authorize(UserRole.TEACHER, UserRole.ADMIN),
  validate(bulkGradeSchema),
  GradeController.bulkCreate
);

router.get(
  '/',
  authorize(UserRole.ADMIN, UserRole.TEACHER),
  validate(reportQuerySchema, 'query'),
  GradeController.findAll
);

router.get(
  '/report/global',
  authorize(UserRole.ADMIN),
  GradeController.getGlobalReport
);

router.get(
  '/report/student/:studentId',
  authorize(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT),
  GradeController.getStudentReport
);

router.get(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT),
  GradeController.findById
);

router.put(
  '/:id',
  authorize(UserRole.TEACHER, UserRole.ADMIN),
  validate(updateGradeSchema),
  GradeController.update
);

router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  GradeController.delete
);

export default router;
