# Card Shop MVP Design

## Goal

Build a deployable self-hosted digital goods shop inspired by the xbrain storefront. The first release focuses on a complete order lifecycle: browse products, create an order, pay, deliver card secrets automatically, and manage products/orders from an admin panel.

## Scope

The MVP includes:

- Public storefront with announcements, category cards, product cards, product purchase page, cashier page, order lookup, and support widget.
- Admin panel at `/admin` with login, dashboard, category management, product management, inventory/card-secret management, order management, payment-channel settings, announcement settings, and basic site settings.
- Backend API for products, order creation, price calculation, cashier status polling, order lookup, admin CRUD, payment notification, and manual test payment.
- PostgreSQL persistence through Prisma.
- Docker Compose deployment with app, database, and optional Nginx reverse proxy.

The MVP excludes:

- Multi-merchant marketplace features.
- User membership accounts.
- Affiliate/referral systems.
- Full customer-service chat workflow beyond a simple message box and admin-readable messages.
- Native Alipay/WeChat official payment integrations. These can be added after the generic payment adapter is stable.

## Technology

- Next.js with TypeScript for frontend, admin UI, and server routes.
- Prisma ORM with PostgreSQL.
- Tailwind CSS for styling.
- Docker Compose for deployment.
- Nginx as the production reverse proxy.

This keeps the project compact: one application can render public pages, serve the admin panel, and expose API endpoints.

## Public Experience

The public homepage mirrors the observed xbrain flow:

- Header with logo, shop name, and order lookup entry.
- Large announcement block controlled from admin settings.
- Recent purchase ticker using anonymized order data.
- Category grid with product counts.
- Product sections grouped by category.
- Product cards with image/icon, title, description, price, stock count, and disabled state when unavailable.
- Floating support button and daily activity entry points, with deeper workflows added after the MVP.

The product purchase page includes:

- Product summary and description.
- Quantity input.
- Email input.
- Query password input.
- Coupon input.
- Payment method selection.
- Live price quote endpoint.
- Submit button that creates an order.

The cashier page includes:

- Order number, product name, quantity, payable amount, email, payment method, and current status.
- QR code or payment jump button depending on channel response.
- Polling endpoint for payment status.
- Redirect to order detail after payment.

The order lookup page supports:

- Lookup by order number.
- Lookup by email plus query password.
- Browser-cache lookup can be added later; MVP stores the last order number locally in the browser.

## Admin Experience

The admin panel is available at `/admin`.

Authentication:

- One super admin role for MVP.
- Passwords stored with a strong hash.
- Session cookie with server-side validation.

Admin modules:

- Dashboard: order count, revenue, paid orders, pending orders, low-stock products.
- Categories: create, edit, sort, enable/disable.
- Products: create, edit, assign category, price, original price, description, icon/image, stock mode, enabled state.
- Inventory: import card secrets, view remaining count, mark invalid, inspect delivery status.
- Orders: search by order number/email/status, view payment status, delivery result, manually mark paid for test/manual channels.
- Payment channels: configure generic EPay-compatible channel and manual test channel.
- Announcements/site settings: logo/name, public notice text, support text, footer text.
- Support messages: read customer messages submitted from public widget.

## Data Model

Core tables:

- `AdminUser`: admin login identity and password hash.
- `Category`: product group shown on storefront.
- `Product`: sellable digital product.
- `InventoryItem`: one card secret or delivery item for a product.
- `Order`: customer order, status, amount, email, query password hash, delivery summary.
- `OrderItem`: product and quantity snapshot for an order.
- `PaymentChannel`: configured payment provider.
- `PaymentRecord`: provider request and callback record.
- `Coupon`: optional discount code.
- `Announcement`: public notice content.
- `SupportMessage`: lightweight customer support messages.
- `SiteSetting`: key-value settings.

Important order statuses:

- `PENDING`: order created, waiting for payment.
- `PAID`: payment verified.
- `DELIVERED`: inventory delivered to customer/order detail.
- `EXPIRED`: payment window expired.
- `CANCELLED`: cancelled by admin or system.
- `REFUNDED`: refunded externally and marked in admin.

## Order Flow

1. User opens a product page and requests a price quote.
2. Backend validates product, quantity, stock, coupon, and selected payment channel.
3. User submits order.
4. Backend creates an order and locks inventory candidates where applicable.
5. Backend redirects to cashier page.
6. Cashier calls the selected payment adapter.
7. Customer pays through provider.
8. Provider sends asynchronous notification to `/api/payments/:channel/notify`.
9. Backend verifies signature and provider status.
10. Backend records the payment transaction id.
11. Backend marks the order paid and delivers inventory atomically.
12. Cashier polling sees paid/delivered status and redirects to detail page.

Inventory delivery must be transactional: a card secret can be delivered to only one paid order.

## Payment Design

MVP supports two channel types:

- `manual`: admin or test endpoint marks an order paid for local testing.
- `epay`: EPay-compatible aggregate payment.

The EPay adapter follows the captured JingSoft reference:

- Submit fields include `pid`, `type`, `out_trade_no`, `notify_url`, `return_url`, `name`, `money`, and `sitename`.
- Sign request by sorting parameters and calculating `md5(queryString + key)`.
- Notify handler ignores `sign`, `sign_type`, and empty values before sorting.
- Callback is accepted only when computed MD5 matches and `trade_status` is `TRADE_SUCCESS`.
- On success, store provider `trade_no`, mark paid, deliver inventory, and respond with `success`.

Provider secrets must never be exposed to the browser.

## API Surface

Public endpoints:

- `GET /`
- `GET /products/:id`
- `POST /api/orders`
- `GET /checkout/:orderNo`
- `GET /api/orders/:orderNo/status`
- `GET /orders/:orderNo`
- `POST /api/orders/search`
- `POST /api/price`
- `POST /api/support/messages`

Payment endpoints:

- `POST /api/payments/:channel/pay/:orderNo`
- `GET|POST /api/payments/:channel/callback`
- `POST /api/payments/:channel/notify`

Admin endpoints:

- `POST /api/admin/login`
- `POST /api/admin/logout`
- CRUD endpoints under `/api/admin/categories`, `/api/admin/products`, `/api/admin/inventory`, `/api/admin/orders`, `/api/admin/payment-channels`, `/api/admin/settings`, and `/api/admin/support-messages`.

## Error Handling

- Public forms return field-level validation errors.
- Order creation fails cleanly when stock is insufficient or product is disabled.
- Payment notify is idempotent: repeated valid callbacks do not double-deliver inventory.
- Invalid payment signatures are recorded and rejected.
- Admin mutations return clear error messages and audit-relevant timestamps.

## Security

- Hash admin passwords and query passwords.
- Validate all inputs with server-side schemas.
- Use HTTP-only cookies for admin sessions.
- Never log raw card secrets in request logs.
- Never expose payment channel keys to client-side code.
- Use CSRF protection for admin mutations if relying on cookies.
- Rate-limit order creation, order lookup, login, and support message endpoints.

## Visual Direction

The storefront should feel close to the reference site: mobile-first, blue/cyan gradient accents, white cards, compact product cards, prominent notices, and floating action buttons. Admin UI should be quieter and denser: sidebar navigation, tables, filters, forms, and status badges.

## Verification

Before calling the MVP complete:

- Seed database with categories, products, admin user, and manual payment channel.
- Verify public product browsing and order creation.
- Verify manual payment completes an order and delivers inventory once.
- Verify EPay signature generation and notify verification with sample payloads.
- Verify admin can create product, import inventory, search orders, and update settings.
- Run type checks, linting, and targeted unit tests around payment signing and inventory delivery.
