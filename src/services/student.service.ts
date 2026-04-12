import { Op } from 'sequelize';
import { Student, User, Grade, Subject } from '../models';
import { UserRole, PaginationQuery } from '../types';
import { getPagination, buildPaginatedResult } from '../utils/pagination';
import { AppError } from '../utils/AppError';

interface CreateStudentPayload {
  name: string;
  email: string;
  password: string;
  studentCode: string;
  grade: string;
  section?: string;
  parentEmail?: string;
}

interface UpdateStudentPayload {
  name?: string;
  email?: string;
  grade?: string;
  section?: string;
  parentEmail?: string;
  isActive?: boolean;
}

export const StudentService = {
  async create(data: CreateStudentPayload) {
    const existingEmail = await User.findOne({ where: { email: data.email } });
    if (existingEmail) throw new AppError('El email ya está en uso',422);

    const existingCode = await Student.findOne({ where: { studentCode: data.studentCode } });
    if (existingCode) throw new AppError('El código de estudiante ya existe',422);

    const user = await User.create({
      name: data.name,
      email: data.email,
      password: data.password,
      role: UserRole.STUDENT,
    });

    const student = await Student.create({
      userId: user.id,
      studentCode: data.studentCode,
      grade: data.grade,
      section: data.section,
      parentEmail: data.parentEmail,
    });

    return Student.findByPk(student.id, {
      include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }],
    });
  },

  async findAll(query: PaginationQuery & { search?: string }) {
    const { limit, offset, page } = getPagination(query);
    const where = query.search
      ? { studentCode: { [Op.like]: `%${query.search}%` } }
      : {};

    const { rows, count } = await Student.findAndCountAll({
      where,
      limit,
      offset,
      include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }],
      order: [['id', 'ASC']],
    });

    return buildPaginatedResult(rows, count, page, limit);
  },

  async findById(id: number) {
    const student = await Student.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }],
    });
    if (!student) throw new AppError('Estudiante no encontrado',404);
    return student;
  },

  async findByUserId(userId: number) {
    const student = await Student.findOne({
      where: { userId },
      include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }],
    });
    if (!student) throw new AppError('Perfil de estudiante no encontrado',404);
    return student;
  },

  async update(id: number, data: UpdateStudentPayload) {
    const student = await Student.findByPk(id, {
      include: [{ model: User, as: 'user' }],
    });
    if (!student) throw new AppError('Estudiante no encontrado',404);

    const { name, email, isActive, ...studentData } = data;

    if (name || email || isActive !== undefined) {
      await User.update(
        { ...(name && { name }), ...(email && { email }), ...(isActive !== undefined && { isActive }) },
        { where: { id: student.userId } }
      );
    }

    await student.update(studentData);
    return this.findById(id);
  },

  async delete(id: number) {
    const student = await Student.findByPk(id);
    if (!student) throw new AppError('Estudiante no encontrado',404);
    await User.update({ isActive: false }, { where: { id: student.userId } });
    return { message: 'Estudiante desactivado correctamente' };
  },

  async getAverageBySubject(studentId: number, period?: string) {
    const student = await this.findById(studentId);
    const whereClause: Record<string, unknown> = { studentId };
    if (period) whereClause['period'] = period;

    const grades = await Grade.findAll({
      where: whereClause,
      include: [{ model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] }],
    });

    const grouped: Record<number, { subject: unknown; scores: number[] }> = {};
    grades.forEach((g) => {
      if (!grouped[g.subjectId]) {
        grouped[g.subjectId] = { subject: g.get('subject'), scores: [] };
      }
      grouped[g.subjectId].scores.push(Number(g.score));
    });

    const averages = Object.entries(grouped).map(([, val]) => ({
      subject: val.subject,
      average: (val.scores.reduce((a, b) => a + b, 0) / val.scores.length).toFixed(2),
      totalGrades: val.scores.length,
    }));

    return { student, averages };
  },
};
