import { test, expect, type Page } from '@playwright/test';

const categories = [
  { id: 1, name: 'Audio & accessories', isActive: true },
  { id: 2, name: 'Everyday essentials', isActive: true },
  { id: 3, name: 'Workspace', isActive: true },
];
const names = [
  'Wireless Headphones',
  'Smart Watch',
  'Everyday Backpack',
  'Coffee Maker',
  'Mechanical Keyboard',
  'Studio Headphones',
  'Wireless Mouse',
  'Desk Lamp',
  'Travel Headphones',
  'Compact Keyboard',
  'Classic Watch',
  'Weekend Backpack',
];
const urls = [
  'photo-1505740420928-5e560c06d30e',
  'photo-1523275335684-37898b6baf30',
  'photo-1553062407-98eeb64c6a62',
  'photo-1495474472287-4d71bcdd2085',
];
const products = names.map((name, index) => ({
  id: index + 1,
  name,
  price: [89, 149, 59, 120, 79, 199, 39, 49, 129, 69, 179, 95][index],
  isActive: true,
  categoryIds: [(index % 3) + 1],
  photos: [
    {
      id: index + 1,
      url: `https://images.unsplash.com/${urls[index % 4]}?auto=format&fit=crop&w=600&q=80`,
      isPrimary: true,
      sortOrder: 0,
    },
  ],
}));
const inventory = products.map((p, i) => ({
  id: i + 1,
  productId: p.id,
  quantityOnHand: 20,
  quantityReserved: 3,
  availableQuantity: 17,
  lowStockThreshold: 5,
  isLowStock: false,
  createdAt: '2026-11-04T09:00:00Z',
  updatedAt: '2026-11-04T09:00:00Z',
  product: { id: p.id, name: p.name, price: p.price, isActive: p.isActive },
}));
const order = {
  id: 42,
  userId: 1,
  status: 'pending',
  paymentStatus: 'pending',
  paymentMethod: 'cash_on_delivery',
  shippingAddress: '123 Test Street',
  adminNote: null,
  total: 89,
  items: [{ id: 1, productId: 1, productName: names[0], unitPrice: 89, quantity: 1, subtotal: 89 }],
  createdAt: '2026-11-04T09:00:00Z',
  updatedAt: '2026-11-04T09:00:00Z',
};

