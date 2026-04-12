import { Request, Response, NextFunction } from 'express';
import { GradeService } from '../../services/grade.service';
import { StudentService } from '../../services/student.service';
import { ExportService } from '../../services/export.service';
import { EmailService } from '../../services/email.service';
import { DriveService } from '../../services/drive.service';
import { Grade, Subject, Student, User } from '../../models';
import { sendSuccess } from '../../utils/response';
import logger from '../../utils/logger';

export const ReportController = {
  async exportStudentExcel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId } = req.params;
      const { period } = req.query as { period?: string };

      const report = await GradeService.getAverageByStudent(Number(studentId), period);
      logger.info(report);
      const student = await StudentService.findById(Number(studentId));
      const user = student.get('user') as User;

      const grades = await Grade.findAll({
        where: { studentId: Number(studentId), ...(period && { period }) },
        include: [{ model: Subject, as: 'subject', attributes: ['name', 'code'] }],
      });

      const rows = grades.map((g) => {
        const sub = g.get('subject') as { name: string; code: string };
        return {
          studentName: user.name,
          studentCode: student.studentCode,
          subject: `${sub.name} (${sub.code})`,
          period: g.period,
          gradeType: g.gradeType,
          score: Number(g.score),
        };
      });

      const buffer = await ExportService.generateExcel(
        rows,
        `Notas - ${user.name} — Período ${period ?? 'Todos'}`
      );

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="notas_${student.studentCode}.xlsx"`);
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  },

  async exportStudentPDF(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId } = req.params;
      const { period } = req.query as { period?: string };

      const reportData = await GradeService.getAverageByStudent(Number(studentId), period);
      const student = await StudentService.findById(Number(studentId));
      const user = student.get('user') as User;

      const buffer = await ExportService.generatePDF({
        studentName: user.name,
        studentCode: student.studentCode,
        period: period ?? 'Todos los períodos',
        subjects: reportData.report.map((r) => ({
          name: (r.subject as { name: string }).name,
          average: r.average,
          totalGrades: r.totalGrades,
          status: r.status,
        })),
        globalAverage: reportData.globalAverage,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="boletin_${student.studentCode}.pdf"`);
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  },

  async exportGlobalExcel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period } = req.query as { period?: string };

      const grades = await Grade.findAll({
        where: period ? { period } : {},
        include: [
          {
            model: Student,
            as: 'student',
            include: [{ model: User, as: 'user', attributes: ['name'] }],
          },
          { model: Subject, as: 'subject', attributes: ['name', 'code'] },
        ],
      });

      const rows = grades.map((g) => {
        const stu = g.get('student') as Student & { user: User };
        const sub = g.get('subject') as { name: string; code: string };
        return {
          studentName: stu.user.name,
          studentCode: stu.studentCode,
          subject: `${sub.name} (${sub.code})`,
          period: g.period,
          gradeType: g.gradeType,
          score: Number(g.score),
        };
      });

      const buffer = await ExportService.generateExcel(
        rows,
        `Reporte Global de Notas — ${period ?? 'Todos los períodos'}`
      );

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="reporte_global.xlsx"');
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  },

  async sendBulletin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId } = req.params;
      const { period } = req.body as { period: string };

      const reportData = await GradeService.getAverageByStudent(Number(studentId), period);
      const student = await StudentService.findById(Number(studentId));
      const user = student.get('user') as User;

      const emailTo = student.parentEmail ?? user.email;

      await EmailService.sendBulletin({
        to: emailTo,
        studentName: user.name,
        period,
        report: reportData.report.map((r) => ({
          subject: r.subject as { name: string; code: string },
          average: r.average,
          totalGrades: r.totalGrades,
          status: r.status,
        })),
        globalAverage: reportData.globalAverage,
      });

      sendSuccess(res, { sentTo: emailTo }, `Boletín enviado a ${emailTo}`);
    } catch (err) {
      next(err);
    }
  },

  async sendBulkBulletins(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period } = req.body as { period: string };

      const students = await Student.findAll({
        include: [{ model: User, as: 'user', where: { isActive: true } }],
      });

      const bulletins = await Promise.all(
        students.map(async (student) => {
          const user = student.get('user') as User;
          const reportData = await GradeService.getAverageByStudent(student.id, period);
          return {
            to: student.parentEmail ?? user.email,
            studentName: user.name,
            period,
            report: reportData.report.map((r) => ({
              subject: r.subject as { name: string; code: string },
              average: r.average,
              totalGrades: r.totalGrades,
              status: r.status,
            })),
            globalAverage: reportData.globalAverage,
          };
        })
      );

      const result = await EmailService.sendBulkBulletins(bulletins);
      sendSuccess(res, result, `Boletines procesados: ${result.sent} enviados, ${result.failed} fallidos`);
    } catch (err) {
      next(err);
    }
  },

  async uploadToDrive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId } = req.params;
      const { period } = req.query as { period?: string };

      const reportData = await GradeService.getAverageByStudent(Number(studentId), period);
      const student = await StudentService.findById(Number(studentId));
      const user = student.get('user') as User;

      const buffer = await ExportService.generatePDF({
        studentName: user.name,
        studentCode: student.studentCode,
        period: period ?? 'Todos los períodos',
        subjects: reportData.report.map((r) => ({
          name: (r.subject as { name: string }).name,
          average: r.average,
          totalGrades: r.totalGrades,
          status: r.status,
        })),
        globalAverage: reportData.globalAverage,
      });

      const fileName = `boletin_${student.studentCode}_${period ?? 'all'}_${Date.now()}.pdf`;
      const driveFile = await DriveService.uploadFile(fileName, 'application/pdf', buffer);

      sendSuccess(res, driveFile, 'Boletín subido a Google Drive');
    } catch (err) {
      next(err);
    }
  },

  async listDriveReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = await DriveService.listReports();
      sendSuccess(res, files, 'Reportes en Google Drive');
    } catch (err) {
      next(err);
    }
  },

  async myReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await StudentService.findByUserId(req.user!.id);
      const result = await GradeService.getAverageByStudent(
        student.id,
        req.query.period as string | undefined
      );
      sendSuccess(res, result, 'Mi reporte de calificaciones');
    } catch (err) {
      next(err);
    }
  },
};
