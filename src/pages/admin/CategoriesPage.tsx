import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Pencil, Plus, Search, Tags, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { clearAdminError, loadAdminResource, mutateAdmin } from '../../features/admin/adminSlice';
import { loadCatalog } from '../../features/catalog/catalogSlice';
import { showNotice } from '../../features/ui/uiSlice';
import {
  Badge,
  Confirm,
  EmptyState,
  ErrorBanner,
  Modal,
  PageTitle,
  Spinner,
} from '../../components/ui';
import type { Category } from '../../lib/types';
export default function CategoriesPage() {
  const dispatch = useAppDispatch();
  const admin = useAppSelector((s) => s.admin);
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<Category | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);
  useEffect(() => {
    void dispatch(loadAdminResource('categories'));
    void dispatch(loadAdminResource('products'));
  }, [dispatch]);
  const edit = (category?: Category) => {
    dispatch(clearAdminError());
    setEditor(category || 'new');
    setName(category?.name || '');
    setActive(category?.isActive ?? true);
  };
  const refresh = () => {
    void dispatch(loadAdminResource('categories'));
    void dispatch(loadCatalog());
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await dispatch(
      mutateAdmin({
        resource: 'categories',
        action: editor === 'new' ? 'create' : 'update',
        id: typeof editor === 'object' ? editor?.id : undefined,
        body: { name: name.trim(), isActive: active },
      }),
    );
    if (mutateAdmin.fulfilled.match(result)) {
      setEditor(null);
      refresh();
      dispatch(showNotice({ message: 'Category saved.', tone: 'success' }));
    }
  };
  const remove = async () => {
    if (!deleting) return;
    const result = await dispatch(
      mutateAdmin({ resource: 'categories', action: 'delete', id: deleting.id }),
    );
    if (mutateAdmin.fulfilled.match(result)) {
      setDeleting(null);
      refresh();
      dispatch(showNotice({ message: 'Category deleted.', tone: 'success' }));
    }
  };
  const toggle = async (category: Category) => {
    const result = await dispatch(
      mutateAdmin({
        resource: 'categories',
        action: category.isActive ? 'deactivate' : 'update',
        id: category.id,
        ...(!category.isActive ? { body: { isActive: true } } : {}),
      }),
    );
    if (mutateAdmin.fulfilled.match(result)) refresh();
  };
  const visible = admin.categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        eyebrow="A PLACE FOR EVERYTHING"
        title="Categories"
        description="Help customers find their kind of everyday."
        action={
          <button className="button" onClick={() => edit()}>
            <Plus size={17} />
            Add category
          </button>
        }
      />
      <div className="table-controls">
        <span className="small muted">{admin.categories.length} categories in your collection</span>
        <label className="small-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a category…"
            aria-label="Search categories"
          />
        </label>
      </div>
      <ErrorBanner
        message={admin.errors.categories}
        retry={() => void dispatch(loadAdminResource('categories'))}
      />
      <ErrorBanner message={!editor && !deleting ? admin.error : undefined} />
      {admin.status.categories === 'loading' && !admin.categories.length ? (
        <Spinner label="Loading categories…" />
      ) : visible.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Products</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((category) => (
                <tr key={category.id}>
                  <td>
                    <div className="table-product">
                      <span className="category-icon">
                        <Tags size={19} />
                      </span>
                      <span>
                        <strong>{category.name}</strong>
                        <small>Category #{category.id}</small>
                      </span>
                    </div>
                  </td>
                  <td>
                    {admin.status.products === 'succeeded'
                      ? admin.products.filter((p) => p.categoryIds.includes(category.id)).length
                      : '—'}
                  </td>
                  <td>
                    <button
                      className="status-toggle"
                      disabled={admin.busy}
                      onClick={() => void toggle(category)}
                      aria-label={`${category.isActive ? 'Deactivate' : 'Activate'} ${category.name}`}
                    >
                      <Badge value={category.isActive ? 'active' : 'inactive'} />
                    </button>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-button"
                        onClick={() => edit(category)}
                        aria-label={`Edit ${category.name}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-button danger-text"
                        onClick={() => {
                          dispatch(clearAdminError());
                          setDeleting(category);
                        }}
                        aria-label={`Delete ${category.name}`}
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
        admin.status.categories !== 'failed' && (
          <EmptyState
            title="Give your collection a little structure."
            action={
              <button className="button" onClick={() => edit()}>
                <Plus size={15} />
                Add a category
              </button>
            }
          >
            Create a category to start organizing your products.
          </EmptyState>
        )
      )}
      {editor && (
        <Modal
          title={editor === 'new' ? 'A new place in the collection' : 'Edit category'}
          busy={admin.busy}
          onClose={() => setEditor(null)}
        >
          <form onSubmit={(event) => void submit(event)}>
            <ErrorBanner message={admin.error} />
            <label className="field">
              Category name
              <input
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Audio & accessories"
              />
            </label>
            <label className="check-row form-check">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Active and visible to customers
            </label>
            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                disabled={admin.busy}
                onClick={() => setEditor(null)}
              >
                Cancel
              </button>
              <button className="button" disabled={admin.busy}>
                {admin.busy ? 'Saving…' : 'Save category'}
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <Confirm
          title="Delete this category?"
          description={`“${deleting.name}” will be removed. If it’s still in use, the store may require you to update those products first.`}
          onConfirm={() => void remove()}
          onClose={() => setDeleting(null)}
          busy={admin.busy}
          error={admin.error}
        />
      )}
    </>
  );
}
