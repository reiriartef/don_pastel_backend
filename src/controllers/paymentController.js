import { query, runInTransaction } from '../db/index.js';

export async function createPayment(req, res, next) {
  try {
    const { order_id, payment_method, transaction_id, bank, amount } = req.body;
    if (!order_id || !payment_method || !transaction_id || !bank || !amount) return res.status(400).json({ success: false, message: 'Datos de pago incompletos' });
    const userId = req.user.id;
    const data = await runInTransaction(async (client) => {
      const orderRes = await client.query('SELECT order_id, user_id, total_amount, status FROM orders WHERE order_id=$1 FOR UPDATE', [order_id]);
      const order = orderRes.rows[0];
      if (!order) throw { status: 404, publicMessage: 'Orden no encontrada' };
      if (req.user.role === 'cliente' && order.user_id !== userId) throw { status: 403, publicMessage: 'Prohibido' };
      const payExist = await client.query('SELECT 1 FROM payments WHERE order_id=$1', [order_id]);
      if (payExist.rowCount) throw { status: 409, publicMessage: 'Pago ya registrado' };
      // Optional: validate amount equals order total
      const amt = Number(amount);
      if (amt <= 0) throw { status: 400, publicMessage: 'Monto inválido' };
      const payIns = await client.query(
        'INSERT INTO payments (order_id, payment_method, transaction_id, bank, amount) VALUES ($1,$2,$3,$4,$5) RETURNING payment_id, payment_method, transaction_id, bank, amount, payment_date',
        [order_id, payment_method, transaction_id, bank, amt]
      );
      const itemsRes = await client.query(`SELECT p.name, oi.quantity, oi.unit_price
                                           FROM order_items oi JOIN products p ON p.product_id=oi.product_id
                                           WHERE oi.order_id=$1`, [order_id]);
      return { order, payment: payIns.rows[0], items: itemsRes.rows };
    });
    res.status(201).json({ success: true, data: data, message: 'Pago registrado' });
  } catch (err) { next(err); }
}

export async function listPayments(req, res, next) {
  try {
    const params = [];
    let where = '';
    if (req.user.role === 'cliente') {
      where = 'WHERE o.user_id = $1';
      params.push(req.user.id);
    }
    const sql = `SELECT p.payment_id, p.order_id, p.payment_method, p.transaction_id, p.bank, p.amount, p.payment_date,
                        u.username
                 FROM payments p
                 JOIN orders o ON o.order_id = p.order_id
                 JOIN users u ON u.user_id = o.user_id
                 ${where}
                 ORDER BY p.payment_date DESC
                 LIMIT 200`;
    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
}

export async function paymentsStats(req, res, next) {
  try {
    const params = [];
    let where = '';
    let orderWhere = '';
    if (req.user.role === 'cliente') {
      where = 'WHERE o.user_id = $1';
      orderWhere = 'WHERE o.user_id = $1';
      params.push(req.user.id);
    }
    const totalProcessedSql = `SELECT COALESCE(SUM(p.amount), 0) AS total_processed,
                                      COUNT(*) AS completed_count
                               FROM payments p JOIN orders o ON o.order_id = p.order_id
                               ${where}`;
    const totalRes = await query(totalProcessedSql, params);
    const pendingSql = `SELECT COUNT(*) AS pending_count
                        FROM orders o
                        LEFT JOIN payments p ON p.order_id = o.order_id
                        ${orderWhere}
                        AND p.payment_id IS NULL`;
    // For LEFT JOIN NULL filter, move condition to WHERE properly
    const pendingSqlFixed = `SELECT COUNT(*) AS pending_count
                             FROM orders o
                             LEFT JOIN payments p ON p.order_id = o.order_id
                             ${orderWhere ? orderWhere + ' AND ' : 'WHERE '} p.payment_id IS NULL`;
    const pendingRes = await query(pendingSqlFixed, params);
    res.json({ success: true, data: {
      total_processed: Number(totalRes.rows[0]?.total_processed || 0),
      completed_count: Number(totalRes.rows[0]?.completed_count || 0),
      pending_count: Number(pendingRes.rows[0]?.pending_count || 0),
    }});
  } catch (err) { next(err); }
}
