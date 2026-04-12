import { Router } from 'express';
import authRoutes from './auth.routes';
import studentRoutes from './student.routes';
import subjectRoutes from './subject.routes';
import gradeRoutes from './grade.routes';
import reportRoutes from './report.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/subjects', subjectRoutes);
router.use('/grades', gradeRoutes);
router.use('/reports', reportRoutes);

export default router;
