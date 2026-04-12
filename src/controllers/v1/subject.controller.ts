import { Request, Response, NextFunction } from 'express';
import { SubjectService } from '../../services/subject.service';
import { sendSuccess, sendCreated } from '../../utils/response';

export const SubjectController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subject = await SubjectService.create(req.body);
      sendCreated(res, subject, 'Materia creada exitosamente');
    } catch (err) {
      next(err);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SubjectService.findAll(req.query as Record<string, string>);
      sendSuccess(res, result, 'Materias obtenidas');
    } catch (err) {
      next(err);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subject = await SubjectService.findById(Number(req.params.id));
      sendSuccess(res, subject, 'Materia encontrada');
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subject = await SubjectService.update(Number(req.params.id), req.body);
      sendSuccess(res, subject, 'Materia actualizada');
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SubjectService.delete(Number(req.params.id));
      sendSuccess(res, result, 'Materia eliminada');
    } catch (err) {
      next(err);
    }
  },

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SubjectService.getStatsBySubject(
        Number(req.params.id),
        req.query.period as string | undefined
      );
      sendSuccess(res, result, 'Estadísticas de la materia');
    } catch (err) {
      next(err);
    }
  },
};
