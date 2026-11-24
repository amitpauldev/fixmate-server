# FixMate Server

REST API for **FixMate**, a home-service booking platform that connects customers with technicians. The server is built with Node.js, Express, MongoDB, and Stripe.

**Live frontend:** [fixsmate.vercel.app](https://fixsmate.vercel.app/)

## Features

- Service discovery with category, service mode, and price sorting filters
- User, service, booking, and payment management endpoints
- Booking status, cancellation, and final-amount updates
- Admin views for users, services, bookings, and payments
- Stripe checkout verification with webhook-secret protection
- Health-check endpoint for deployment monitoring

## Tech Stack

- Node.js (ES modules)
- Express 5
- MongoDB Node.js Driver
- Stripe
- dotenv and CORS

## Requirements

- Node.js 18 or newer
- A running MongoDB database or MongoDB Atlas cluster
- Stripe credentials for payment verification

## Getting Started

From the `fixmate-server` directory:

```bash
npm install
```

Create a local environment file:

```bash
copy .env.example .env
```

Then update `.env` with valid local or hosted service credentials.

Start the development server:

```bash
npm run dev
```

Start the server normally:

```bash
npm start
```

The API listens on `http://localhost:5000` by default.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | No | Runtime environment. Defaults to `development`. |
| `PORT` | No | Server port. Defaults to `5000`. |
| `FRONTEND_ORIGIN` | No | Frontend origin reference. Defaults to `http://localhost:3000`. |
| `MONGODB_URI` | Yes | MongoDB connection string. |
| `DB_NAME` | Yes | MongoDB database name. |
| `STRIPE_SECRET_KEY` | Yes for payments | Stripe secret API key. |
| `PAYMENT_WEBHOOK_SECRET` | Yes for payment verification | Secret expected in the `x-webhook-secret` request header. |

Never commit `.env` or real credentials. Use `.env.example` as the configuration template.

## API Overview

All responses use JSON. Successful responses generally follow this format:

```json
{
  "success": true,
  "data": {}
}
```

### System

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Check server availability and environment |

### Users

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/users` | List users; optionally filter with `?role=` |
| `GET` | `/api/users/:id` | Get a user by MongoDB ID |

### Services

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/services` | List approved and available services |
| `GET` | `/api/services/:id` | Get a service by MongoDB ID |
| `GET` | `/api/services/technician/:id` | List services for a technician |
| `POST` | `/api/services` | Create a service |
| `PATCH` | `/api/services/:id` | Update a service |
| `DELETE` | `/api/services/:id` | Delete a service |

Supported service-list query parameters:

- `category`
- `serviceMode`
- `sort=price-low`
- `sort=price-high`

### Bookings

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/bookings` | Create a booking for an approved, available service |
| `GET` | `/api/bookings` | List bookings |
| `GET` | `/api/bookings/:id` | Get a booking by MongoDB ID |
| `PATCH` | `/api/bookings/:id/status` | Update booking status |
| `PATCH` | `/api/bookings/:id/final-amount` | Set the final booking amount |
| `POST` | `/api/bookings/:id/cancel` | Cancel a booking |

Booking-list query parameters include `customerId`, `technicianId`, and `status`.

### Admin

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/users` | List all users |
| `GET` | `/api/admin/services` | List all services |
| `PATCH` | `/api/admin/services/:id/approval` | Approve or reject a service |
| `GET` | `/api/admin/bookings` | List all bookings |
| `GET` | `/api/admin/payments` | List all payments |

Service approval accepts `approvalStatus` values of `approved` or `rejected`.

### Payments

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/payments` | List payments; filter with `customerId` or `technicianId` |
| `POST` | `/api/payments/checkout-verify` | Verify a completed Stripe Checkout Session |

Payment verification requires:

- `x-webhook-secret` header matching `PAYMENT_WEBHOOK_SECRET`
- A `sessionId` in the request body
- A completed Stripe payment associated with an eligible booking

## Project Structure

```text
src/
|-- app.js              # Express app, middleware, and route registration
|-- server.js           # Database connection and HTTP server startup
|-- config/
|   |-- db.js           # MongoDB connection lifecycle
|   `-- env.js          # Environment configuration
|-- middleware/
|   `-- error.js        # Not-found and error handling
|-- routes/             # Feature route modules
`-- utils/
    `-- errors.js       # Application error helpers
```

## Notes

- MongoDB is connected before the HTTP server starts and is also ensured before API route handling.
- CORS is currently enabled through Express's default CORS configuration.
- Route-level authentication and authorization middleware are not currently defined in this server package; enforce access control before exposing administrative or mutation endpoints publicly.

## License

This project is licensed under the ISC License.