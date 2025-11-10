import { startOfDay, subDays } from 'date-fns';
import { query } from '../db/index.js';

function periodToRange(period) {
  const now = new Date();
  if (period === 'daily') return { from: startOfDay(now) };
  if (period === 'weekly') return { from: subDays(startOfDay(now), 7) };
  if (period === 'monthly') return { from: subDays(startOfDay(now), 30) };
  return null;
}

export async function salesReport(req, res, next) {
  try {
    const { period = 'daily' } = req.query;
    const range = periodToRange(period);
    if (!range) return res.status(400).json({ success: false, message: 'Periodo inválido' });
    const fromIso = range.from.toISOString();

    const sales = await query(`SELECT COUNT(*)::int as orders_count, COALESCE(SUM(total_amount),0)::numeric as total_sales
                               FROM orders WHERE order_date >= $1`, [fromIso]);
    const methods = await query(`SELECT payment_method, COUNT(*)::int as count, SUM(amount)::numeric as total
                                 FROM payments WHERE payment_date >= $1 GROUP BY payment_method`, [fromIso]);
    const topProducts = await query(`SELECT p.name, SUM(oi.quantity)::int as quantity, SUM(oi.quantity*oi.unit_price)::numeric as total
                                     FROM order_items oi JOIN products p ON p.product_id=oi.product_id
                                     JOIN orders o ON o.order_id=oi.order_id
                                     WHERE o.order_date >= $1
                                     GROUP BY p.name ORDER BY quantity DESC LIMIT 5`, [fromIso]);

    res.json({ success: true, data: { period, from: fromIso, summary: sales.rows[0], payment_methods: methods.rows, top_products: topProducts.rows } });
  } catch (err) { next(err); }
}

export async function inventoryReport(req, res, next) {
  try {
    const threshold = Number(process.env.LOW_STOCK_THRESHOLD || 10);
    const totals = await query(`SELECT COALESCE(SUM(i.stock_level),0)::int AS total_units,
                                       COALESCE(SUM(i.stock_level * p.price),0)::numeric AS valuation
                                FROM inventory i JOIN products p ON p.product_id=i.product_id`);
    const low = await query(`SELECT p.name, i.stock_level, i.last_updated
                             FROM inventory i JOIN products p ON p.product_id=i.product_id
                             WHERE i.stock_level <= $1
                             ORDER BY i.stock_level ASC, p.name ASC
                             LIMIT 100`, [threshold]);
    res.json({ success: true, data: { threshold, summary: totals.rows[0], low_stock: low.rows } });
  } catch (err) { next(err); }
}

function getFromISOForPeriod(period) {
  const range = periodToRange(period);
  if (!range) return null;
  return range.from.toISOString();
}

export async function ordersReport(req, res, next) {
  try {
    const { period = 'daily' } = req.query;
    const fromIso = getFromISOForPeriod(period);
    if (!fromIso) return res.status(400).json({ success: false, message: 'Periodo inválido' });
    const summary = await query(`SELECT COUNT(*)::int as orders_count,
                                        COALESCE(SUM(total_amount),0)::numeric as total_sales,
                                        COALESCE(AVG(total_amount),0)::numeric as avg_order
                                 FROM orders WHERE order_date >= $1`, [fromIso]);
    const statuses = await query(`SELECT status, COUNT(*)::int AS count
                                  FROM orders WHERE order_date >= $1
                                  GROUP BY status ORDER BY status`, [fromIso]);
    const perDay = await query(`SELECT to_char(date_trunc('day', order_date), 'YYYY-MM-DD') AS day,
                                       COUNT(*)::int AS orders,
                                       COALESCE(SUM(total_amount),0)::numeric AS total
                                FROM orders WHERE order_date >= $1
                                GROUP BY 1 ORDER BY 1 ASC`, [fromIso]);
    res.json({ success: true, data: { period, from: fromIso, summary: summary.rows[0], status_breakdown: statuses.rows, per_day: perDay.rows } });
  } catch (err) { next(err); }
}

export async function paymentsReport(req, res, next) {
  try {
    const { period = 'daily' } = req.query;
    const fromIso = getFromISOForPeriod(period);
    if (!fromIso) return res.status(400).json({ success: false, message: 'Periodo inválido' });
    const totals = await query(`SELECT COALESCE(SUM(amount),0)::numeric AS total_processed,
                                       COUNT(*)::int AS count
                                FROM payments WHERE payment_date >= $1`, [fromIso]);
    const byMethod = await query(`SELECT payment_method, COUNT(*)::int AS count, COALESCE(SUM(amount),0)::numeric AS total
                                  FROM payments WHERE payment_date >= $1
                                  GROUP BY payment_method ORDER BY count DESC`, [fromIso]);
    const byBank = await query(`SELECT COALESCE(bank,'N/A') AS bank, COUNT(*)::int AS count, COALESCE(SUM(amount),0)::numeric AS total
                                FROM payments WHERE payment_date >= $1
                                GROUP BY COALESCE(bank,'N/A') ORDER BY count DESC`, [fromIso]);
    res.json({ success: true, data: { period, from: fromIso, summary: totals.rows[0], by_method: byMethod.rows, by_bank: byBank.rows } });
  } catch (err) { next(err); }
}

export async function customersReport(req, res, next) {
  try {
    const { period = 'daily' } = req.query;
    const fromIso = getFromISOForPeriod(period);
    if (!fromIso) return res.status(400).json({ success: false, message: 'Periodo inválido' });
    const top = await query(`SELECT u.username, COUNT(o.order_id)::int AS orders,
                                    COALESCE(SUM(o.total_amount),0)::numeric AS total
                             FROM orders o JOIN users u ON u.user_id = o.user_id
                             WHERE o.order_date >= $1
                             GROUP BY u.username
                             ORDER BY total DESC
                             LIMIT 10`, [fromIso]);
    res.json({ success: true, data: { period, from: fromIso, top_customers: top.rows } });
  } catch (err) { next(err); }
}