async function mockBackend(page: Page) {
  const calls: {
    method: string;
    path: string;
    body: unknown;
    authorization: string | undefined;
  }[] = [];
  let cartItems: {
    id: number;
    productId: number;
    quantity: number;
    product: (typeof inventory)[0]['product'];
    subtotal: number;
  }[] = [];
  let checkoutError = false;
  const cart = () => ({
    id: 1,
    userId: 1,
    items: cartItems,
    itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    total: cartItems.reduce((sum, item) => sum + item.subtotal, 0),
  });
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1', '');
    const method = request.method();
    const body = request.postDataJSON();
    calls.push({ method, path, body, authorization: request.headers().authorization });
    const ok = (data: unknown) =>
      route.fulfill({ json: { status: 'success', message: 'OK', data } });
    if (path === '/products') return ok(products);
    if (path === '/categories' || path === '/admin/categories') {
      if (method === 'POST') return ok({ id: 4, ...body });
      return ok(categories);
    }
    if (/^\/products\/\d+$/.test(path))
      return ok(products.find((p) => p.id === Number(path.split('/').pop())));
    if (path.endsWith('/login') || path.endsWith('/register'))
      return ok({
        access_token: path.includes('/admin/') ? 'admin-test-token' : 'customer-test-token',
        token_type: 'Bearer',
      });
    if (path.endsWith('/me'))
      return ok({
        id: 1,
        email: 'hello@example.com',
        role: path.includes('/admin/') ? 'admin' : 'customer',
      });
    if (path === '/cart/items' && method === 'POST') {
      cartItems = [
        {
          id: 1,
          productId: body.productId,
          quantity: body.quantity,
          product: inventory.find((i) => i.productId === body.productId)!.product,
          subtotal: products.find((p) => p.id === body.productId)!.price * body.quantity,
        },
      ];
      return ok(cart());
    }
    if (path === '/cart' && method === 'GET') return ok(cart());
    if (/^\/cart\/items\/\d+$/.test(path)) {
      if (method === 'DELETE') cartItems = [];
      if (method === 'PATCH')
        cartItems = cartItems.map((item) => ({
          ...item,
          quantity: body.quantity,
          subtotal: item.product.price * body.quantity,
        }));
      return ok(cart());
    }
    if (path === '/orders' && method === 'POST') {
      if (checkoutError)
        return route.fulfill({
          status: 409,
          json: {
            status: 'error',
            message: 'Insufficient stock for product 1. Requested: 5, available: 2.',
            data: null,
          },
        });
      cartItems = [];
      return ok({ ...order, shippingAddress: body.shippingAddress });
    }
    if (path === '/orders' || path === '/admin/orders') return ok([order]);
    if (/^\/(admin\/)?orders\/\d+$/.test(path)) return ok(order);
    if (path === '/admin/products') {
      if (method === 'POST') return ok({ id: 13, ...body });
      return ok(products);
    }
    if (/^\/admin\/products\/\d+$/.test(path))
      return ok({
        ...products.find((p) => p.id === Number(path.split('/').pop())),
        inventory: inventory[0],
      });
    if (path === '/admin/inventory') {
      if (method === 'POST') return ok(inventory[0]);
      return ok(inventory);
    }
    if (path === '/admin/inventory/movements') return ok([]);
    if (/^\/admin\/inventory\/\d+$/.test(path)) return ok(inventory[0]);
    if (path.endsWith('/notifications'))
      return ok({
        items: [],
        pagination: { total: 0, count: 0, per_page: 12, current_page: 1, total_pages: 0 },
        unreadCount: 0,
      });
    if (path.endsWith('/status') || path.endsWith('/cancel'))
      return ok({ ...order, status: body?.status || 'cancelled' });
    return route.fulfill({
      status: 404,
      json: { status: 'error', message: `Unmocked route: ${method} ${path}`, data: null },
    });
  });
  return {
    calls,
    setCheckoutError: (value: boolean) => {
      checkoutError = value;
    },
  };
}
async function login(page: Page, admin = false) {
  await page.goto(admin ? '/admin/login' : '/login');
  await page.getByLabel('Email address').fill('hello@example.com');
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(admin ? /\/admin$/ : /\/$/);
}

test('catalog revalidates on focus so an edited product replaces the old storefront data', async ({ page }) => {
  await mockBackend(page);
  let edited = false;
  await page.route('**/api/v1/products', async route => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({
      status: 'success', message: 'Products',
      data: products.map(product => product.id === 1 && edited ? { ...product, name: 'Fresh Wireless Headphones' } : product),
    }) });
  });
  await page.goto('/');
  await expect(page.getByText('Wireless Headphones', { exact: true })).toBeVisible();
  edited = true;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByText('Fresh Wireless Headphones', { exact: true })).toBeVisible();
  await expect(page.getByText('Wireless Headphones', { exact: true })).toHaveCount(0);
});

