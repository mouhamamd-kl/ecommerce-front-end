import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { closeOrder, loadOrder, loadOrders, updateOrder } from '../features/orders/ordersSlice';
import { showNotice } from '../features/ui/uiSlice';
import {
  Badge,
  Confirm,
  EmptyState,
  ErrorBanner,
  Modal,
  PageTitle,
  Spinner,
} from '../components/ui';
import { date, label, money } from '../lib/format';
import { transitions, type OrderStatus } from '../lib/types';
export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const role = useAppSelector((s) => s.auth.session!.role);
  const { items, selected, status, busy, error } = useAppSelector((s) => s.orders);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [nextStatus, setNextStatus] = useState<OrderStatus>('confirmed');
  const [note, setNote] = useState('');
  const [params] = useSearchParams();
  const orderParam = params.get('order');
  useEffect(() => {
    void dispatch(loadOrders(role));
    return () => {
      dispatch(closeOrder());
    };
  }, [role, dispatch]);
  useEffect(() => {
    if (orderParam && /^\d+$/.test(orderParam)) {
      setOpen(true);
      void dispatch(loadOrder({ id: Number(orderParam), role }));
    }
  }, [orderParam, role, dispatch]);
  useEffect(() => {
    if (selected) {
      setNextStatus(transitions[selected.status][0] || selected.status);
      setNote(selected.adminNote || '');
    }
  }, [selected]);
  const visible = items.filter(
    (order) =>
      (filter === 'all' || order.status === filter) && String(order.id).includes(search.trim()),
  );
  const changeStatus = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!selected) return;
    const result = await dispatch(
      updateOrder({
        id: selected.id,
        role,
        ...(role === 'admin' ? { status: nextStatus, adminNote: note } : {}),
      }),
    );
    if (updateOrder.fulfilled.match(result)) {
      setCancel(false);
      dispatch(
        showNotice({
          message:
            role === 'admin'
              ? 'Order status updated.'
              : 'Order cancelled. Your reservation has been released.',
          tone: 'success',
        }),
      );
    }
  };
  return (
    <>
      <PageTitle
        eyebrow={role === 'admin' ? 'STORE OPERATIONS' : 'YOUR COLLECTION, ON ITS WAY'}
        title={role === 'admin' ? 'Orders' : 'Your orders.'}
        description={
          role === 'admin'
            ? 'Every order, from the first click to the doorstep.'
            : 'Keep an eye on your everyday essentials.'
        }
        action={
          <button className="button secondary" onClick={() => void dispatch(loadOrders(role))}>
            Refresh
          </button>
        }
      />
      <div className="table-controls">
        <div className="tabs">
          {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(
            (value) => (
              <button
                className={filter === value ? 'active' : ''}
                key={value}
                onClick={() => setFilter(value)}
              >
                {label(value)}
                {value === 'all' && <span>{items.length}</span>}
              </button>
            ),
          )}
        </div>
        <label className="small-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find an order…"
            aria-label="Search order ID"
          />
        </label>
      </div>
      <ErrorBanner
        message={!open ? error : undefined}
        retry={() => void dispatch(loadOrders(role))}
      />
      {status === 'loading' && !items.length ? (
        <Spinner label="Loading orders…" />
      ) : visible.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Placed</th>
                <th>Items</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total</th>
                <th>
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>#{String(order.id).padStart(4, '0')}</strong>
                    {role === 'admin' && <small>Customer #{order.userId}</small>}
                  </td>
                  <td>{date(order.createdAt)}</td>
                  <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                  <td>
                    <Badge value={order.status} />
                  </td>
                  <td>
                    <Badge value={order.paymentStatus} />
                  </td>
                  <td className="numeric">{money(order.total)}</td>
                  <td>
                    <button
                      className="text-button"
                      onClick={() => {
                        setOpen(true);
                        void dispatch(loadOrder({ id: order.id, role }));
                      }}
                    >
                      Details <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        status !== 'failed' && (
          <EmptyState
            title={
              filter === 'all'
                ? 'A new order starts with something good.'
                : 'Nothing here just yet.'
            }
            action={
              role === 'customer' ? (
                <Link className="button" to="/">
                  Explore the collection <ArrowRight size={15} />
                </Link>
              ) : undefined
            }
          >
            Orders matching your selection will appear here.
          </EmptyState>
        )
      )}
      {open && (
        <Modal
          title={selected ? `Order #${String(selected.id).padStart(4, '0')}` : 'Order details'}
          wide
          busy={busy}
          onClose={() => {
            setOpen(false);
            dispatch(closeOrder());
          }}
        >
          <ErrorBanner message={error} />
          {busy && !selected ? (
            <Spinner label="Loading order…" />
          ) : (
            selected && (
              <>
                <div className="order-summary-bar">
                  <Badge value={selected.status} />
                  <span className="muted small">Placed {date(selected.createdAt)}</span>
                  <strong>{money(selected.total)}</strong>
                </div>
                <div className="order-lines">
                  {selected.items.map((item) => (
                    <div key={item.id}>
                      <span>
                        {item.productName}
                        <small>
                          {item.quantity} × {money(item.unitPrice)}
                        </small>
                      </span>
                      <strong>{money(item.subtotal)}</strong>
                    </div>
                  ))}
                </div>
                <div className="order-details-grid">
                  <section>
                    <span className="field-label">SHIPPING ADDRESS</span>
                    <p className="preserve-lines">{selected.shippingAddress}</p>
                  </section>
                  <section>
                    <span className="field-label">PAYMENT</span>
                    <p>
                      {label(selected.paymentMethod)}
                      <br />
                      <Badge value={selected.paymentStatus} />
                    </p>
                  </section>
                </div>
                {role === 'admin' && transitions[selected.status].length > 0 && (
                  <form className="order-transition" onSubmit={(event) => void changeStatus(event)}>
                    <label className="field">
                      Next status
                      <select
                        value={nextStatus}
                        onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                      >
                        {transitions[selected.status].map((value) => (
                          <option
                            key={value}
                            value={value}
                            disabled={
                              value === 'delivered' &&
                              selected.paymentMethod === 'online' &&
                              selected.paymentStatus !== 'paid'
                            }
                          >
                            {label(value)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      Admin note
                      <textarea
                        maxLength={1000}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Optional note about this update"
                        rows={2}
                      />
                    </label>
                    <button className="button" disabled={busy}>
                      {busy ? 'Updating…' : 'Update order'}
                      <ArrowRight size={15} />
                    </button>
                  </form>
                )}
                {role === 'admin' &&
                  transitions[selected.status].length === 0 &&
                  selected.adminNote && <p className="muted">Admin note: {selected.adminNote}</p>}
                {role === 'customer' && ['pending', 'confirmed'].includes(selected.status) && (
                  <div className="form-actions">
                    <button
                      className="button secondary danger-text"
                      disabled={busy}
                      onClick={() => setCancel(true)}
                    >
                      Cancel order
                    </button>
                  </div>
                )}
              </>
            )
          )}
        </Modal>
      )}
      {cancel && (
        <Confirm
          title="Cancel this order?"
          description="The order will be cancelled and its reserved stock released. This cannot be undone."
          onClose={() => setCancel(false)}
          onConfirm={() => void changeStatus()}
          busy={busy}
          error={error}
        />
      )}
    </>
  );
}
