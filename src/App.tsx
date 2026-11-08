import { Component, Suspense, lazy, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { sessionCleared } from './app/actions';
import { restoreSession } from './features/auth/authSlice';
import { loadCart } from './features/cart/cartSlice';
import { AdminLayout, ShopLayout, Toast } from './components/layout';
import { EmptyState, Spinner } from './components/ui';
import type { Role } from './lib/types';
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const OverviewPage = lazy(() => import('./pages/admin/OverviewPage'));
const ProductsPage = lazy(() => import('./pages/admin/ProductsPage'));
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'));
const InventoryPage = lazy(() => import('./pages/admin/InventoryPage'));
function RequireAuth({ role }: { role?: Role }) {
  const { session, restoring } = useAppSelector((s) => s.auth);
  const location = useLocation();
  if (restoring)
    return (
      <div className="loading-page">
        <Spinner label="Opening your account…" />
      </div>
    );
  if (!session || (role && session.role !== role))
    return (
      <Navigate
        to={role === 'admin' ? '/admin/login' : '/login'}
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  return <Outlet />;
}
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    /* Keep unexpected internal details out of the UI. */
  }
  render() {
    return this.state.failed ? (
      <main className="loading-page">
        <EmptyState title="A little pause.">
          Something unexpected happened.{' '}
          <button className="text-button" onClick={() => window.location.reload()}>
            Reload the store
          </button>
        </EmptyState>
      </main>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  const dispatch = useAppDispatch();
  const { session, restoring } = useAppSelector((s) => s.auth);
  const cartStatus = useAppSelector((s) => s.cart.status);
  const location = useLocation();
  useEffect(() => {
    if (restoring && session) void dispatch(restoreSession(session));
  }, [dispatch]);
  useEffect(() => {
    const expired = (event: Event) => {
      if (event instanceof CustomEvent && event.detail === session?.token)
        dispatch(sessionCleared());
    };
    window.addEventListener('barakah:session-expired', expired);
    return () => window.removeEventListener('barakah:session-expired', expired);
  }, [dispatch, session?.token]);
  useEffect(() => {
    if (session?.role === 'customer' && !restoring && cartStatus === 'idle')
      void dispatch(loadCart());
  }, [session?.token, restoring, cartStatus, dispatch]);
  useEffect(() => {
    if (location.hash)
      requestAnimationFrame(() =>
        document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }),
      );
    else window.scrollTo(0, 0);
    document.title = `${location.pathname.startsWith('/admin') ? 'Workspace' : 'Everyday, considered.'} — BARAKAH`;
  }, [location.pathname, location.hash]);
  return (
    <>
      <Suspense
        fallback={
          <div className="loading-page">
            <Spinner label="Something good is loading…" />
          </div>
        }
      >
        <Routes>
          <Route element={<ShopLayout />}>
            <Route index element={<CatalogPage />} />
            <Route path="products/:id" element={<ProductPage />} />
            <Route path="login" element={<AuthPage />} />
            <Route path="register" element={<AuthPage register />} />
            <Route path="admin/login" element={<AuthPage admin />} />
            <Route element={<RequireAuth role="customer" />}>
              <Route path="cart" element={<CartPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>
            <Route element={<RequireAuth />}>
              <Route path="account" element={<AccountPage />} />
            </Route>
            <Route
              path="*"
              element={
                <EmptyState
                  title="This page took a different turn."
                  action={
                    <a href="/" className="button">
                      Back to the collection
                    </a>
                  }
                >
                  The page you’re looking for isn’t here.
                </EmptyState>
              }
            />
          </Route>
          <Route element={<RequireAuth role="admin" />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
      <Toast />
    </>
  );
}
