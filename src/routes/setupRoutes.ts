import { Router } from 'express';
import { setupController } from '../controllers/setupController';
import { authenticate } from '../middleware/auth';
import { userAvailableServicesSchema, validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import {
  addNewUserSchema,
  userConfigSchema,
  updateConfigSchema,
  configDeleteSchema
} from '../middleware/validation';

const router = Router();

router.post(
  '/AddNewUser',
  validateRequest(addNewUserSchema),
  asyncHandler(setupController.addNewUser.bind(setupController))
);

router.post(
  '/UserConfig',
  validateRequest(userConfigSchema),
  authenticate,
  asyncHandler(setupController.userConfig.bind(setupController))
);

router.post(
  '/UpdateConfig',
  validateRequest(updateConfigSchema),
  authenticate,
  asyncHandler(setupController.updateConfig.bind(setupController))
);

router.post(
  '/ConfigDelete',
  validateRequest(configDeleteSchema),
  authenticate,
  asyncHandler(setupController.configDelete.bind(setupController))
);

router.post(
  '/UserAvailableServices',
  validateRequest(userAvailableServicesSchema),
  authenticate,
  asyncHandler(setupController.userAvailableServices.bind(setupController))
);

export default router;