import { Router } from 'express';
import { SubjectController } from '../../controllers/v1/subject.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createSubjectSchema, updateSubjectSchema } from '../../validators/subject.validator';
import { UserRole } from '../../types';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize(UserRole.ADMIN),
  validate(createSubjectSchema),
  SubjectController.create
);

router.get(
  '/',
  authorize(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT),
  SubjectController.findAll
);

router.get(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT),
  SubjectController.findById
);

router.put(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(updateSubjectSchema),
  SubjectController.update
);

router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  SubjectController.delete
);

router.get(
  '/:id/stats',
  authorize(UserRole.ADMIN, UserRole.TEACHER),
  SubjectController.getStats
);

export default router;
