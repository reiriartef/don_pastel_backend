import { query, runInTransaction } from '../db/index.js';

const ORDER_STATUSES = ['pendiente', 'en_preparacion', 'listo', 'entregado'];

export async function createOrder(req, res, next) {
  try {
    const { items } = req.body; // [{product_id, quantity}]
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'Items requeridos' });
    }
    for (const it of items) {
      if (!it.product_id || !it.quantity || it.quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Item inválido' });
      }
    }
    const userId = req.user.id;

    const result = await runInTransaction(async (client) => {
      const productIds = items.map(i => i.product_id);
      const inventoryRows = await client.query(`SELECT i.product_id, i.stock_level, p.price, p.name
                                                FROM inventory i JOIN products p ON p.product_id=i.product_id
                                                WHERE i.product_id = ANY($1::int[]) FOR UPDATE`, [productIds]);
      if (inventoryRows.rowCount !== items.length) {
        throw { status: 400, publicMessage: 'Producto inexistente en inventario' };
      }
      let total = 0;
      for (const it of items) {
        const inv = inventoryRows.rows.find(r => r.product_id === it.product_id);
        if (inv.stock_level < it.quantity) {
          throw { status: 400, publicMessage: `Stock insuficiente para producto ${inv.name}` };
        }
        total += Number(inv.price) * it.quantity;
      }

      const orderIns = await client.query('INSERT INTO orders (user_id, status, total_amount) VALUES ($1,$2,$3) RETURNING order_id, status, total_amount, order_date', [userId, 'pendiente', total]);
      const orderId = orderIns.rows[0].order_id;

      for (const it of items) {
        const inv = inventoryRows.rows.find(r => r.product_id === it.product_id);
        await client.query('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1,$2,$3,$4)', [orderId, it.product_id, it.quantity, inv.price]);
        await client.query('UPDATE inventory SET stock_level = stock_level - $1, last_updated=NOW() WHERE product_id=$2', [it.quantity, it.product_id]);
      }

      const itemsRows = await client.query(`SELECT oi.order_item_id as id, oi.product_id, p.name, oi.quantity, oi.unit_price
                                            FROM order_items oi JOIN products p ON p.product_id=oi.product_id
                                            WHERE oi.order_id=$1`, [orderId]);

      return { order: orderIns.rows[0], items: itemsRows.rows };
    });

    res.status(201).json({ success: true, data: { order_id: result.order.order_id, status: result.order.status, total_amount: result.order.total_amount, order_date: result.order.order_date, items: result.items }, message: 'Orden creada' });
  } catch (err) { next(err); }
}

export async function listOrders(req, res, next) {
  try {
    const { status } = req.query;
    const conditions = [];
    const params = [];
    if (status) {
      conditions.push('o.status = $' + (params.length + 1));
      params.push(status);
    }
    if (req.user.role === 'cliente') {
      conditions.push('o.user_id = $' + (params.length + 1));
      params.push(req.user.id);
    }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const sql = `SELECT o.order_id, o.order_date, o.status, o.total_amount, u.username,
            (p.payment_id IS NOT NULL) AS is_paid
         FROM orders o JOIN users u ON u.user_id=o.user_id
         LEFT JOIN payments p ON p.order_id = o.order_id
                 ${where}
                 ORDER BY o.order_date DESC LIMIT 100`;
    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

export async function getOrder(req, res, next) {
  try {
    const { id } = req.params;
    const orderRes = await query('SELECT order_id, user_id, order_date, status, total_amount FROM orders WHERE order_id=$1', [id]);
    const order = orderRes.rows[0];
    if (!order) return res.status(404).json({ success: false, message: 'Orden no encontrada' });
    if (req.user.role === 'cliente' && order.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Prohibido' });
    const itemsRes = await query(`SELECT oi.order_item_id as id, oi.product_id, p.name, oi.quantity, oi.unit_price
                                  FROM order_items oi JOIN products p ON p.product_id=oi.product_id
                                  WHERE oi.order_id=$1`, [id]);
    res.json({ success: true, data: { ...order, items: itemsRes.rows } });
  } catch (err) { next(err); }
}

export async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Estado inválido' });
    const existing = await query('SELECT status FROM orders WHERE order_id=$1', [id]);
    if (!existing.rowCount) return res.status(404).json({ success: false, message: 'Orden no encontrada' });
    const current = existing.rows[0].status;
    const transitions = {
      pendiente: ['en_preparacion'],
      en_preparacion: ['listo'],
      listo: ['entregado'],
      entregado: []
    };
    if (!transitions[current].includes(status)) {
      return res.status(400).json({ success: false, message: 'Transición no permitida' });
    }
    const upd = await query('UPDATE orders SET status=$1 WHERE order_id=$2 RETURNING order_id, status', [status, id]);
    res.json({ success: true, data: upd.rows[0], message: 'Estado actualizado' });
  } catch (err) { next(err); }
}
