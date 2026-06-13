# Card Shop MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build a deployable digital card shop with public storefront, admin management, order creation, inventory delivery, and EPay-compatible payment callbacks.

**Architecture:** Use one Next.js application for public pages, admin pages, and server APIs. Prisma owns the PostgreSQL schema, while focused service modules handle order creation, inventory delivery, payment signing, and admin authentication.

**Tech Stack:** Next.js, TypeScript, React, Tailwind CSS, Prisma, PostgreSQL, Zod, bcrypt, Vitest, Docker Compose, Nginx.

---

## File Structure

- `package.json`: scripts and dependencies.
- `next.config.ts`: Next.js config.
- `tsconfig.json`: TypeScript config.
- `tailwind.config.ts`, `postcss.config.mjs`, `src/app/globals.css`: styling setup.
- `prisma/schema.prisma`: database schema.
- `prisma/seed.ts`: seed admin user, categories, products, inventory, settings, and manual payment channel.
- `src/lib/db.ts`: Prisma singleton.
- `src/lib/validation.ts`: shared Zod schemas.
- `src/lib/auth/password.ts`: password hashing and verification.
- `src/lib/auth/session.ts`: admin session cookie helpers.
- `src/lib/payments/epay.ts`: EPay signing and notify verification.
- `src/lib/orders/order-number.ts`: order number generator.
- `src/lib/orders/create-order.ts`: public order creation workflow.
- `src/lib/orders/deliver-order.ts`: transactional inventory delivery.
- `src/lib/orders/search-orders.ts`: order lookup helpers.
- `src/app/page.tsx`: public storefront.
- `src/app/products/[id]/page.tsx`: product purchase page.
- `src/app/checkout/[orderNo]/page.tsx`: cashier page.
- `src/app/orders/[orderNo]/page.tsx`: order detail page.
- `src/app/order-search/page.tsx`: order lookup page.
- `src/app/admin/layout.tsx`: admin shell.
- `src/app/admin/login/page.tsx`: admin login.
- `src/app/admin/page.tsx`: admin dashboard.
- `src/app/admin/categories/page.tsx`: category management.
- `src/app/admin/products/page.tsx`: product management.
- `src/app/admin/inventory/page.tsx`: inventory management.
- `src/app/admin/orders/page.tsx`: order management.
- `src/app/admin/settings/page.tsx`: site and payment settings.
- `src/app/api/**/route.ts`: public, admin, and payment API routes.
- `tests/payments/epay.test.ts`: EPay signing tests.
- `tests/orders/deliver-order.test.ts`: delivery idempotency tests.
- `docker-compose.yml`, `Dockerfile`, `nginx/default.conf.example`, `.env.example`: deployment assets.

---

### Task 1: Scaffold Next.js Application

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `.gitignore`
- Create: `.env.example`

- [x] **Step 1: Create project metadata and scripts**

Create `package.json`:

```json
{
  "name": "card-shop",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^6.9.0",
    "bcryptjs": "^2.4.3",
    "clsx": "^2.1.1",
    "lucide-react": "^0.468.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "prisma": "^6.9.0",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

- [x] **Step 2: Create framework config**

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  }
};

export default nextConfig;
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [x] **Step 3: Create styling config**

Create `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#2e8cf0",
          cyan: "#18d5e8",
          ink: "#111827"
        }
      }
    }
  },
  plugins: []
};

export default config;
```

Create `postcss.config.mjs`:

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};

export default config;
```

- [x] **Step 4: Create root layout and CSS**

Create `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Card Shop",
  description: "Self-hosted digital card shop"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

Create `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
  --shop-blue: #2e8cf0;
  --shop-cyan: #18d5e8;
  --shop-ink: #111827;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: #f5f7fb;
  color: var(--shop-ink);
  font-family: Arial, "Microsoft YaHei", sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}
```

- [x] **Step 5: Create environment and ignore files**

Create `.env.example`:

```env
DATABASE_URL="postgresql://card_shop:card_shop@localhost:5432/card_shop?schema=public"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="change-me-now"
SESSION_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Create `.gitignore`:

```gitignore
.env
.env*.local
.next
node_modules
dist
coverage
*.log
```

- [x] **Step 6: Install dependencies**

Run: `npm install`

Expected: dependencies install and `package-lock.json` is created.

- [x] **Step 7: Run typecheck**

Run: `npm run typecheck`

Expected: TypeScript exits successfully.

- [x] **Step 8: Commit**

Run:

```bash
git add .
git commit -m "chore: scaffold Next.js card shop"
```

Expected: scaffold files committed.

---

