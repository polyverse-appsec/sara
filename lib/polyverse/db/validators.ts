import Joi from 'joi'

export const projectNameSchema = Joi.string()
  .pattern(/^[A-Za-z0-9 _\-.]+$/)
  .required()
