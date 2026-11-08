import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  clearAdminError,
  closeAdminProduct,
  loadAdminProduct,
  loadAdminResource,
  mutateAdmin,
} from '../../features/admin/adminSlice';
import { loadCatalog } from '../../features/catalog/catalogSlice';
import { showNotice } from '../../features/ui/uiSlice';
import {
  Badge,
  Confirm,
  EmptyState,
  ErrorBanner,
  Modal,
  PageTitle,
  Photo,
  Spinner,
} from '../../components/ui';
import { money, productPhoto } from '../../lib/format';
import type { Photo as ProductPhoto, Product } from '../../lib/types';
export default function ProductsPage() {
  const dispatch = useAppDispatch();
  const admin = useAppSelector((s) => s.admin);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editor, setEditor] = useState<Product | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [details, setDetails] = useState(false);
  useEffect(() => {
    void dispatch(loadAdminResource('products'));
    void dispatch(loadAdminResource('categories'));
  }, [dispatch]);
  const refresh = () => {
    void dispatch(loadAdminResource('products'));
    void dispatch(loadCatalog());
  };
  const toggleActive = async (product: Product) => {
    dispatch(clearAdminError());
    const result = await dispatch(
      mutateAdmin({
        resource: 'products',
        action: product.isActive ? 'deactivate' : 'activate',
        id: product.id,
      }),
    );
    if (mutateAdmin.fulfilled.match(result)) {
      refresh();
      dispatch(
        showNotice({
          message: product.isActive ? 'Product deactivated.' : 'Product activated.',
          tone: 'success',
        }),
      );
    }
  };
  const remove = async () => {
    if (!deleting) return;
    const result = await dispatch(
      mutateAdmin({ resource: 'products', action: 'delete', id: deleting.id }),
    );
    if (mutateAdmin.fulfilled.match(result)) {
      setDeleting(null);
      refresh();
      dispatch(showNotice({ message: 'Product deleted.', tone: 'success' }));
    }
  };
  const visible = admin.products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === 'all' || p.isActive === (filter === 'active')),
  );
  return (
    <>
      <PageTitle
        eyebrow="THE COLLECTION"
        title="Products"
        description="A considered collection starts with the details."
        action={
          <button
            className="button"
            onClick={() => {
              dispatch(clearAdminError());
              setEditor('new');
            }}
          >
            <Plus size={17} />
            Add product
          </button>
        }
      />
      <div className="table-controls">
        <div className="tabs">
          {['all', 'active', 'inactive'].map((value) => (
            <button
              key={value}
              className={filter === value ? 'active' : ''}
              onClick={() => setFilter(value)}
            >
              {value[0].toUpperCase() + value.slice(1)}
              {value === 'all' && <span>{admin.products.length}</span>}
            </button>
          ))}
        </div>
        <label className="small-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a product…"
            aria-label="Search admin products"
          />
        </label>
      </div>
      <ErrorBanner
        message={admin.errors.products}
        retry={() => void dispatch(loadAdminResource('products'))}
      />
      <ErrorBanner message={!editor && !deleting && !details ? admin.error : undefined} />
      {admin.status.products === 'loading' && !admin.products.length ? (
        <Spinner label="Loading your collection…" />
      ) : visible.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="table-product">
                      <Photo src={productPhoto(product)} alt={product.name} />
                      <span>
                        <strong>{product.name}</strong>
                        <small>#{String(product.id).padStart(4, '0')}</small>
                      </span>
                    </div>
                  </td>
                  <td>
                    {product.categoryIds
                      .map((id) => admin.categories.find((c) => c.id === id)?.name || `#${id}`)
                      .join(', ')}
                  </td>
                  <td className="numeric">{money(product.price)}</td>
                  <td>
                    <button
                      className="status-toggle"
                      onClick={() => void toggleActive(product)}
                      disabled={admin.busy}
                      aria-label={`${product.isActive ? 'Deactivate' : 'Activate'} ${product.name}`}
                    >
                      <Badge value={product.isActive ? 'active' : 'inactive'} />
                    </button>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-button"
                        aria-label={`View ${product.name}`}
                        onClick={() => {
                          setDetails(true);
                          void dispatch(loadAdminProduct(product.id));
                        }}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Edit ${product.name}`}
                        onClick={() => {
                          dispatch(clearAdminError());
                          setEditor(product);
                        }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-button danger-text"
                        aria-label={`Delete ${product.name}`}
                        onClick={() => {
                          dispatch(clearAdminError());
                          setDeleting(product);
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        admin.status.products !== 'failed' && (
          <EmptyState
            title="Make room for something good."
            action={
              <button className="button" onClick={() => setEditor('new')}>
                <Plus size={15} />
                Add a product
              </button>
            }
          >
            Your products will appear here. Start with a name, a price, and a category.
          </EmptyState>
        )
      )}
      {editor && (
        <ProductEditor
          product={editor === 'new' ? undefined : editor}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            refresh();
          }}
        />
      )}
      {deleting && (
        <Confirm
          title="Delete this product?"
          description={`“${deleting.name}” will be permanently removed. You can deactivate it instead to keep its details.`}
          onConfirm={() => void remove()}
          onClose={() => setDeleting(null)}
          busy={admin.busy}
          error={admin.error}
        />
      )}
      {details && (
        <Modal
          title="Product details"
          wide
          onClose={() => {
            setDetails(false);
            dispatch(closeAdminProduct());
          }}
        >
          <ErrorBanner message={admin.error} />
          {admin.detailLoading ? (
            <Spinner label="Loading product and stock…" />
          ) : (
            admin.selectedProduct && (
              <>
                <div className="admin-product-detail">
                  <Photo
                    src={productPhoto(admin.selectedProduct)}
                    alt={admin.selectedProduct.name}
                  />
                  <section>
                    <span className="eyebrow">PRODUCT #{admin.selectedProduct.id}</span>
                    <h2>{admin.selectedProduct.name}</h2>
                    <p className="detail-price">{money(admin.selectedProduct.price)}</p>
                    <Badge value={admin.selectedProduct.isActive ? 'active' : 'inactive'} />
                  </section>
                </div>
                <div className="section-title">
                  <h3>Inventory</h3>
                  <Link to="/admin/inventory" className="text-button">
                    Manage stock <ArrowRight size={14} />
                  </Link>
                </div>
                {admin.selectedProduct.inventory ? (
                  <div className="stock-grid">
                    {[
                      ['On hand', admin.selectedProduct.inventory.quantityOnHand],
                      ['Reserved', admin.selectedProduct.inventory.quantityReserved],
                      ['Available', admin.selectedProduct.inventory.availableQuantity],
                      ['Low-stock threshold', admin.selectedProduct.inventory.lowStockThreshold],
                    ].map(([name, value]) => (
                      <div key={name}>
                        <small>{name}</small>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="note-box">
                    Inventory hasn’t been initialized for this product.{' '}
                    <Link to={`/admin/inventory?product=${admin.selectedProduct.id}`}>
                      Initialize inventory →
                    </Link>
                  </div>
                )}
              </>
            )
          )}
        </Modal>
      )}
    </>
  );
}
function ProductEditor({
  product,
  onClose,
  onSaved,
}: {
  product?: Product;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dispatch = useAppDispatch();
  const { categories, busy, error, errors, status } = useAppSelector((s) => s.admin);
  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(String(product?.price || ''));
  const [isActive, setActive] = useState(product?.isActive ?? true);
  const [categoryIds, setCategories] = useState(product?.categoryIds || []);
  const [photos, setPhotos] = useState<ProductPhoto[]>(product?.photos || []);
  const [validation, setValidation] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!categoryIds.length) {
      setValidation('Choose at least one category for this product.');
      return;
    }
    const result = await dispatch(
      mutateAdmin({
        resource: 'products',
        action: product ? 'update' : 'create',
        id: product?.id,
        body: {
          name: name.trim(),
          price: Number(price),
          isActive,
          categoryIds,
          photos: photos.map((photo, index) => ({
            url: photo.url.trim(),
            isPrimary: photo.isPrimary,
            sortOrder: index,
          })),
        },
      }),
    );
    if (mutateAdmin.fulfilled.match(result)) {
      dispatch(
        showNotice({
          message: product ? 'Product updated.' : 'Your new product is ready.',
          tone: 'success',
        }),
      );
      onSaved();
    }
  };
  return (
    <Modal
      title={product ? 'Edit product' : 'Something new for the collection'}
      wide
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={(event) => void submit(event)}>
        <ErrorBanner message={validation || error} />
        <div className="form-grid">
          <label className="field">
            Product name
            <input
              required
              minLength={2}
              maxLength={150}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Give it a clear, thoughtful name"
            />
          </label>
          <label className="field">
            Price
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </label>
        </div>
        <label className="check-row form-check">
          <input type="checkbox" checked={isActive} onChange={(e) => setActive(e.target.checked)} />
          <span>Active and visible in the storefront</span>
        </label>
        <fieldset className="category-picker">
          <legend>
            Categories <span className="muted">· choose at least one</span>
          </legend>
          <ErrorBanner
            message={errors.categories}
            retry={() => void dispatch(loadAdminResource('categories'))}
          />
          {status.categories === 'loading' ? (
            <Spinner />
          ) : categories.length ? (
            categories.map((category) => (
              <label key={category.id} className="check-row">
                <input
                  type="checkbox"
                  checked={categoryIds.includes(category.id)}
                  onChange={() => {
                    setValidation('');
                    setCategories((ids) =>
                      ids.includes(category.id)
                        ? ids.filter((id) => id !== category.id)
                        : [...ids, category.id],
                    );
                  }}
                />
                <span>
                  {category.name}
                  {!category.isActive && ' (inactive)'}
                </span>
              </label>
            ))
          ) : (
            <p className="small muted">Create a category first, then add your product.</p>
          )}
        </fieldset>
        <div className="section-title">
          <h3>Product photos</h3>
          <button
            type="button"
            className="text-button"
            onClick={() =>
              setPhotos((items) => [
                ...items,
                { url: '', isPrimary: !items.length, sortOrder: items.length },
              ])
            }
          >
            <Plus size={14} />
            Add photo URL
          </button>
        </div>
        {!photos.length && (
          <p className="small muted">
            Add a public image URL, or keep the product without a photo.
          </p>
        )}
        {photos.map((photo, index) => (
          <div className="photo-editor-row" key={index}>
            <label className="field">
              Photo {index + 1}
              <input
                aria-label={`Photo ${index + 1} URL`}
                type="url"
                pattern="https?://.*"
                required
                maxLength={2048}
                value={photo.url}
                onChange={(e) =>
                  setPhotos((items) =>
                    items.map((p, i) => (i === index ? { ...p, url: e.target.value } : p)),
                  )
                }
                placeholder="https://…"
              />
            </label>
            <label className="check-row">
              <input
                type="radio"
                name="primaryPhoto"
                checked={photo.isPrimary}
                onChange={() =>
                  setPhotos((items) => items.map((p, i) => ({ ...p, isPrimary: i === index })))
                }
              />
              Primary
            </label>
            <button
              type="button"
              className="icon-button danger-text"
              aria-label={`Remove photo ${index + 1}`}
              onClick={() => setPhotos((items) => items.filter((_, i) => i !== index))}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <div className="form-actions">
          <button type="button" className="button secondary" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button className="button" disabled={busy || !categories.length}>
            {busy ? 'Saving…' : product ? 'Save changes' : 'Add product'}
            <ArrowRight size={15} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
