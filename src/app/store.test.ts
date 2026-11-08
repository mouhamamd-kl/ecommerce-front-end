import { describe, expect, it } from 'vitest';
import { createAppStore, rootReducer } from './store';
import { sessionCleared } from './actions';
import { authenticate, restoreSession } from '../features/auth/authSlice';
import { loadCart } from '../features/cart/cartSlice';
import { loadOrders } from '../features/orders/ordersSlice';
import { loadAdminResource } from '../features/admin/adminSlice';
import { loadNotifications } from '../features/notifications/notificationsSlice';
describe('session isolation', () => {
  it('clears private customer and admin data on sign out', () => {
    let state = rootReducer(undefined, { type: 'init' });
    state = rootReducer(
      state,
      authenticate.fulfilled(
        {
          token: 'test-token',
          role: 'customer',
          profile: { id: 1, email: 'test@example.com', role: 'customer' },
        },
        'request-1',
        { role: 'customer', email: 'test@example.com', password: 'unused' },
      ),
    );
    state = rootReducer(
      state,
      loadCart.fulfilled(
        { id: 1, userId: 1, items: [], itemCount: 0, total: 25 },
        'request-2',
        undefined,
      ),
    );
    state = rootReducer(state, loadOrders.fulfilled([], 'request-3', 'customer'));
    state = rootReducer(
      state,
      loadAdminResource.fulfilled(
        {
          resource: 'products',
          data: [
            {
              id: 1,
              name: 'Private product',
              price: 1,
              isActive: false,
              photos: [],
              categoryIds: [],
            },
          ],
        },
        'request-4',
        'products',
      ),
    );
    state = rootReducer(
      state,
      loadNotifications.fulfilled(
        {
          items: [],
          pagination: { total: 12, current_page: 1, total_pages: 1, per_page: 20, count: 0 },
        },
        'request-5',
        { role: 'customer', page: 1, filter: 'all' },
      ),
    );
    state = rootReducer(state, sessionCleared());
    expect(state.auth.session).toBeNull();
    expect(state.cart.data).toBeNull();
    expect(state.orders.items).toEqual([]);
    expect(state.admin.products).toEqual([]);
    expect(state.notifications.data).toBeNull();
  });
  it('ignores a late protected response after the user signs out', () => {
    const store = createAppStore();
    store.dispatch(
      authenticate.fulfilled(
        {
          token: 'first-account',
          role: 'customer',
          profile: { id: 1, email: 'first@example.com', role: 'customer' },
        },
        'login',
        { role: 'customer', email: 'first@example.com', password: 'unused' },
      ),
    );
    store.dispatch(loadCart.pending('cart-request', undefined));
    store.dispatch(sessionCleared());
    store.dispatch(
      loadCart.fulfilled(
        { id: 1, userId: 1, items: [], itemCount: 0, total: 25 },
        'cart-request',
        undefined,
      ),
    );
    expect(store.getState().cart.data).toBeNull();
  });
  it('does not restore an old account over a newer signed-in account', () => {
    const store = createAppStore();
    const oldSession = { token: 'old-token', role: 'customer' as const, profile: null };
    store.dispatch(
      authenticate.fulfilled(
        {
          token: 'new-token',
          role: 'customer',
          profile: { id: 2, email: 'second@example.com', role: 'customer' },
        },
        'login-new',
        { role: 'customer', email: 'second@example.com', password: 'unused' },
      ),
    );
    store.dispatch(restoreSession.fulfilled(oldSession, 'restore-old', oldSession));
    expect(store.getState().auth.session?.token).toBe('new-token');
  });
});
