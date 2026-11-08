import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, History, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  clearAdminError,
  loadAdminResource,
  loadMovements,
  mutateAdmin,
} from '../../features/admin/adminSlice';
import { showNotice } from '../../features/ui/uiSlice';
import { Badge, EmptyState, ErrorBanner, Modal, PageTitle, Spinner } from '../../components/ui';
import { date, label } from '../../lib/format';
import type { Inventory } from '../../lib/types';
export default function InventoryPage() {
  const dispatch = useAppDispatch();
  const admin = useAppSelector((s) => s.admin);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<Inventory | 'new' | null>(null);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [threshold, setThreshold] = useState('5');
  const [operation, setOperation] = useState('add');
  const [reason, setReason] = useState('');
  const [movementProduct, setMovementProduct] = useState('');
  const [params] = useSearchParams();
  const productParam = params.get('product');
  useEffect(() => {
    void dispatch(loadAdminResource('inventory'));
    void dispatch(loadAdminResource('products'));
  }, [dispatch]);
  useEffect(() => {
    if (productParam && /^\d+$/.test(productParam)) {
      setEditor('new');
      setProductId(productParam);
      setQuantity('0');
      dispatch(clearAdminError());
    }
  }, [productParam, dispatch]);
  useEffect(() => {
    if (tab === 'movements')
      void dispatch(loadMovements(movementProduct ? Number(movementProduct) : undefined));
  }, [tab, movementProduct, dispatch]);
  const edit = (record?: Inventory) => {
    dispatch(clearAdminError());
    setEditor(record || 'new');
    setProductId(record ? String(record.productId) : '');
    setQuantity(record ? '1' : '0');
    setThreshold('5');
    setOperation('add');
    setReason('');
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await dispatch(
      mutateAdmin({
        resource: 'inventory',
        action: editor === 'new' ? 'create' : 'update',
        id: typeof editor === 'object' ? editor?.productId : undefined,
        body:
          editor === 'new'
            ? {
                productId: Number(productId),
                quantityOnHand: Number(quantity),
                lowStockThreshold: Number(threshold),
              }
            : { operation, quantity: Number(quantity), reason: reason.trim() },
      }),
    );
    if (mutateAdmin.fulfilled.match(result)) {
      setEditor(null);
      void dispatch(loadAdminResource('inventory'));
      if (tab === 'movements')
        void dispatch(loadMovements(movementProduct ? Number(movementProduct) : undefined));
      dispatch(
        showNotice({
          message: editor === 'new' ? 'Inventory initialized.' : 'Stock adjusted.',
          tone: 'success',
        }),
      );
    }
  };
  const visible = admin.inventory.filter(
    (i) =>
      (tab !== 'low' || i.isLowStock) &&
      (i.product?.name || String(i.productId)).toLowerCase().includes(search.toLowerCase()),
  );
  const availableProducts = admin.products.filter(
    (p) => !admin.inventory.some((i) => i.productId === p.id),
  );
  return (
    <>
      <PageTitle
        eyebrow="THE ESSENTIALS, IN CHECK"
        title="Inventory"
        description="See what’s available. Keep the good things coming."
        action={
          <button className="button" onClick={() => edit()}>
            <Plus size={17} />
            Initialize stock
          </button>
        }
      />
      <div className="table-controls">
        <div className="tabs">
          <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>
            All inventory <span>{admin.inventory.length}</span>
          </button>
          <button className={tab === 'low' ? 'active' : ''} onClick={() => setTab('low')}>
            Low stock <span>{admin.inventory.filter((i) => i.isLowStock).length}</span>
          </button>
          <button
            className={tab === 'movements' ? 'active' : ''}
            onClick={() => setTab('movements')}
          >
            Movements
          </button>
        </div>
        {tab === 'movements' ? (
          <select
            aria-label="Filter movements by product"
            className="standalone-select"
            value={movementProduct}
            onChange={(e) => setMovementProduct(e.target.value)}
          >
            <option value="">All products</option>
            {admin.products.map((p) => (
              <option value={p.id} key={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        ) : (
          <label className="small-search">
            <Search size={15} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a product…"
              aria-label="Search inventory"
            />
          </label>
        )}
      </div>
      <ErrorBanner
        message={admin.errors.inventory}
        retry={() => void dispatch(loadAdminResource('inventory'))}
      />
      <ErrorBanner message={!editor ? admin.error : undefined} />
      {tab === 'movements' ? (
        admin.movementsLoading ? (
          <Spinner label="Loading movement history…" />
        ) : admin.movements.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Movement</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Before → after</th>
                  <th>Reason</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {admin.movements.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="movement-label">
                        <History size={15} />
                        {label(item.type)}
                      </span>
                      <small>
                        {item.referenceId
                          ? `Ref: ${item.referenceId}`
                          : item.referenceOrderId
                            ? `Order #${item.referenceOrderId}`
                            : `#${item.id}`}
                      </small>
                    </td>
                    <td>
                      {item.inventory
                        ? admin.products.find((p) => p.id === item.inventory?.productId)?.name ||
                          `Product #${item.inventory.productId}`
                        : `Inventory #${item.inventoryId}`}
                    </td>
                    <td className="numeric">{item.quantity}</td>
                    <td>
                      {item.quantityBefore} → {item.quantityAfter}
                    </td>
                    <td className="reason-cell">{item.reason}</td>
                    <td>{date(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !admin.error && (
            <EmptyState title="A clear view of every change.">
              Stock movements will appear here as inventory changes.
            </EmptyState>
          )
        )
      ) : admin.status.inventory === 'loading' && !admin.inventory.length ? (
        <Spinner label="Checking your stock…" />
      ) : visible.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>On hand</th>
                <th>Reserved</th>
                <th>Available</th>
                <th>Threshold</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>
                      {item.product?.name ||
                        admin.products.find((p) => p.id === item.productId)?.name ||
                        `Product #${item.productId}`}
                    </strong>
                    <small>Product #{item.productId}</small>
                  </td>
                  <td className="numeric">{item.quantityOnHand}</td>
                  <td className="numeric muted">{item.quantityReserved}</td>
                  <td className="numeric">
                    <strong>{item.availableQuantity}</strong>
                  </td>
                  <td>{item.lowStockThreshold}</td>
                  <td>
                    <Badge value={item.isLowStock ? 'low_stock' : 'stocked'} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="text-button"
                        disabled={admin.busy}
                        onClick={() => edit(item)}
                      >
                        <SlidersHorizontal size={14} />
                        Adjust
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`View movements for ${item.product?.name || `product ${item.productId}`}`}
                        onClick={() => {
                          setMovementProduct(String(item.productId));
                          setTab('movements');
                        }}
                      >
                        <History size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        admin.status.inventory !== 'failed' && (
          <EmptyState
            title={
              tab === 'low' ? 'The essentials are looking good.' : 'Ready to stock the collection.'
            }
            action={
              tab === 'all' ? (
                <button className="button" onClick={() => edit()}>
                  <Plus size={15} />
                  Initialize stock
                </button>
              ) : undefined
            }
          >
            {tab === 'low'
              ? 'No inventory records match this selection.'
              : 'Initialize inventory for a product to make its quantities available.'}
          </EmptyState>
        )
      )}
      {editor && (
        <Modal
          title={editor === 'new' ? 'Initialize product inventory' : 'Adjust stock'}
          busy={admin.busy}
          onClose={() => setEditor(null)}
        >
          <form onSubmit={(event) => void submit(event)}>
            <ErrorBanner message={admin.error} />
            {editor === 'new' ? (
              <>
                <ErrorBanner
                  message={admin.errors.products}
                  retry={() => void dispatch(loadAdminResource('products'))}
                />
                <label className="field">
                  Product
                  <select required value={productId} onChange={(e) => setProductId(e.target.value)}>
                    <option value="">Choose a product</option>
                    {availableProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="form-grid">
                  <label className="field">
                    Initial quantity
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    Low-stock threshold
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                    />
                  </label>
                </div>
                {!availableProducts.length && admin.status.products === 'succeeded' && (
                  <p className="small muted">
                    All current products already have inventory. Add a product first.
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="note-box">
                  <strong>{editor.product?.name || `Product #${editor.productId}`}</strong>
                  <span>
                    {editor.availableQuantity} available · {editor.quantityReserved} reserved
                  </span>
                </div>
                <div className="form-grid">
                  <label className="field">
                    Operation
                    <select value={operation} onChange={(e) => setOperation(e.target.value)}>
                      <option value="add">Add stock</option>
                      <option value="remove">Remove stock</option>
                    </select>
                  </label>
                  <label className="field">
                    Quantity
                    <input
                      type="number"
                      required
                      min="1"
                      max={operation === 'remove' ? editor.availableQuantity : undefined}
                      step="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </label>
                </div>
                <label className="field">
                  Reason
                  <textarea
                    minLength={3}
                    maxLength={500}
                    required
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="What is this adjustment for?"
                  />
                </label>
              </>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                disabled={admin.busy}
                onClick={() => setEditor(null)}
              >
                Cancel
              </button>
              <button
                className="button"
                disabled={
                  admin.busy ||
                  (editor === 'new' &&
                    (!productId || !availableProducts.some((p) => String(p.id) === productId)))
                }
              >
                {admin.busy
                  ? 'Saving…'
                  : editor === 'new'
                    ? 'Initialize inventory'
                    : 'Save adjustment'}
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
