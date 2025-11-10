import { query } from '../db/index.js';

export async function listInventory(req, res, next) {
  try {
    const result = await query(`SELECT i.product_id, p.name, i.stock_level, i.last_updated
                                FROM inventory i JOIN products p ON p.product_id=i.product_id
                                ORDER BY p.name`);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

export async function updateStock(req, res, next) {
  try {
    const { productId } = req.params;
    const { stock_level } = req.body;
    if (stock_level == null || stock_level < 0) return res.status(400).json({ success: false, message: 'Nivel de stock inválido' });
    const result = await query('UPDATE inventory SET stock_level=$1, last_updated=NOW() WHERE product_id=$2 RETURNING product_id, stock_level, last_updated', [stock_level, productId]);
    if (!result.rowCount) return res.status(404).json({ success: false, message: 'Inventario no encontrado' });
    res.json({ success: true, data: result.rows[0], message: 'Stock actualizado' });
  } catch (err) { next(err); }
}

export async function lowStock(req, res, next) {
  try {
    const threshold = Number(req.query.threshold || process.env.LOW_STOCK_THRESHOLD || 10);
    const result = await query(`SELECT i.product_id, p.name, i.stock_level
                                FROM inventory i JOIN products p ON p.product_id=i.product_id
                                WHERE i.stock_level <= $1 ORDER BY i.stock_level ASC`, [threshold]);
    res.json({ success: true, data: result.rows, meta: { threshold } });
  } catch (err) { next(err); }
}
