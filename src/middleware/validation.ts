import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      res.status(400).json({
        isError: true,
        errorMessage: `Validation error: ${errorMessage}`
      });
      return;
    }
    next();
  };
};


export const addNewUserSchema = Joi.object({
  Email: Joi.string().email().required(),
  LinnworksUniqueIdentifier: Joi.string().uuid().required(),
  AccountName: Joi.string().required()
});

export const userConfigSchema = Joi.object({
  AuthorizationToken: Joi.string().uuid().required()
});

export const updateConfigSchema = Joi.object({
  AuthorizationToken: Joi.string().uuid().required(),
  ConfigStatus: Joi.string().required(),
  ConfigItems: Joi.array().items(
    Joi.object({
      ConfigItemId: Joi.string().required(),
      SelectedValue: Joi.string().allow('').required()
    })
  ).required()
});

export const configDeleteSchema = Joi.object({
  AuthorizationToken: Joi.string().uuid().required()
});

export const userAvailableServicesSchema = Joi.object({
  AuthorizationToken: Joi.string().uuid().required()
});