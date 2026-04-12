import { Request, Response, NextFunction } from 'express';
import { StudentService } from '../../services/student.service';
import { sendSuccess, sendCreated } from '../../utils/response';

export const StudentController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await StudentService.create(req.body);
      sendCreated(res, student, 'Estudiante creado exitosamente');
    } catch (err) {
      next(err);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await StudentService.findAll(req.query as Record<string, string>);
      sendSuccess(res, result, 'Estudiantes obtenidos');
    } catch (err) {
      next(err);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await StudentService.findById(Number(req.params.id));
      sendSuccess(res, student, 'Estudiante encontrado');
    } catch (err) {
      next(err);
    }
  },

  async myProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await StudentService.findByUserId(req.user!.id);
      sendSuccess(res, student, 'Mi perfil');
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await StudentService.update(Number(req.params.id), req.body);
      sendSuccess(res, student, 'Estudiante actualizado');
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await StudentService.delete(Number(req.params.id));
      sendSuccess(res, result, 'Estudiante eliminado');
    } catch (err) {
      next(err);
    }
  },

  async getAverages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await StudentService.getAverageBySubject(
        Number(req.params.id),
        req.query.period as string | undefined
      );
      sendSuccess(res, result, 'Promedios del estudiante');
    } catch (err) {
      next(err);
    }
  },
};
