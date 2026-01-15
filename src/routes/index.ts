import { Router } from 'express';
import setupRoutes from './setupRoutes';
import bulkLabelRoutes from './bulkLabelRoutes';
import consignmentRoutes from './consignmentRoutes';

const router = Router();

router.use('/Setup', setupRoutes);
router.use('/PrepaidLabel', bulkLabelRoutes);
router.use('/Consignment', consignmentRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;