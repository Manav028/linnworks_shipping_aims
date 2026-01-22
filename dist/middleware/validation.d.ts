import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
export declare const validateRequest: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const addNewUserSchema: Joi.ObjectSchema<any>;
export declare const userConfigSchema: Joi.ObjectSchema<any>;
export declare const updateConfigSchema: Joi.ObjectSchema<any>;
export declare const configDeleteSchema: Joi.ObjectSchema<any>;
export declare const userAvailableServicesSchema: Joi.ObjectSchema<any>;
//# sourceMappingURL=validation.d.ts.map