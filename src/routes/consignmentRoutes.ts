import { Router } from 'express';
import { consignmentController } from '../controllers/consignmentController';
import { authenticate } from '../middleware/auth';

const router = Router();


router.post('/GenerateLabel',authenticate ,consignmentController.generateLabel.bind(consignmentController));
router.post('/CancelLabel', authenticate,consignmentController.cancelLabel.bind(consignmentController));

export default router;