import Joi from 'joi';

export const createSubjectSchema = Joi.object({
  name: Joi.string().min(2).max(150).required(),
  code: Joi.string().max(20).required(),
  description: Joi.string().max(500).optional(),
  credits: Joi.number().integer().min(1).max(10).optional(),
  teacherId: Joi.number().integer().positive().required(),
});

export const updateSubjectSchema = Joi.object({
  name: Joi.string().min(2).max(150).optional(),
  description: Joi.string().max(500).optional(),
  credits: Joi.number().integer().min(1).max(10).optional(),
  teacherId: Joi.number().integer().positive().optional(),
  isActive: Joi.boolean().optional(),
});
