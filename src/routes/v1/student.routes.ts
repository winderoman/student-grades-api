import { Router } from 'express';
import { StudentController } from '../../controllers/v1/student.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createStudentSchema, updateStudentSchema } from '../../validators/student.validator';
import { UserRole } from '../../types';

const router = Router();

router.use(authenticate);

router.get('/me', authorize(UserRole.STUDENT), StudentController.myProfile);

router.post(
  '/',
  authorize(UserRole.ADMIN),
  validate(createStudentSchema),
  StudentController.create
);

router.get(
  '/',
  authorize(UserRole.ADMIN, UserRole.TEACHER),
  StudentController.findAll
);

router.get(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.TEACHER),
  StudentController.findById
);

router.put(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(updateStudentSchema),
  StudentController.update
);

router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  StudentController.delete
);

router.get(
  '/:id/averages',
  authorize(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT),
  StudentController.getAverages
);

export default router;
