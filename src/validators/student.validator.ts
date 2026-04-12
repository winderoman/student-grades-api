import Joi from 'joi';

export const createStudentSchema = Joi.object({
  name: Joi.string().min(3).max(150).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  studentCode: Joi.string().max(20).required(),
  grade: Joi.string().max(20).required(),
  section: Joi.string().max(10).optional(),
  parentEmail: Joi.string().email().optional(),
});

export const updateStudentSchema = Joi.object({
  name: Joi.string().min(3).max(150).optional(),
  email: Joi.string().email().optional(),
  grade: Joi.string().max(20).optional(),
  section: Joi.string().max(10).optional(),
  parentEmail: Joi.string().email().allow('').optional(),
  isActive: Joi.boolean().optional(),
});

export const studentIdSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});
