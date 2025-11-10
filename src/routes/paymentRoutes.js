import { Router } from 'express';
import { createPayment, listPayments, paymentsStats } from '../controllers/paymentController.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', authRequired, requireRole('cajero', 'cliente', 'gerente'), createPayment);
router.get('/', authRequired, requireRole('cajero', 'cliente', 'gerente'), listPayments);
router.get('/stats', authRequired, requireRole('cajero', 'cliente', 'gerente'), paymentsStats);

export default router;
