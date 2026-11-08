import { useEffect } from 'react';
import {
  ArrowRight,
  Bell,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  loadNotifications,
  mutateNotification,
  setNotificationFilter,
  setNotificationPage,
} from '../features/notifications/notificationsSlice';
import { EmptyState, ErrorBanner, PageTitle, Spinner } from '../components/ui';
import { date, label } from '../lib/format';
export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const role = useAppSelector((s) => s.auth.session!.role);
  const { data, status, error, busy, page, filter } = useAppSelector((s) => s.notifications);
  const reload = () => void dispatch(loadNotifications({ role, page, filter }));
  useEffect(() => {
    void dispatch(loadNotifications({ role, page, filter }));
  }, [role, page, filter, dispatch]);
  const update = async (action: 'read' | 'read-all' | 'delete', id?: number) => {
    const result = await dispatch(mutateNotification({ action, id }));
    if (mutateNotification.fulfilled.match(result)) reload();
  };
  return (
    <>
      <PageTitle
        eyebrow={role === 'admin' ? 'KEEP AN EYE ON THINGS' : 'A LITTLE UPDATE FOR YOU'}
        title="Notifications"
        description={
          role === 'admin'
            ? 'Updates from across your store.'
            : 'The latest on your orders, all in one place.'
        }
        action={
          role === 'customer' ? (
            <button
              className="button secondary"
              disabled={busy || !data?.items.length}
              onClick={() => void update('read-all')}
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
          ) : (
            <button className="button secondary" onClick={reload}>
              Refresh
            </button>
          )
        }
      />
      <div className="table-controls">
        <div className="tabs">
          {['all', 'unread', 'read'].map((value) => (
            <button
              key={value}
              className={filter === value ? 'active' : ''}
              onClick={() => dispatch(setNotificationFilter(value))}
            >
              {label(value)}
              {value === 'unread' && role === 'customer' && data?.unreadCount !== undefined && (
                <span>{data.unreadCount}</span>
              )}
            </button>
          ))}
        </div>
        {data && <span className="small muted">{data.pagination.total} notifications</span>}
      </div>
      <ErrorBanner message={error} retry={reload} />
      {status === 'loading' ? (
        <Spinner label="Gathering your updates…" />
      ) : data?.items.length ? (
        <div className="notification-list">
          {data.items.map((item) => (
            <article className={`notification-card ${item.isRead ? '' : 'unread'}`} key={item.id}>
              <span className="notification-icon">
                <Bell size={19} />
              </span>
              <div className="notification-body">
                <div>
                  <span className="eyebrow">{label(item.type)}</span>
                  <time>{date(item.createdAt)}</time>
                </div>
                <h3>
                  {item.title}
                  {!item.isRead && <span className="unread-dot" />}
                </h3>
                <p className="preserve-lines">{item.message}</p>
                {item.relatedOrderId && (
                  <Link
                    className="text-button"
                    to={`${role === 'admin' ? '/admin' : ''}/orders?order=${item.relatedOrderId}`}
                  >
                    View order #{item.relatedOrderId} <ArrowRight size={14} />
                  </Link>
                )}
                {role === 'admin' && (
                  <span className="small muted">
                    {item.recipientType === 'admin'
                      ? 'Admin notification'
                      : `Customer #${item.recipientId}`}
                  </span>
                )}
              </div>
              {role === 'customer' && (
                <div className="notification-actions">
                  {!item.isRead && (
                    <button
                      className="icon-button"
                      disabled={busy}
                      onClick={() => void update('read', item.id)}
                      aria-label={`Mark ${item.title} as read`}
                    >
                      <Check size={18} />
                    </button>
                  )}
                  <button
                    className="icon-button muted"
                    disabled={busy}
                    onClick={() => void update('delete', item.id)}
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        status !== 'failed' && (
          <EmptyState title="All quiet. All good.">
            Updates will appear here when there’s something to share.
          </EmptyState>
        )
      )}
      {data && data.pagination.total_pages > 1 && (
        <div className="pagination">
          <button
            className="button secondary small-button"
            disabled={page <= 1 || status === 'loading'}
            onClick={() => dispatch(setNotificationPage(page - 1))}
          >
            <ChevronLeft size={15} /> Previous
          </button>
          <span>
            Page {page} of {data.pagination.total_pages}
          </span>
          <button
            className="button secondary small-button"
            disabled={page >= data.pagination.total_pages || status === 'loading'}
            onClick={() => dispatch(setNotificationPage(page + 1))}
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}
    </>
  );
}
