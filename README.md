# E-commerce API

A REST API for an e-commerce application built with NestJS, TypeScript, and MongoDB. It includes account authentication, a product catalog, categories, brands, a customer cart, and order checkout with cash on delivery.

## Features

- Sign up, email verification, login, and password recovery
- Product catalog linked to categories and brands
- Admin-only catalog and user-management operations
- User-specific carts with stock validation
- Checkout, order history, order status updates, and stock restoration on cancellation
- Consistent success and error response formats

## Requirements

- Node.js 20 or later
- MongoDB
- Redis
- A Gmail account with an app password for email features

## Setup

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env.dev` in the project root, then replace the placeholder values with your local settings. `.env.dev` is ignored by Git; never commit real credentials.

```powershell
Copy-Item .env.example .env.dev
```

`DB_URL`, `REDIS_URL`, `USER_JWT`, and `ADMIN_JWT` are required for the API to run. `APP_EMAIL` and `APP_PASSWORD` are required for email verification and password recovery. `SALT` is used by password hashing.

Start the API in development mode:

```bash
npm run start:dev
```

The API uses `PORT` when set and otherwise listens on port `8000`.

## Scripts

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `npm run start:dev`  | Start in watch mode                |
| `npm run start`      | Start the application              |
| `npm run start:prod` | Run the compiled application       |
| `npm run build`      | Compile the application            |
| `npm test`           | Run unit tests                     |
| `npm run test:e2e`   | Run end-to-end tests               |
| `npm run test:cov`   | Run tests with coverage            |
| `npm run format`     | Format TypeScript source and tests |

## Authentication

Create an account with `POST /auth/signup`:

```json
{
  "username": "Jamie Doe",
  "age": 25,
  "email": "jamie@example.com",
  "password": "StrongPass1!",
  "confirmPassword": "StrongPass1!"
}
```

Passwords must contain at least eight characters, including uppercase and lowercase letters, a number, and a symbol. Verify the email with `POST /auth/verify-email`, then log in with `POST /auth/login`:

```json
{
  "email": "jamie@example.com",
  "password": "StrongPass1!"
}
```

Send the returned access token on protected requests:

```http
Authorization: Bearer <access-token>
```

Public sign-up creates a regular user. Admin accounts must be provisioned through a trusted process; do not expose admin credentials or promote users through a public endpoint.

## API

All request and response bodies use JSON. Validation rejects fields that are not part of the endpoint DTO.

### Authentication

| Method   | Endpoint                   | Access |
| -------- | -------------------------- | ------ |
| `POST`   | `/auth/signup`             | Public |
| `POST`   | `/auth/verify-email`       | Public |
| `POST`   | `/auth/login`              | Public |
| `POST`   | `/auth/forget-password`    | Public |
| `POST`   | `/auth/reset-password/:id` | Public |
| `GET`    | `/auth/getUsers`           | Admin  |
| `GET`    | `/auth/getUsersById/:id`   | Admin  |
| `PATCH`  | `/auth/UpdateUserById/:id` | Admin  |
| `DELETE` | `/auth/deleteUserByID/:id` | Admin  |

### Catalog

| Method   | Endpoint          | Access |
| -------- | ----------------- | ------ |
| `GET`    | `/products`       | Public |
| `POST`   | `/products`       | Admin  |
| `PATCH`  | `/products/:id`   | Admin  |
| `DELETE` | `/products/:id`   | Admin  |
| `GET`    | `/categories`     | Public |
| `POST`   | `/categories`     | Admin  |
| `PATCH`  | `/categories/:id` | Admin  |
| `DELETE` | `/categories/:id` | Admin  |
| `GET`    | `/brands`         | Public |
| `POST`   | `/brands`         | Admin  |
| `PATCH`  | `/brands/:id`     | Admin  |
| `DELETE` | `/brands/:id`     | Admin  |

Create a category or brand before creating a product. Product `category` and `brand` values must be their MongoDB ObjectIds. The product list includes populated category and brand details. Categories and brands cannot be deleted while products reference them.

Example category request:

```json
{
  "name": "Accessories",
  "description": "Everyday accessories"
}
```

Example product request:

```json
{
  "name": "Canvas Backpack",
  "description": "A lightweight everyday backpack.",
  "price": 49.99,
  "stock": 20,
  "category": "<category-object-id>",
  "brand": "<brand-object-id>",
  "images": ["https://example.com/backpack.jpg"],
  "sku": "BAG-001"
}
```

### Cart and orders

| Method  | Endpoint                 | Access             |
| ------- | ------------------------ | ------------------ |
| `GET`   | `/cart`                  | Authenticated user |
| `PUT`   | `/cart/items/:productId` | Authenticated user |
| `POST`  | `/orders`                | Authenticated user |
| `GET`   | `/orders`                | Authenticated user |
| `PATCH` | `/orders/:id`            | Admin              |

Set an item's quantity with `PUT /cart/items/:productId`:

```json
{
  "quantity": 2
}
```

The quantity is the new total, not an increment. Set it to `0` to remove the item. Cart quantities cannot exceed available stock.

Create an order with `POST /orders`:

```json
{
  "shippingAddress": {
    "fullName": "Jamie Doe",
    "phone": "+1-555-0100",
    "addressLine1": "123 Main Street",
    "city": "Springfield",
    "state": "CA",
    "postalCode": "90001",
    "country": "US"
  }
}
```

Checkout currently creates a pending cash-on-delivery payment, reserves the requested stock, and clears the cart. `GET /orders` returns the authenticated user's order history with payment details.

Stripe card payments are planned but are not implemented yet. The integration will require a Stripe account, API keys, and a webhook signing secret. Stripe may charge transaction fees; using its SDK does not make payment processing free.

Admins update order status with `PATCH /orders/:id`:

```json
{
  "status": "confirmed"
}
```

Allowed transitions are `pending` to `confirmed` or `cancelled`, `confirmed` to `processing` or `cancelled`, `processing` to `shipped` or `cancelled`, and `shipped` to `delivered`. Cancelling an order restores its reserved stock. To record cash collected on delivery, send the delivered status with `paymentReceived` set to `true`.

## Response format

Successful responses use this envelope:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request successful",
  "data": {},
  "timestamp": "2026-01-01T12:00:00.000Z"
}
```

Errors use the same fields, with `success` set to `false` and `data` set to `null`. The `message` may be a string or an array for validation errors.

## Notes

- Keep `.env.dev` and `.env.prod` local. Rotate any credentials that were previously committed or shared.
- Existing product records created before category and brand references were added may need their `category` values migrated to ObjectIds and a `brand` assigned.
- The end-to-end tests require the configured MongoDB and Redis services.
