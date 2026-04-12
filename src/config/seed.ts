import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from '../config/database';
import { User, Student, Subject, Grade } from '../models';
import { UserRole } from '../types';
import logger from '../utils/logger';

const seed = async () => {
  await connectDatabase();
  logger.info('🌱 Starting database seed...');

  // Admin
  const admin = await User.create({
    name: 'Administrador',
    email: 'admin@school.edu',
    password: 'Admin123!',
    role: UserRole.ADMIN,
  });

  // Teachers
  const teacher1 = await User.create({
    name: 'Prof. María García',
    email: 'mgarcia@school.edu',
    password: 'Teacher123!',
    role: UserRole.TEACHER,
  });

  const teacher2 = await User.create({
    name: 'Prof. Juan López',
    email: 'jlopez@school.edu',
    password: 'Teacher123!',
    role: UserRole.TEACHER,
  });

  // Students
  const studentUser1 = await User.create({
    name: 'Ana Martínez',
    email: 'ana.martinez@student.edu',
    password: 'Student123!',
    role: UserRole.STUDENT,
  });

  const studentUser2 = await User.create({
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@student.edu',
    password: 'Student123!',
    role: UserRole.STUDENT,
  });

  const student1 = await Student.create({
    userId: studentUser1.id,
    studentCode: 'EST-2024-001',
    grade: '10mo',
    section: 'A',
    parentEmail: 'parent1@gmail.com',
  });

  const student2 = await Student.create({
    userId: studentUser2.id,
    studentCode: 'EST-2024-002',
    grade: '10mo',
    section: 'A',
    parentEmail: 'parent2@gmail.com',
  });

  // Subjects
  const math = await Subject.create({
    name: 'Matemáticas',
    code: 'MAT-101',
    description: 'Álgebra y cálculo básico',
    credits: 4,
    teacherId: teacher1.id,
  });

  const science = await Subject.create({
    name: 'Ciencias Naturales',
    code: 'CIE-101',
    description: 'Biología, química y física',
    credits: 3,
    teacherId: teacher2.id,
  });

  const spanish = await Subject.create({
    name: 'Español',
    code: 'ESP-101',
    description: 'Lengua y literatura',
    credits: 3,
    teacherId: teacher1.id,
  });

  // Grades — period 2024-1
  const gradeData = [
    // Ana - Matemáticas
    { studentId: student1.id, subjectId: math.id, score: 85, gradeType: 'parcial', period: '2024-1' },
    { studentId: student1.id, subjectId: math.id, score: 92, gradeType: 'tarea', period: '2024-1' },
    { studentId: student1.id, subjectId: math.id, score: 78, gradeType: 'final', period: '2024-1' },
    // Ana - Ciencias
    { studentId: student1.id, subjectId: science.id, score: 90, gradeType: 'parcial', period: '2024-1' },
    { studentId: student1.id, subjectId: science.id, score: 88, gradeType: 'final', period: '2024-1' },
    // Ana - Español
    { studentId: student1.id, subjectId: spanish.id, score: 95, gradeType: 'proyecto', period: '2024-1' },
    // Carlos - Matemáticas
    { studentId: student2.id, subjectId: math.id, score: 55, gradeType: 'parcial', period: '2024-1' },
    { studentId: student2.id, subjectId: math.id, score: 62, gradeType: 'final', period: '2024-1' },
    // Carlos - Ciencias
    { studentId: student2.id, subjectId: science.id, score: 70, gradeType: 'parcial', period: '2024-1' },
    { studentId: student2.id, subjectId: science.id, score: 75, gradeType: 'final', period: '2024-1' },
  ];

  for (const g of gradeData) {
    await Grade.create({ ...g, registeredById: teacher1.id, comments: '' });
  }

  logger.info('✅ Seed completed!');
  logger.info('');
  logger.info('👤 Admin:   admin@school.edu / Admin123!');
  logger.info('👤 Teacher: mgarcia@school.edu / Teacher123!');
  logger.info('👤 Teacher: jlopez@school.edu / Teacher123!');
  logger.info('👤 Student: ana.martinez@student.edu / Student123!');
  logger.info('👤 Student: carlos.rodriguez@student.edu / Student123!');
  process.exit(0);
};

seed().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
