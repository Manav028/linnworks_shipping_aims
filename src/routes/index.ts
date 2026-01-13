import { Router } from 'express';
import setupRoutes from './setupRoutes';
import bulkLabelRoutes from './bulkLabelRoutes';

const router = Router();

router.use('/Setup', setupRoutes);
router.use('/PrepaidLabel', bulkLabelRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;