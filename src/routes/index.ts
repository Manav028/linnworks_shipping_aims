import { Router } from 'express';
import setupRoutes from './setupRoutes';
import bulkLabelRoutes from './bulkLabelRoutes';
import consignmentRoutes from './consignmentRoutes';
import manifestRoutes from './manifestRoutes';
import CourierServiceRoutes from './courierserviceRoutes';

const router = Router();

router.use('/Setup', setupRoutes);
router.use('/PrepaidLabel', bulkLabelRoutes);
router.use('/Consignment', consignmentRoutes);
router.use('/Manifest', manifestRoutes);
router.use('/CourierService',CourierServiceRoutes );

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;