import { Router } from 'express';
import { createProduct, deleteProduct, getProduct, listProducts, updateProduct } from '../controllers/productController.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authRequired, listProducts);
router.get('/:id', authRequired, getProduct);
router.post('/', authRequired, requireRole('gerente'), createProduct);
router.put('/:id', authRequired, requireRole('gerente'), updateProduct);
router.delete('/:id', authRequired, requireRole('gerente'), deleteProduct);

export default router;
