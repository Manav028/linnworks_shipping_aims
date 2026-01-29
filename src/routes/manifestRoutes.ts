import { Router } from 'express';
import { manifestController, ManifestController } from '../controllers/manifestController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.post(
  '/CreateManifest',
  authenticate,
  asyncHandler(manifestController.createManifest.bind(manifestController))
);

router.post(
  '/PrintManifest',
  authenticate,
  asyncHandler(manifestController.printManifest.bind(manifestController))
);

router.post(
  '/getManifests',
  authenticate,
  asyncHandler(manifestController.getManifests.bind(manifestController))
);

router.post(
  '/ManifestStats',
  authenticate,
  asyncHandler(manifestController.getManifestStats.bind(manifestController))
);

router.post(
  '/ManifestDetails/:manifestId',
  authenticate,
  asyncHandler(manifestController.getManifestDetails.bind(manifestController))
);



export default router;