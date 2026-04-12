import sequelize from '../config/database';
import { Grade, Student, Subject, User } from '../models';
import { PaginationQuery } from '../types';
import { getPagination, buildPaginatedResult } from '../utils/pagination';

interface CreateGradePayload {
  studentId: number;
  subjectId: number;
  score: number;
  period: string;
  gradeType: string;
  comments?: string;
  registeredById: number;
}

interface BulkGradeItem {
  studentId: number;
  score: number;
  comments?: string;
}

const GRADE_INCLUDES = [
  {
    model: Student,
    as: 'student',
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
  },
  { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
  { model: User, as: 'registeredBy', attributes: ['id', 'name'] },
];

export const GradeService = {
  async create(data: CreateGradePayload) {
    const [student, subject] = await Promise.all([
      Student.findByPk(data.studentId),
      Subject.findByPk(data.subjectId),
    ]);
    if (!student) throw new Error('Estudiante no encontrado');
    if (!subject) throw new Error('Materia no encontrada');

    const grade = await Grade.create(data);
    return Grade.findByPk(grade.id, { include: GRADE_INCLUDES });
  },

  async bulkCreate(
    subjectId: number,
    period: string,
    gradeType: string,
    registeredById: number,
    grades: BulkGradeItem[]
  ) {
    const subject = await Subject.findByPk(subjectId);
    if (!subject) throw new Error('Materia no encontrada');

    const transaction = await sequelize.transaction();
    try {
      const created = await Promise.all(
        grades.map((g) =>
          Grade.create(
            { ...g, subjectId, period, gradeType, registeredById },
            { transaction }
          )
        )
      );
      await transaction.commit();
      return { created: created.length, message: `${created.length} notas registradas exitosamente` };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async findAll(
    query: PaginationQuery & { studentId?: number; subjectId?: number; period?: string }
  ) {
    const { limit, offset, page } = getPagination(query);
    const where: Record<string, unknown> = {};
    if (query.studentId) where['studentId'] = query.studentId;
    if (query.subjectId) where['subjectId'] = query.subjectId;
    if (query.period) where['period'] = query.period;

    const { rows, count } = await Grade.findAndCountAll({
      where,
      limit,
      offset,
      include: GRADE_INCLUDES,
      order: [['createdAt', 'DESC']],
    });

    return buildPaginatedResult(rows, count, page, limit);
  },

  async findById(id: number) {
    const grade = await Grade.findByPk(id, { include: GRADE_INCLUDES });
    if (!grade) throw new Error('Nota no encontrada');
    return grade;
  },

  async update(id: number, data: Partial<CreateGradePayload>) {
    const grade = await Grade.findByPk(id);
    if (!grade) throw new Error('Nota no encontrada');
    await grade.update(data);
    return this.findById(id);
  },

  async delete(id: number) {
    const grade = await Grade.findByPk(id);
    if (!grade) throw new Error('Nota no encontrada');
    await grade.destroy();
    return { message: 'Nota eliminada correctamente' };
  },

  async getAverageByStudent(studentId: number, period?: string) {
    const where: Record<string, unknown> = { studentId };
    if (period) where['period'] = period;

    const grades = await Grade.findAll({
      where,
      include: [{ model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] }],
    });

    const bySubject: Record<number, { subject: unknown; scores: number[] }> = {};
    grades.forEach((g) => {
      if (!bySubject[g.subjectId]) {
        bySubject[g.subjectId] = { subject: g.get('subject'), scores: [] };
      }
      bySubject[g.subjectId].scores.push(Number(g.score));
    });

    const report = Object.values(bySubject).map(({ subject, scores }) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      return {
        subject,
        average: Number(avg.toFixed(2)),
        totalGrades: scores.length,
        status: avg >= 60 ? 'Aprobado' : 'Reprobado',
      };
    });

    const globalAvg = report.length
      ? report.reduce((a, b) => a + b.average, 0) / report.length
      : 0;

    return { studentId, period, report, globalAverage: Number(globalAvg.toFixed(2)) };
  },

  async getGlobalReport(period?: string) {
    const where: Record<string, unknown> = {};
    if (period) where['period'] = period;

    const grades = await Grade.findAll({ where });
    const scores = grades.map((g) => Number(g.score));
    if (!scores.length) return { message: 'Sin datos para el período', stats: null };

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return {
      period: period ?? 'Todos los períodos',
      totalGrades: scores.length,
      globalAverage: Number(avg.toFixed(2)),
      passing: scores.filter((s) => s >= 60).length,
      failing: scores.filter((s) => s < 60).length,
      max: Math.max(...scores),
      min: Math.min(...scores),
    };
  },
};