### Task 2: Database Schema and Seed Data

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/db.ts`

- [x] **Step 1: Create Prisma schema**

Create `prisma/schema.prisma` with enums and models for `AdminUser`, `Category`, `Product`, `InventoryItem`, `Order`, `OrderItem`, `PaymentChannel`, `PaymentRecord`, `Coupon`, `Announcement`, `SupportMessage`, and `SiteSetting`.

Core requirements:

```prisma
enum OrderStatus {
  PENDING
  PAID
  DELIVERED
  EXPIRED
  CANCELLED
  REFUNDED
}

enum InventoryStatus {
  AVAILABLE
  LOCKED
  DELIVERED
  INVALID
}

enum PaymentChannelType {
  manual
  epay
}
```

The schema must include:

- Unique `Order.orderNo`.
- Unique `AdminUser.email`.
- Product relation to category.
- Inventory relation to product and optional order.
- Payment record relation to order and payment channel.
- JSON `PaymentChannel.config` for provider credentials.

- [x] **Step 2: Create Prisma client singleton**

Create `src/lib/db.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [x] **Step 3: Create seed script**

Create `prisma/seed.ts` that:

- Hashes `ADMIN_PASSWORD` with bcrypt.
- Upserts one admin user.
- Creates categories: ChatGPT, Claude, Perplexity, Google, Other.
- Creates several sample products.
- Creates 20 sample inventory rows for one product.
- Creates `manual` payment channel enabled by default.
- Creates site settings for shop name, announcement, and support text.

- [ ] **Step 4: Generate migration**

Run: `npm run db:migrate -- --name init`

Expected: migration is created and local database schema is applied.

- [ ] **Step 5: Seed database**

Run: `npm run db:seed`

Expected: sample admin, categories, products, inventory, and settings exist.

- [x] **Step 6: Commit**

Run:

```bash
git add prisma src/lib/db.ts
git commit -m "feat: add database schema and seed data"
```

Expected: database foundation committed.

---

### Task 3: Core Order and Payment Services

**Files:**
- Create: `src/lib/auth/password.ts`
- Create: `src/lib/orders/order-number.ts`
- Create: `src/lib/orders/create-order.ts`
- Create: `src/lib/orders/deliver-order.ts`
- Create: `src/lib/payments/epay.ts`
- Create: `tests/payments/epay.test.ts`
- Create: `tests/orders/deliver-order.test.ts`

- [x] **Step 1: Write EPay tests**

Create `tests/payments/epay.test.ts` covering:

- Request signing sorts keys alphabetically.
- Notify verification ignores `sign`, `sign_type`, and empty fields.
- Invalid signatures fail.

Use this sample expected signature pattern:

```ts
expect(signEpayParams({ money: "9.00", name: "Test", out_trade_no: "DJ1", pid: "1000" }, "secret"))
  .toBe("md5-of-sorted-query-plus-secret");
```

Calculate the exact expected value in the implementation step and lock it in.

- [x] **Step 2: Implement EPay helpers**

Create `src/lib/payments/epay.ts`:

- `createLinkString(params)`
- `signEpayParams(params, key)`
- `verifyEpayNotify(params, key)`
- `buildEpaySubmitFields(order, channelConfig, urls)`

Implementation must use Node `crypto.createHash("md5")`.

- [x] **Step 3: Write delivery tests**

Create `tests/orders/deliver-order.test.ts` covering:

- Paid order receives the requested number of available inventory items.
- Re-running delivery for the same order does not deliver extra inventory.
- Delivery fails when available inventory is insufficient.

- [x] **Step 4: Implement password and order helpers**

Create `src/lib/auth/password.ts`:

```ts
import bcrypt from "bcryptjs";

export function hashPassword(value: string) {
  return bcrypt.hash(value, 12);
}

export function verifyPassword(value: string, hash: string) {
  return bcrypt.compare(value, hash);
}
```

Create `src/lib/orders/order-number.ts` with order numbers shaped like `DJYYYYMMDDHHmmssXXXX`.

- [x] **Step 5: Implement order creation**

Create `src/lib/orders/create-order.ts`:

- Validate product exists and is enabled.
- Validate quantity is positive.
- Validate enough available inventory exists.
- Hash query password.
- Create `Order` and `OrderItem`.
- Lock the needed inventory rows in a transaction.

- [x] **Step 6: Implement delivery**

Create `src/lib/orders/deliver-order.ts`:

- Load order by order number.
- Return existing delivery if order is already `DELIVERED`.
- Mark locked inventory rows as `DELIVERED`.
- Store delivered secrets in order delivery summary.
- Set order status to `DELIVERED`.

- [x] **Step 7: Run tests**

Run: `npm test`

Expected: EPay and delivery tests pass.

- [x] **Step 8: Commit**

Run:

```bash
git add src/lib tests
git commit -m "feat: add order and payment services"
```

Expected: core services committed.

---

### Task 4: Public API Routes

