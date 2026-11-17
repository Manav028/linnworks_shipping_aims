import { Router } from 'express';
import { courierServiceController } from '../controllers/CourierServiceController'
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest } from '../middleware/validation';
import {addNewCourierSchema} from '../middleware/validation'

const router = Router();

router.post(
  '/AddNewCourierService',
  authenticate,
  // validateRequest(addNewCourierSchema),
  asyncHandler(courierServiceController.create.bind(courierServiceController))
);

export default router;