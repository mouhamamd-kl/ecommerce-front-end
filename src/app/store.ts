import {
  combineReducers,
  configureStore,
  isPending,
  isFulfilled,
  isRejected,
  type Middleware,
} from '@reduxjs/toolkit';
import auth from '../features/auth/authSlice';
import catalog from '../features/catalog/catalogSlice';
import cart from '../features/cart/cartSlice';
import orders from '../features/orders/ordersSlice';
import admin from '../features/admin/adminSlice';
import notifications from '../features/notifications/notificationsSlice';
import ui from '../features/ui/uiSlice';
export const rootReducer = combineReducers({
  auth,
  catalog,
  cart,
  orders,
  admin,
  notifications,
  ui,
});
export type RootState = ReturnType<typeof rootReducer>;
export function createAppStore() {
  const requests = new Map<string, string | undefined>();
  const sessionBoundary: Middleware<object, RootState> = (storeApi) => (next) => (action) => {
    if (isPending(action) || isFulfilled(action) || isRejected(action)) {
      const privateRequest = /^(cart|orders|admin|notifications)\//.test(action.type);
      if (privateRequest && isPending(action))
        requests.set(action.meta.requestId, storeApi.getState().auth.session?.token);
      if (
        privateRequest &&
        (isFulfilled(action) || isRejected(action)) &&
        requests.has(action.meta.requestId)
      ) {
        const requestToken = requests.get(action.meta.requestId);
        requests.delete(action.meta.requestId);
        // A late response must not repopulate another account's private state.
        if (requestToken !== storeApi.getState().auth.session?.token) return action;
      }
    }
    return next(action);
  };
  return configureStore({
    reducer: rootReducer,
    devTools: false,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sessionBoundary),
  });
}
export const store = createAppStore();
store.subscribe(() => {
  const session = store.getState().auth.session;
  try {
    if (session) sessionStorage.setItem('barakah:session', JSON.stringify(session));
    else sessionStorage.removeItem('barakah:session');
  } catch {
    /* The current session still works when browser storage is disabled. */
  }
});
export type AppDispatch = typeof store.dispatch;