**Files:**
- Create: `src/lib/validation.ts`
- Create: `src/app/api/price/route.ts`
- Create: `src/app/api/orders/route.ts`
- Create: `src/app/api/orders/[orderNo]/status/route.ts`
- Create: `src/app/api/orders/search/route.ts`
- Create: `src/app/api/support/messages/route.ts`
- Create: `src/app/api/payments/manual/pay/[orderNo]/route.ts`
- Create: `src/app/api/payments/epay/pay/[orderNo]/route.ts`
- Create: `src/app/api/payments/epay/notify/route.ts`
- Create: `src/app/api/payments/epay/callback/route.ts`

- [x] **Step 1: Create shared validation schemas**

Create `src/lib/validation.ts` with Zod schemas for:

- price quote request
- create order request
- order search request
- support message request
- admin login request

- [x] **Step 2: Add price route**

`POST /api/price` accepts product id, quantity, coupon code, and returns:

```json
{
  "unitPrice": 9,
  "quantity": 1,
  "couponDiscount": 0,
  "total": 9
}
```

- [x] **Step 3: Add order creation route**

`POST /api/orders` calls `createOrder` and returns:

```json
{
  "orderNo": "DJ...",
  "checkoutUrl": "/checkout/DJ..."
}
```

- [x] **Step 4: Add status route**

`GET /api/orders/:orderNo/status` returns:

```json
{
  "paid": false,
  "status": "PENDING",
  "statusText": "寰呮敮浠?
}
```

- [x] **Step 5: Add search and support routes**

Order search supports order number or email plus query password.

Support route stores name/contact/message and source page.

- [x] **Step 6: Add manual payment route**

Manual payment route is enabled only for `manual` channel and marks an order paid/delivered for development.

- [x] **Step 7: Add EPay routes**

EPay pay route builds a provider submit form or URL.

EPay notify route:

- Verifies signature.
- Checks `trade_status`.
- Stores `trade_no`.
- Marks order paid.
- Calls delivery.
- Returns plain text `success`.

EPay callback redirects to `/orders/:orderNo`.

- [x] **Step 8: Run typecheck and tests**

Run:

```bash
npm run typecheck
npm test
```

Expected: both pass.

- [x] **Step 9: Commit**

Run:

```bash
git add src/app/api src/lib/validation.ts
git commit -m "feat: add public and payment APIs"
```

Expected: API routes committed.

---

### Task 5: Public Storefront UI

**Files:**
- Create: `src/components/store/Announcement.tsx`
- Create: `src/components/store/CategoryGrid.tsx`
- Create: `src/components/store/ProductCard.tsx`
- Create: `src/components/store/SupportWidget.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/products/[id]/page.tsx`
- Create: `src/app/checkout/[orderNo]/page.tsx`
- Create: `src/app/orders/[orderNo]/page.tsx`
- Create: `src/app/order-search/page.tsx`

- [x] **Step 1: Build reusable storefront components**

Create components matching the design direction:

- Blue/cyan header gradient.
- White content cards.
- Compact category tiles.
- Product cards with icon, title, description, price, and stock.
- Fixed support widget.

- [x] **Step 2: Build homepage**

`src/app/page.tsx` loads settings, categories, products, and recent delivered orders. It renders announcement, categories, and grouped product cards.

- [x] **Step 3: Build product purchase page**

Product page renders a form with quantity, email, query password, coupon, and payment channel. On submit it posts to `/api/orders` and redirects to `/checkout/:orderNo`.

- [x] **Step 4: Build cashier page**

Cashier page loads order summary and polls `/api/orders/:orderNo/status` every five seconds. It shows manual test payment button when manual channel is selected.

- [x] **Step 5: Build order detail and search pages**

Order detail displays status and delivered secrets only after correct lookup path. Search page supports order number and email/password lookup.

- [ ] **Step 6: Verify in browser**

Run: `npm run dev`

Open: `http://localhost:3000`

Expected:

- Homepage renders sample products.
- Product form creates an order.
- Checkout shows pending state.
- Manual payment completes delivery.
- Order detail shows delivered card secret.

- [x] **Step 7: Commit**

Run:

```bash
git add src/app src/components
git commit -m "feat: build public storefront"
```

Expected: storefront committed.

---

### Task 6: Admin Authentication and Admin UI

**Files:**
- Create: `src/lib/auth/session.ts`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/api/admin/login/route.ts`
- Create: `src/app/api/admin/logout/route.ts`

- [x] **Step 1: Implement session helpers**

Session helper must:

- Sign session payload with `SESSION_SECRET`.
- Store it in an HTTP-only cookie.
- Read current admin from request cookies.
- Redirect unauthenticated admin page requests to `/admin/login`.

- [x] **Step 2: Implement login/logout APIs**

Login route validates email/password and sets cookie.

Logout route clears cookie.

- [x] **Step 3: Build admin shell**

Admin layout uses a sidebar with Dashboard, Categories, Products, Inventory, Orders, Settings, Support.

- [x] **Step 4: Build dashboard**

Dashboard shows counts and recent orders.

- [ ] **Step 5: Verify login**

Run: `npm run dev`

Open: `http://localhost:3000/admin`

