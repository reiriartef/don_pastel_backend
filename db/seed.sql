-- Basic seed data
-- Gerente user (password: gerente123)
-- Hash generated via bcrypt cost 10 for 'gerente123'
INSERT INTO users (username, password_hash, role) VALUES
  ('gerente1', '$2a$10$MN9Yb0Cs2yS619rYvC6IQebCGeklmOZAHpDsg4gkIk8736t5SKb2K', 'gerente')
ON CONFLICT (username) DO NOTHING;

INSERT INTO products (name, description, price) VALUES
 ('Pastel Chocolate','Rico pastel de chocolate', 15.00),
 ('Pastel Vainilla','Clásico pastel de vainilla', 12.00),
 ('Tarta Fresa','Fresas frescas y crema', 18.50)
ON CONFLICT DO NOTHING;

INSERT INTO inventory (product_id, stock_level)
SELECT product_id, 50 FROM products
ON CONFLICT (product_id) DO NOTHING;
