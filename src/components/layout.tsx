import { useEffect } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Box,
  ChevronRight,
  Grid2X2,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  ShoppingCart,
  Tags,
  UserRound,
  X,
} from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { sessionCleared } from '../app/actions';
import { clearNotice } from '../features/ui/uiSlice';

export function Brand({ small = false }: { small?: boolean }) {
  return (
    <Link to="/" className={`brand ${small ? 'brand-small' : ''}`} aria-label="Barakah home">
      BARAKAH
      <span className="brand-dot" />
    </Link>
  );
}
export function ShopLayout() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((s) => s.auth.session);
  const cart = useAppSelector((s) => s.cart.data);
  const location = useLocation();
  return (
    <div className="shop-shell">
      <div className="top-note">
        <span>Everyday, considered.</span>
        <span>
          A little more possibility. <ArrowUpRight size={12} />
        </span>
      </div>
      <header className="store-header">
        <nav className="shop-nav" aria-label="Main navigation">
          <NavLink to="/" end>
            Shop
          </NavLink>
          <Link to="/#categories">Categories</Link>
          {session?.role === 'customer' && <NavLink to="/orders">My orders</NavLink>}
        </nav>
        <Brand />
        <div className="header-actions">
          {session?.role === 'admin' ? (
            <Link to="/admin" className="header-admin">
              Dashboard <ArrowUpRight size={14} />
            </Link>
          ) : (
            <Link
              className={`cart-link ${location.pathname === '/cart' ? 'active' : ''}`}
              to={session ? '/cart' : '/login'}
              state={!session ? { from: '/cart' } : undefined}
            >
              <ShoppingBag size={18} />
              <span>Cart ({session?.role === 'customer' ? cart?.itemCount || 0 : 0})</span>
            </Link>
          )}
          {session?.role === 'customer' && (
            <Link to="/notifications" className="icon-button" aria-label="Notifications">
              <Bell size={18} />
            </Link>
          )}
          <Link
            to={session ? '/account' : '/login'}
            className="icon-button"
            aria-label={session ? 'Your account' : 'Sign in'}
          >
            <UserRound size={19} />
          </Link>
        </div>
      </header>
      <main className="shop-main">
        <Outlet />
      </main>
      <footer className="store-footer">
        <Brand small />
        <span>Everyday essentials. Thoughtfully chosen.</span>
        <Link to="/admin/login">
          Admin access <ArrowUpRight size={12} />
        </Link>
        {session && (
          <button className="text-button" onClick={() => dispatch(sessionCleared())}>
            Sign out
          </button>
        )}
      </footer>
    </div>
  );
}
const adminLinks = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Box },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/inventory', label: 'Inventory', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
];
export function AdminLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const session = useAppSelector((s) => s.auth.session);
  const location = useLocation();
  const current = adminLinks.find((item) => item.to === location.pathname);
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Brand />
        <div className="workspace">
          <span className="workspace-icon">
            <Grid2X2 size={17} />
          </span>
          <span>
            <strong>Store workspace</strong>
            <small>Administration</small>
          </span>
          <ChevronRight size={15} />
        </div>
        <span className="nav-caption">WORKSPACE</span>
        <nav aria-label="Admin navigation">
          {adminLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/">
            <ArrowDownRight size={18} /> Visit storefront
          </Link>
          <button
            onClick={() => {
              dispatch(sessionCleared());
              navigate('/admin/login');
            }}
          >
            <LogOut size={18} /> Sign out
          </button>
          <div className="sidebar-profile">
            <span className="avatar">{session?.profile?.email[0]?.toUpperCase() || 'A'}</span>
            <span>
              <strong>Administrator</strong>
              <small>{session?.profile?.email}</small>
            </span>
          </div>
        </div>
      </aside>
      <div className="admin-content">
        <header className="admin-topbar">
          <span>
            Workspace <ChevronRight size={13} /> <strong>{current?.label || 'Dashboard'}</strong>
          </span>
          <Link to="/" className="text-button">
            View store <ArrowUpRight size={15} />
          </Link>
        </header>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
export function Toast() {
  const notice = useAppSelector((s) => s.ui.notice);
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => dispatch(clearNotice()), 5000);
      return () => clearTimeout(timer);
    }
  }, [notice, dispatch]);
  return notice ? (
    <div
      className={`toast toast-${notice.tone}`}
      role={notice.tone === 'error' ? 'alert' : 'status'}
    >
      <span>{notice.message}</span>
      <button
        className="icon-button"
        onClick={() => dispatch(clearNotice())}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  ) : null;
}
