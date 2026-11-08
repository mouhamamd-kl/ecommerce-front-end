import { useEffect } from 'react';
import { ArrowRight, ArrowUpRight, Box, Clock3, PackageCheck, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { loadAdminResource } from '../../features/admin/adminSlice';
import { loadOrders } from '../../features/orders/ordersSlice';
import { Badge, EmptyState, ErrorBanner, PageTitle, Spinner } from '../../components/ui';
import { date, money } from '../../lib/format';
export default function OverviewPage() {
  const dispatch = useAppDispatch();
  const admin = useAppSelector((s) => s.admin);
  const orders = useAppSelector((s) => s.orders);
  useEffect(() => {
    void dispatch(loadAdminResource('products'));
    void dispatch(loadAdminResource('inventory'));
    void dispatch(loadOrders('admin'));
  }, [dispatch]);
  const metrics = [
    {
      label: 'Total orders',
      value: orders.status === 'succeeded' ? orders.items.length : '—',
      detail: 'Across your store',
      icon: ShoppingBag,
      to: '/admin/orders',
    },
    {
      label: 'Awaiting confirmation',
      value:
        orders.status === 'succeeded'
          ? orders.items.filter((o) => o.status === 'pending').length
          : '—',
      detail: 'Ready for your attention',
      icon: Clock3,
      to: '/admin/orders',
    },
    {
      label: 'Active products',
      value:
        admin.status.products === 'succeeded'
          ? admin.products.filter((p) => p.isActive).length
          : '—',
      detail: 'Available in the collection',
      icon: Box,
      to: '/admin/products',
    },
    {
      label: 'Low-stock products',
      value:
        admin.status.inventory === 'succeeded'
          ? admin.inventory.filter((i) => i.isLowStock).length
          : '—',
      detail: 'Keep the essentials stocked',
      icon: PackageCheck,
      to: '/admin/inventory',
    },
  ];
  return (
    <>
      <PageTitle
        eyebrow="A GOOD DAY TO MAKE THINGS HAPPEN"
        title="Your store, at a glance."
        description="A little clarity for your everyday operations."
        action={
          <Link to="/admin/products" className="button">
            Manage products <ArrowUpRight size={16} />
          </Link>
        }
      />
      <ErrorBanner
        message={admin.errors.products}
        retry={() => void dispatch(loadAdminResource('products'))}
      />
      <ErrorBanner
        message={admin.errors.inventory}
        retry={() => void dispatch(loadAdminResource('inventory'))}
      />
      <ErrorBanner message={orders.error} retry={() => void dispatch(loadOrders('admin'))} />
      <div className="metrics-grid">
        {metrics.map(({ label, value, detail, icon: Icon, to }) => (
          <Link className="metric-card" key={label} to={to}>
            <div>
              <span>{label}</span>
              <Icon size={19} strokeWidth={1.5} />
            </div>
            <strong>{value}</strong>
            <small>
              {detail}
              <ArrowUpRight size={14} />
            </small>
          </Link>
        ))}
      </div>
      <section className="dashboard-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">THE LATEST</span>
            <h2>Recent orders</h2>
          </div>
          <Link to="/admin/orders" className="text-button">
            View all orders <ArrowRight size={15} />
          </Link>
        </div>
        {orders.status === 'loading' ? (
          <Spinner label="Loading orders…" />
        ) : orders.items.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Placed</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {[...orders.items]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 6)
                  .map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>#{String(order.id).padStart(4, '0')}</strong>
                      </td>
                      <td>{date(order.createdAt)}</td>
                      <td>Customer #{order.userId}</td>
                      <td>
                        <Badge value={order.status} />
                      </td>
                      <td className="numeric">{money(order.total)}</td>
                      <td>
                        <Link className="text-button" to={`/admin/orders?order=${order.id}`}>
                          View <ArrowRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          orders.status !== 'failed' && (
            <EmptyState title="Ready for your first order.">
              Orders will appear here as customers find their favourites.
            </EmptyState>
          )
        )}
      </section>
      <div className="overview-bottom">
        <section className="overview-note">
          <span className="eyebrow">KEEP THE EVERYDAY MOVING</span>
          <h2>
            Good products.
            <br />
            Thoughtful details.
          </h2>
          <p>
            A photo, a clear name, and the right price.
            <br />
            Make every addition to your collection count.
          </p>
          <Link to="/admin/products" className="button dark">
            Your collection <ArrowRight size={15} />
          </Link>
          <span className="overview-watermark">B.</span>
        </section>
        <section className="stock-attention">
          <div className="section-title">
            <h2>A little attention</h2>
            <span className="count-dot">{admin.inventory.filter((i) => i.isLowStock).length}</span>
          </div>
          {admin.inventory
            .filter((i) => i.isLowStock)
            .slice(0, 4)
            .map((item) => (
              <Link className="attention-row" key={item.id} to="/admin/inventory">
                <span className="attention-icon">
                  <Box size={17} />
                </span>
                <span>
                  <strong>{item.product?.name || `Product #${item.productId}`}</strong>
                  <small>
                    {item.availableQuantity} available · threshold {item.lowStockThreshold}
                  </small>
                </span>
                <ArrowUpRight size={15} />
              </Link>
            ))}
          {admin.status.inventory === 'succeeded' && !admin.inventory.some((i) => i.isLowStock) && (
            <p className="muted">Your recorded inventory is above its low-stock thresholds.</p>
          )}
        </section>
      </div>
    </>
  );
}
