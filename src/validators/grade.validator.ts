import Joi from 'joi';

export const createGradeSchema = Joi.object({
  studentId: Joi.number().integer().positive().required(),
  subjectId: Joi.number().integer().positive().required(),
  score: Joi.number().min(0).max(100).required().messages({
    'number.min': 'La nota no puede ser menor a 0',
    'number.max': 'La nota no puede ser mayor a 100',
  }),
  period: Joi.string().max(20).required().example('2024-1'),
  gradeType: Joi.string()
    .valid('parcial', 'final', 'tarea', 'proyecto', 'examen')
    .required(),
  comments: Joi.string().max(500).optional(),
});

export const updateGradeSchema = Joi.object({
  score: Joi.number().min(0).max(100).optional(),
  period: Joi.string().max(20).optional(),
  gradeType: Joi.string()
    .valid('parcial', 'final', 'tarea', 'proyecto', 'examen')
    .optional(),
  comments: Joi.string().max(500).allow('').optional(),
});

export const bulkGradeSchema = Joi.object({
  subjectId: Joi.number().integer().positive().required(),
  period: Joi.string().max(20).required(),
  gradeType: Joi.string()
    .valid('parcial', 'final', 'tarea', 'proyecto', 'examen')
    .required(),
  grades: Joi.array()
    .items(
      Joi.object({
        studentId: Joi.number().integer().positive().required(),
        score: Joi.number().min(0).max(100).required(),
        comments: Joi.string().max(500).optional(),
      })
    )
    .min(1)
    .required(),
});

export const reportQuerySchema = Joi.object({
  studentId: Joi.number().integer().positive().optional(),
  subjectId: Joi.number().integer().positive().optional(),
  period: Joi.string().max(20).optional(),
  page: Joi.number().integer().positive().optional(),
  limit: Joi.number().integer().positive().max(100).optional(),
});
