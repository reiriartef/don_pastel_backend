import { query, runInTransaction } from "../db/index.js";

export async function listProducts(req, res, next) {
  try {
    const result = await query(
      "SELECT product_id as id, name, description, price FROM products ORDER BY product_id"
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      "SELECT product_id as id, name, description, price FROM products WHERE product_id=$1",
      [id]
    );
    if (!result.rows[0])
      return res
        .status(404)
        .json({ success: false, message: "Producto no encontrado" });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req, res, next) {
  try {
    const { name, description, price, stock_level } = req.body;
    if (!name || price == null || stock_level == null)
      return res
        .status(400)
        .json({ success: false, message: "Nombre, precio y stock requeridos" });
    if (stock_level < 0)
      return res
        .status(400)
        .json({ success: false, message: "Stock no puede ser negativo" });

    const result = await runInTransaction(async (client) => {
      const productIns = await client.query(
        "INSERT INTO products (name, description, price) VALUES ($1,$2,$3) RETURNING product_id as id, name, description, price",
        [name, description || null, price]
      );
      const productId = productIns.rows[0].id;
      await client.query(
        "INSERT INTO inventory (product_id, stock_level, last_updated) VALUES ($1, $2, NOW())",
        [productId, stock_level]
      );
      return productIns.rows[0];
    });

    res
      .status(201)
      .json({ success: true, data: result, message: "Producto creado" });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, price } = req.body;
    const existing = await query("SELECT 1 FROM products WHERE product_id=$1", [
      id,
    ]);
    if (!existing.rowCount)
      return res
        .status(404)
        .json({ success: false, message: "Producto no encontrado" });
    const result = await query(
      "UPDATE products SET name=COALESCE($1,name), description=COALESCE($2,description), price=COALESCE($3,price) WHERE product_id=$4 RETURNING product_id as id, name, description, price",
      [name, description, price, id]
    );
    res.json({
      success: true,
      data: result.rows[0],
      message: "Producto actualizado",
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      "DELETE FROM products WHERE product_id=$1 RETURNING product_id",
      [id]
    );
    if (!result.rowCount)
      return res
        .status(404)
        .json({ success: false, message: "Producto no encontrado" });
    res.json({ success: true, message: "Producto eliminado" });
  } catch (err) {
    next(err);
  }
}
