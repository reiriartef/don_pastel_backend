# Don Pastel Backend

Minimal Express backend implementing the functional requirements for the Don Pastel sales automation system.

## Stack

- Node.js / Express
- PostgreSQL (no ORM, using `pg`)
- JWT auth (roles: `gerente`, `cajero`, `cliente`)

## Environment Variables (.env)

See `.env.example`:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=don_pastel
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=change_me_secret
JWT_EXPIRES=2h
LOW_STOCK_THRESHOLD=10
```

## Database

Apply schema and seed:

```bash
psql -h localhost -U postgres -d don_pastel -f db/schema.sql
psql -h localhost -U postgres -d don_pastel -f db/seed.sql
```

Gerente credentials (seed):

- username: gerente1
- password: gerente123

## Install & Run

```bash
pnpm install
pnpm dev
```

Health check: `GET /health`

## Auth

- POST `/api/auth/login` { username, password }
- POST `/api/auth/register` (gerente only) { username, password, role }

Success:

```json
{ "success": true, "data": {} }
```

Error:

```json
{ "success": false, "message": "Texto en español" }
```

## Products

- GET `/api/products`
- GET `/api/products/:id`
- POST `/api/products` (gerente)
- PUT `/api/products/:id` (gerente)
- DELETE `/api/products/:id` (gerente)

## Inventory

- GET `/api/inventory` (gerente, cajero)
- PATCH `/api/inventory/:productId` (gerente)
- GET `/api/inventory/low?threshold=NUM` (gerente)

## Orders

- POST `/api/orders` (cajero, cliente, gerente) body: `{ items: [{ product_id, quantity }] }`
- GET `/api/orders` (role filtered)
- GET `/api/orders/:id`
- PATCH `/api/orders/:id/status` (cajero, gerente) body: `{ status }` transitions: pendiente -> en_preparacion -> listo -> entregado

## Payments

- POST `/api/payments` body: `{ order_id, payment_method }`

## Reports

- GET `/api/reports/sales?period=daily|weekly|monthly` (gerente)

## Notes

- Order creation & inventory deduction are atomic (transaction).
- Payment prevented from duplication via unique constraint.
- No over-engineered layers: controllers perform direct queries.

## Future Improvements (Optional)

- Add pagination on list endpoints
- Add unit tests
- Add refresh tokens
- Add input validation library (zod / joi)

## License

ISC
