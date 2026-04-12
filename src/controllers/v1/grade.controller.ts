import { Request, Response, NextFunction } from 'express';
import { GradeService } from '../../services/grade.service';
import { sendSuccess, sendCreated } from '../../utils/response';

export const GradeController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const grade = await GradeService.create({ ...req.body, registeredById: req.user!.id });
      sendCreated(res, grade, 'Nota registrada exitosamente');
    } catch (err) {
      next(err);
    }
  },

  async bulkCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { subjectId, period, gradeType, grades } = req.body;
      const result = await GradeService.bulkCreate(
        subjectId, period, gradeType, req.user!.id, grades
      );
      sendCreated(res, result, result.message);
    } catch (err) {
      next(err);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await GradeService.findAll(req.query as Record<string, string>);
      sendSuccess(res, result, 'Notas obtenidas');
    } catch (err) {
      next(err);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const grade = await GradeService.findById(Number(req.params.id));
      sendSuccess(res, grade, 'Nota encontrada');
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const grade = await GradeService.update(Number(req.params.id), req.body);
      sendSuccess(res, grade, 'Nota actualizada');
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await GradeService.delete(Number(req.params.id));
      sendSuccess(res, result, 'Nota eliminada');
    } catch (err) {
      next(err);
    }
  },

  async getStudentReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await GradeService.getAverageByStudent(
        Number(req.params.studentId),
        req.query.period as string | undefined
      );
      sendSuccess(res, result, 'Reporte del estudiante');
    } catch (err) {
      next(err);
    }
  },

  async getGlobalReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await GradeService.getGlobalReport(req.query.period as string | undefined);
      sendSuccess(res, result, 'Reporte global');
    } catch (err) {
      next(err);
    }
  },
};
