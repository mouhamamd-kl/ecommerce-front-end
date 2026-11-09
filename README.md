# Barakah storefront

A React + TypeScript storefront and admin workspace for the NestJS ecommerce API.
The interface follows the supplied reference: light neutral surfaces, rounded
filters and cards, fine borders, restrained typography, and blue primary actions.

## Run locally

```powershell
cd .\ecommerce-front-end
npm ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
```

Open **http://127.0.0.1:5173**. Start the ecommerce backend separately on port 3000,
with its database and authentication settings configured. For warehouse inventory,
also start the Go service and apply the ecommerce reservation migration described
in the backend README.

The local Vite development and preview servers forward `/api` to
`API_PROXY_TARGET` (default `http://localhost:3000`), avoiding a CORS change to
the backend. `VITE_API_BASE_URL` defaults to `/api/v1`. For production, serve the
frontend with an SPA fallback and reverse-proxy `/api` to NestJS, or set an
absolute API URL and configure the backend's allowed origins. No secrets belong
in `VITE_*` variables; they are public browser configuration.

`VITE_CURRENCY` controls price formatting (default USD). The backend has no
currency field; this setting does not convert prices.

## Routes

| Frontend               | Capability                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `/`                    | Products, category filters, price range, text search, sorting, grid/list, incremental display |
| `/products/:id`        | Product photos, price, quantity, add to cart                                                  |
| `/login`, `/register`  | Customer authentication                                                                       |
| `/account`             | Authenticated account overview and sign out                                                   |
| `/cart`                | Cart quantities, item removal, shipping address, cash-on-delivery checkout                    |
| `/orders`              | Customer orders, details, eligible cancellations                                              |
| `/notifications`       | Paginated customer notifications, read status, mark read, delete                              |
| `/admin/login`         | Separate administrator sign-in                                                                |
| `/admin`               | Dashboard counts derived from actual products, orders, and inventory                          |
| `/admin/products`      | Product create/edit/delete, activation, public photo URLs, categories, inventory details      |
| `/admin/categories`    | Create/edit/delete, activate through update, deactivate                                       |
| `/admin/inventory`     | Stock initialization, adjustment with reason, low-stock filter, movement history              |
| `/admin/orders`        | Orders, details, valid status transitions, optional admin note                                |
| `/admin/notifications` | Read-only paginated notification feed, matching the admin controller                          |

Customer registration only sends `email` and `password`. An admin account must
already exist in the backend. The app sends each role's token only as a Bearer
header. Sessions are held in Redux and tab-scoped `sessionStorage`, revalidated
through `/auth/:role/me` after reload, and cleared when authenticated requests
return 401. Signing out clears private slices, and late responses from an old
session are ignored. Backend guards remain the authority for access control.

The catalog filters the loaded `/products` and `/categories` arrays in the browser;
it does not assume server-side search or pagination. Products use the photos in
their API response, with a neutral placeholder if a URL is missing or cannot load.
No demo catalog or mock API is bundled into the application.

Checkout only offers cash on delivery because no online-payment HTTP flow is
implemented. Ratings, discounts, wishlists, saved searches, comparisons, image
uploads, password reset, profile editing, admin registration, user management,
and invented revenue or growth charts are intentionally absent. Product stock is
shown in admin product details; public product responses do not expose stock.

## Redux structure

All API data and async operations use Redux Toolkit slices and `createAsyncThunk`.
Typed `useAppDispatch` / `useAppSelector` hooks live in `src/app/hooks.ts`.

| Slice           | Responsibility                                                                        |
| --------------- | ------------------------------------------------------------------------------------- |
| `auth`          | Customer/admin login, customer registration, profile restoration                      |
| `catalog`       | Public products/categories, detail loading, filters, sort and layout                  |
| `cart`          | Server cart, item mutations, pending/error state                                      |
| `orders`        | Customer/admin lists and details, checkout, cancellation/status updates               |
| `admin`         | Product/category/inventory data, CRUD operations, product stock details and movements |
| `notifications` | Role-specific pages, read filters, customer mutations                                 |
| `ui`            | Success and error notices                                                             |

Form drafts and modal visibility use component state. Shared data, catalog filters,
authorization, and request state live in Redux. Redux DevTools are disabled to
avoid retaining credentials and tokens in action histories.

## HTTP contract

The API client consumes `{ status, message, data }`, supports string or array
error messages, and preserves HTTP 409 / 503 / 504 errors from the backend.
Request DTOs contain only fields accepted by the active HTTP controllers.

- Auth: `POST /auth/customer/register`, `POST /auth/customer/login`,
  `POST /auth/admin/login`, `GET /auth/customer/me`, `GET /auth/admin/me`.
- Public catalog: `GET /products`, `GET /products/:id`, `GET /categories`.
- Cart: `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:itemId`,
  `DELETE /cart/items/:itemId`.
- Customer orders: `GET /orders`, `GET /orders/:id`, `POST /orders`,
  `PATCH /orders/:id/cancel`.
- Admin products: `GET/POST /admin/products`, `GET/PATCH/DELETE /admin/products/:id`,
  `PATCH /admin/products/:id/activate`, `PATCH /admin/products/:id/deactivate`.
- Admin categories: `GET/POST /admin/categories`, `PATCH/DELETE /admin/categories/:id`,
  `PATCH /admin/categories/:id/deactivate`.
- Inventory: `GET/POST /admin/inventory`, `PATCH /admin/inventory/:productId`,
  `GET /admin/inventory/movements?productId=…`.
- Admin orders: `GET /admin/orders`, `GET /admin/orders/:id`,
  `PATCH /admin/orders/:id/status`.
- Notifications: `GET /notifications`, `PATCH /notifications/read-all`,
  `PATCH /notifications/:id/read`, `DELETE /notifications/:id`,
  `GET /admin/notifications`. Pagination/read filters use the documented query fields.

All paths above are relative to `/api/v1`.

## Verification

```powershell
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```

Browser tests intercept API calls with fixtures shaped like the actual controllers.
They check filtering, authentication/guards, Bearer headers, checkout success and
failure, admin product details/creation, inventory adjustment, and mobile overflow.
Fixtures are isolated in `tests/` and are not used by the app. These checks do not
replace a live NestJS/PostgreSQL/warehouse integration run.

For an existing compatible Chromium installation, set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable before running browser tests.
Screenshots and traces are written to the ignored `test-results/` directory.
