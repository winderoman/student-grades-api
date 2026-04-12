import { Op } from 'sequelize';
import { Subject, User, Grade, Student } from '../models';
import { UserRole, PaginationQuery } from '../types';
import { getPagination, buildPaginatedResult } from '../utils/pagination';

interface CreateSubjectPayload {
  name: string;
  code: string;
  description?: string;
  credits?: number;
  teacherId: number;
}

export const SubjectService = {
  async create(data: CreateSubjectPayload) {
    const teacher = await User.findOne({
      where: { id: data.teacherId, role: UserRole.TEACHER, isActive: true },
    });
    if (!teacher) throw new Error('Profesor no encontrado o inactivo');

    return Subject.create(data);
  },

  async findAll(query: PaginationQuery & { search?: string; teacherId?: number }) {
    const { limit, offset, page } = getPagination(query);
    const where: Record<string, unknown> = { isActive: true };
    if (query.search) where['name'] = { [Op.like]: `%${query.search}%` };
    if (query.teacherId) where['teacherId'] = query.teacherId;

    const { rows, count } = await Subject.findAndCountAll({
      where,
      limit,
      offset,
      include: [{ model: User, as: 'teacher', attributes: ['id', 'name', 'email'] }],
      order: [['name', 'ASC']],
    });

    return buildPaginatedResult(rows, count, page, limit);
  },

  async findById(id: number) {
    const subject = await Subject.findByPk(id, {
      include: [{ model: User, as: 'teacher', attributes: ['id', 'name', 'email'] }],
    });
    if (!subject) throw new Error('Materia no encontrada');
    return subject;
  },

  async update(id: number, data: Partial<CreateSubjectPayload> & { isActive?: boolean }) {
    const subject = await Subject.findByPk(id);
    if (!subject) throw new Error('Materia no encontrada');

    if (data.teacherId) {
      const teacher = await User.findOne({
        where: { id: data.teacherId, role: UserRole.TEACHER, isActive: true },
      });
      if (!teacher) throw new Error('Profesor no encontrado');
    }

    await subject.update(data);
    return this.findById(id);
  },

  async delete(id: number) {
    const subject = await Subject.findByPk(id);
    if (!subject) throw new Error('Materia no encontrada');
    await subject.update({ isActive: false });
    return { message: 'Materia desactivada correctamente' };
  },

  async getStatsBySubject(subjectId: number, period?: string) {
    const subject = await this.findById(subjectId);
    const where: Record<string, unknown> = { subjectId };
    if (period) where['period'] = period;

    const grades = await Grade.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'student',
          include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
        },
      ],
    });

    if (!grades.length) return { subject, stats: null };

    const scores = grades.map((g) => Number(g.score));
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const passing = scores.filter((s) => s >= 60).length;

    return {
      subject,
      stats: {
        totalStudents: scores.length,
        average: average.toFixed(2),
        max,
        min,
        passingRate: `${((passing / scores.length) * 100).toFixed(1)}%`,
      },
    };
  },
};
