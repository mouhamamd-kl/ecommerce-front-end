import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, ArrowRight, Check, LoaderCircle, Package, RefreshCw, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <span className="loading" role="status">
      <LoaderCircle className="spin" size={18} />
      {label}
    </span>
  );
}
export function ErrorBanner({ message, retry }: { message?: string | null; retry?: () => void }) {
  return message ? (
    <div className="error-banner" role="alert">
      <AlertCircle size={18} />
      <span>{message}</span>
      {retry && (
        <button className="text-button" onClick={retry}>
          <RefreshCw size={14} /> Try again
        </button>
      )}
    </div>
  ) : null;
}
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Package size={30} strokeWidth={1.3} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Badge({ value }: { value: string }) {
  return <span className={`badge badge-${value}`}>{value.replaceAll('_', ' ')}</span>;
}
export function Photo({
  src,
  alt,
  className = '',
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <div className={`product-photo ${className}`}>
      {src && !failed ? (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className="photo-placeholder">
          <Package size={44} strokeWidth={1} />
          <span>No photo yet</span>
        </div>
      )}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  busy = false,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const node = ref.current;
    node?.showModal();
    return () => {
      node?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      className={`modal ${wide ? 'modal-wide' : ''}`}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 id={id}>{title}</h2>
          <button
            type="button"
            className="icon-button"
            disabled={busy}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export function Confirm({
  title,
  description,
  onConfirm,
  onClose,
  busy,
  error,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
  error?: string | null;
}) {
  return (
    <Modal title={title} onClose={onClose} busy={busy}>
      <p className="muted">{description}</p>
      <ErrorBanner message={error} />
      <div className="form-actions">
        <button className="button secondary" disabled={busy} onClick={onClose}>
          Keep it
        </button>
        <button className="button danger" disabled={busy} onClick={onConfirm}>
          {busy ? <Spinner label="Working…" /> : 'Confirm'}
        </button>
      </div>
    </Modal>
  );
}
export function PanelLink({
  to,
  title,
  children,
}: {
  to: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Link to={to} className="panel-link">
      <span>
        <strong>{title}</strong>
        <small>{children}</small>
      </span>
      <ArrowRight size={20} />
    </Link>
  );
}
export function SuccessNote({ children }: { children: ReactNode }) {
  return (
    <div className="success-note">
      <Check size={16} />
      {children}
    </div>
  );
}
