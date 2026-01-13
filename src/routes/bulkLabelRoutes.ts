import { Router } from 'express';
import { bulkLabelController } from '../controllers/bulkLabelController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.post(
  '/UploadBulkLabels',
  authenticate,
  upload.single('file'),
  asyncHandler(bulkLabelController.uploadBulkLabels.bind(bulkLabelController))
);

router.get(
  '/ProcessingStatus/:bulkUploadId',
  authenticate,
  asyncHandler(bulkLabelController.getProcessingStatus.bind(bulkLabelController))
);

router.get(
  '/PoolStatus',
  authenticate,
  asyncHandler(bulkLabelController.getPoolStatus.bind(bulkLabelController))
);

export default router;