test('catalog filters, price sorting, and grid/list work on real response shapes', async ({
  page,
}) => {
  await mockBackend(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Good things/ })).toBeVisible();
  await expect(page.locator('.product-card')).toHaveCount(12);
  await page.getByLabel('Search products').fill('headphones');
  await expect(page.locator('.product-card')).toHaveCount(3);
  await page.getByLabel('Sort products').selectOption('price-asc');
  await expect(page.locator('.product-name').first()).toHaveText('Wireless Headphones');
  await page.getByRole('button', { name: 'List', exact: true }).click();
  await expect(page.locator('.product-grid')).toHaveClass(/product-list/);
  await page.getByRole('button', { name: 'Reset all', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(12);
});
test('customer sign-in, cart quantities, checkout failure, and successful order use supported endpoints', async ({
  page,
}) => {
  const backend = await mockBackend(page);
  await login(page);
  await page.getByRole('button', { name: 'Add Wireless Headphones to cart', exact: true }).click();
  await page.getByRole('link', { name: /Cart \(1\)/ }).click();
  await expect(page.getByRole('heading', { name: 'Make it yours.' })).toBeVisible();
  await page.getByLabel('Shipping address').fill('123 Test Street');
  backend.setCheckoutError(true);
  await page.getByRole('button', { name: 'Place order' }).click();
  await expect(page.getByRole('alert')).toContainText('Insufficient stock');
  await expect(page).toHaveURL(/\/cart$/);
  backend.setCheckoutError(false);
  await page.getByRole('button', { name: 'Place order' }).click();
  await expect(page).toHaveURL(/\/orders$/);
  await expect(page.getByText('#0042', { exact: true })).toBeVisible();
  expect(
    backend.calls.some(
      (call) =>
        call.method === 'POST' &&
        call.path === '/orders' &&
        JSON.stringify(call.body).includes('cash_on_delivery'),
    ),
  ).toBeTruthy();
  expect(
    backend.calls
      .filter((call) => call.path.startsWith('/cart'))
      .every((call) => call.authorization === 'Bearer customer-test-token'),
  ).toBeTruthy();
});
test('admin product details show stock and product creation submits only accepted DTO fields', async ({
  page,
}) => {
  const backend = await mockBackend(page);
  await login(page, true);
  await page.getByRole('link', { name: 'Products', exact: true }).click();
  await page.getByRole('button', { name: 'View Wireless Headphones', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Available');
  await expect(page.getByRole('dialog').getByText('17', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Add product', exact: true }).click();
  await page.getByLabel('Product name', { exact: true }).fill('A new everyday essential');
  await page.getByLabel('Price', { exact: true }).fill('45.50');
  await page.getByRole('dialog').getByLabel('Audio & accessories', { exact: true }).check();
  await page.getByRole('dialog').getByRole('button', { name: 'Add product', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  const call = backend.calls.find(
    (call) => call.path === '/admin/products' && call.method === 'POST',
  );
  expect(call?.body).toEqual({
    name: 'A new everyday essential',
    price: 45.5,
    isActive: true,
    categoryIds: [1],
    photos: [],
  });
});
test('admin inventory adjustments send the product ID, operation, quantity, and reason', async ({
  page,
}) => {
  const backend = await mockBackend(page);
  await login(page, true);
  await page.getByRole('link', { name: 'Inventory', exact: true }).click();
  await page.getByRole('button', { name: 'Adjust', exact: true }).first().click();
  await page.getByLabel('Quantity', { exact: true }).fill('5');
  await page.getByLabel('Reason', { exact: true }).fill('Supplier restock');
  await page.getByRole('button', { name: 'Save adjustment' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(
    backend.calls.some(
      (call) =>
        call.path === '/admin/inventory/1' &&
        call.method === 'PATCH' &&
        JSON.stringify(call.body) ===
          JSON.stringify({ operation: 'add', quantity: 5, reason: 'Supplier restock' }),
    ),
  ).toBeTruthy();
});
test('protected routes redirect to the correct login and mobile layouts do not overflow', async ({
  page,
}) => {
  await mockBackend(page);
  await page.goto('/admin/products');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto('/cart');
  await expect(page).toHaveURL(/\/login$/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.product-card')).toHaveCount(12);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
  await page.screenshot({ path: 'test-results/storefront-mobile.png', fullPage: true });
});
test('clear errors appear when the API is unavailable; there is no fabricated catalog', async ({
  page,
}) => {
  await page.route('**/api/v1/**', (route) =>
    route.fulfill({
      status: 503,
      json: { status: 'error', message: 'Warehouse service is unavailable.', data: null },
    }),
  );
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Warehouse service is unavailable.');
  await expect(page.locator('.product-card')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
});
test('capture desktop storefront and workspace for visual review', async ({ page }) => {
  await mockBackend(page);
  await page.goto('/');
  await expect(page.locator('.product-card')).toHaveCount(12);
  await page.screenshot({ path: 'test-results/storefront-desktop.png', fullPage: true });
  await login(page, true);
  await expect(page.locator('.metric-card')).toHaveCount(4);
  await page.screenshot({ path: 'test-results/admin-desktop.png', fullPage: true });
});