Expected:

- Unauthenticated users redirect to `/admin/login`.
- Seed admin can log in.
- Dashboard renders.
- Logout clears session.

- [x] **Step 6: Commit**

Run:

```bash
git add src/lib/auth src/app/admin src/app/api/admin
git commit -m "feat: add admin authentication"
```

Expected: admin auth committed.

---

### Task 7: Admin Management Modules

**Files:**
- Create: `src/app/admin/categories/page.tsx`
- Create: `src/app/admin/products/page.tsx`
- Create: `src/app/admin/inventory/page.tsx`
- Create: `src/app/admin/orders/page.tsx`
- Create: `src/app/admin/settings/page.tsx`
- Create: `src/app/api/admin/categories/route.ts`
- Create: `src/app/api/admin/products/route.ts`
- Create: `src/app/api/admin/inventory/route.ts`
- Create: `src/app/api/admin/orders/route.ts`
- Create: `src/app/api/admin/settings/route.ts`

- [x] **Step 1: Implement category admin**

CRUD categories with title, sort, and enabled state.

- [x] **Step 2: Implement product admin**

CRUD products with category, title, description, price, original price, icon color, enabled state.

- [x] **Step 3: Implement inventory admin**

Inventory page imports newline-separated secrets for a selected product. It shows available, locked, delivered, and invalid counts.

- [x] **Step 4: Implement order admin**

Order page filters by order number, email, and status. Detail view shows payment records and delivered inventory.

- [x] **Step 5: Implement settings admin**

Settings page manages shop name, announcement, support text, and payment channel config.

- [ ] **Step 6: Verify admin CRUD**

Run through:

- Create category.
- Create product.
- Import inventory.
- Create a public order for the product.
- Mark paid manually.
- Confirm order delivery in admin.

- [x] **Step 7: Commit**

Run:

```bash
git add src/app/admin src/app/api/admin
git commit -m "feat: add admin management modules"
```

Expected: admin modules committed.

---

### Task 8: Deployment Assets

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `nginx/default.conf.example`
- Create: `README.md`

- [x] **Step 1: Create Dockerfile**

Dockerfile builds the Next.js app, runs `prisma generate`, and starts `npm run start`.

- [x] **Step 2: Create Docker Compose**

Compose includes:

- `postgres` service with persistent volume.
- `app` service with `DATABASE_URL`, `SESSION_SECRET`, and `NEXT_PUBLIC_SITE_URL`.
- Optional `nginx` service using `nginx/default.conf.example`.

- [x] **Step 3: Create README**

README documents:

- Local dev setup.
- Database migration and seed commands.
- Admin login setup.
- Manual payment testing.
- EPay channel config.
- Production deployment with Docker Compose.

- [ ] **Step 4: Verify production build**

Run:

```bash
npm run build
docker compose config
```

Expected: Next.js build succeeds and compose config validates.

- [x] **Step 5: Commit**

Run:

```bash
git add Dockerfile docker-compose.yml nginx README.md
git commit -m "chore: add deployment assets"
```

Expected: deployment assets committed.

---

## Self-Review

Spec coverage:

- Public storefront: Task 5.
- Admin login and management: Tasks 6 and 7.
- Database and seed data: Task 2.
- Order creation, inventory delivery, and payment signing: Tasks 3 and 4.
- Docker deployment: Task 8.
- Security basics: Tasks 3, 4, 6, and 7.

Known intentional limits:

- Official Alipay and WeChat native integrations are excluded from MVP.
- Browser-cache order lookup is limited to storing last order number locally.
- Customer support is a simple message submission and admin reading flow.

Placeholder scan:

- No unresolved markers or vague implementation notes are allowed before execution.

Type consistency:

- Payment channel type names are `manual` and `epay`.
- Order identifier is consistently `orderNo`.
- Payment callback success text is consistently `success`.

## Execution Status

Completed in code:

- Public storefront, order APIs, payment APIs, admin authentication, admin management pages, and deployment assets are implemented.
- Task commit steps after Task 3 were completed as a consolidated MVP commit instead of separate task commits.
- Verification passed: `npm run typecheck`, `npm test`, and `npm run build`.

Environment-blocked checks:

- Local PostgreSQL migration/seed verification was not run because this workspace has no `.env` with `DATABASE_URL` and no local PostgreSQL/`psql` command available.
- Full browser order flow and admin CRUD flow were not run against a real database for the same reason.
- `docker compose config` was not run because the `docker` command is not available on this machine.
