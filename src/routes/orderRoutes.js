import { Router } from 'express';
import { createOrder, getOrder, listOrders, updateStatus } from '../controllers/orderController.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', authRequired, requireRole('cajero', 'cliente', 'gerente'), createOrder);
router.get('/', authRequired, requireRole('cajero', 'gerente', 'cliente'), listOrders);
router.get('/:id', authRequired, requireRole('cajero', 'gerente', 'cliente'), getOrder);
router.patch('/:id/status', authRequired, requireRole('cajero', 'gerente'), updateStatus);

export default router;
