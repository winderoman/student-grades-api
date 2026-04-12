import { Router } from 'express';
import { ReportController } from '../../controllers/v1/report.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { UserRole } from '../../types';

const router = Router();

router.use(authenticate);

/** Student self-service */
router.get('/my', authorize(UserRole.STUDENT), ReportController.myReport);

/** Per-student exports */
router.get(
  '/student/:studentId/excel',
  authorize(UserRole.ADMIN, UserRole.TEACHER),
  ReportController.exportStudentExcel
);

router.get(
  '/student/:studentId/pdf',
  authorize(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT),
  ReportController.exportStudentPDF
);

/** Email bulletins */
router.post(
  '/student/:studentId/send-bulletin',
  authorize(UserRole.ADMIN, UserRole.TEACHER),
  ReportController.sendBulletin
);

router.post(
  '/send-bulk-bulletins',
  authorize(UserRole.ADMIN),
  ReportController.sendBulkBulletins
);

/** Global reports */
router.get(
  '/global/excel',
  authorize(UserRole.ADMIN),
  ReportController.exportGlobalExcel
);

/** Google Drive */
router.post(
  '/student/:studentId/drive',
  authorize(UserRole.ADMIN),
  ReportController.uploadToDrive
);

router.get(
  '/drive/list',
  authorize(UserRole.ADMIN),
  ReportController.listDriveReports
);

export default router;
