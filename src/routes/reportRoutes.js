import { Router } from 'express';
import { customersReport, inventoryReport, ordersReport, paymentsReport, salesReport } from '../controllers/reportController.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/sales', authRequired, requireRole('gerente'), salesReport);
router.get('/inventory', authRequired, requireRole('gerente'), inventoryReport);
router.get('/orders', authRequired, requireRole('gerente'), ordersReport);
router.get('/payments', authRequired, requireRole('gerente'), paymentsReport);
router.get('/customers', authRequired, requireRole('gerente'), customersReport);

export default router;
