import { useEffect } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Grid2X2,
  List,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  loadCatalog,
  loadMore,
  resetFilters,
  selectFilteredProducts,
  setFilters,
  setLayout,
  toggleCategory,
  toggleFilters,
} from '../features/catalog/catalogSlice';
import { EmptyState, ErrorBanner, Photo } from '../components/ui';
import { useAddToCart } from '../components/useAddToCart';
import { money, productPhoto } from '../lib/format';

export default function CatalogPage() {
  const dispatch = useAppDispatch();
  const catalog = useAppSelector((s) => s.catalog);
  const products = useAppSelector(selectFilteredProducts);
  const { add, busy } = useAddToCart();
  useEffect(() => {
    const refresh = () => { void dispatch(loadCatalog()); };
    refresh();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [dispatch]);
  const count =
    catalog.filters.categoryIds.length +
    Number(!!catalog.filters.minPrice || !!catalog.filters.maxPrice) +
    Number(!!catalog.filters.search);
  const visible = products.slice(0, catalog.visibleCount);
  return (
    <>
      <section className="catalog-heading">
        <div>
          <span className="eyebrow">
            <span className="blue-line" /> THE EVERYDAY COLLECTION
          </span>
          <h1>
            Good things.
            <br />
            <span>For your everyday.</span>
          </h1>
          <p>A considered collection. A little something for you.</p>
        </div>
        <div className="collection-note">
          <span className="orbit">
            <ArrowUpRight size={27} strokeWidth={1.3} />
          </span>
          <span>
            Find your next
            <br />
            <strong>everyday essential.</strong>
          </span>
        </div>
      </section>
      <section className="filter-card" aria-label="Product filters" id="categories">
        <div className="search-row">
          <label className="search-input">
            <Search size={18} />
            <input
              aria-label="Search products"
              placeholder="Search for something good…"
              value={catalog.filters.search}
              onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
            />
            {catalog.filters.search && (
              <button
                onClick={() => dispatch(setFilters({ search: '' }))}
                className="icon-button"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </label>
          <label className="sort-select">
            <span>Sort</span>
            <select
              aria-label="Sort products"
              value={catalog.filters.sort}
              onChange={(e) => dispatch(setFilters({ sort: e.target.value }))}
            >
              <option value="name">Name: A to Z</option>
              <option value="price-asc">Price: Low to high</option>
              <option value="price-desc">Price: High to low</option>
              <option value="newest">Newest added</option>
            </select>
          </label>
        </div>
        <div className="filter-pills">
          <button
            className={`filter-pill ${catalog.filtersOpen ? 'selected' : ''}`}
            onClick={() => dispatch(toggleFilters())}
            aria-expanded={catalog.filtersOpen}
          >
            <SlidersHorizontal size={14} /> Filters{' '}
            {count > 0 && <span className="count-dot">{count}</span>}
            <ChevronDown size={13} />
          </button>
          {catalog.categories.slice(0, 5).map((category) => (
            <button
              key={category.id}
              className={`filter-pill ${catalog.filters.categoryIds.includes(category.id) ? 'active' : ''}`}
              onClick={() => dispatch(toggleCategory(category.id))}
            >
              {category.name}
              {catalog.filters.categoryIds.includes(category.id) && <CheckMark />}
            </button>
          ))}
          <span className="filter-spacer" />
          <span className="small muted">A collection worth exploring</span>
        </div>
        {catalog.filtersOpen && (
          <>
            <div className="filter-body">
              <div className="filter-group">
                <h3>Category</h3>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={!catalog.filters.categoryIds.length}
                    onChange={() => dispatch(setFilters({ categoryIds: [] }))}
                  />
                  <span>All categories</span>
                  <small>{catalog.products.length}</small>
                </label>
                {catalog.categories.map((category) => (
                  <label className="check-row" key={category.id}>
                    <input
                      type="checkbox"
                      checked={catalog.filters.categoryIds.includes(category.id)}
                      onChange={() => dispatch(toggleCategory(category.id))}
                    />
                    <span>{category.name}</span>
                    <small>
                      {catalog.products.filter((p) => p.categoryIds.includes(category.id)).length}
                    </small>
                  </label>
                ))}
                {!catalog.categories.length && (
                  <span className="muted small">Categories appear when available.</span>
                )}
              </div>
              <div className="filter-group">
                <h3>Price range</h3>
                <div className="price-fields">
                  <label>
                    <span>MINIMUM</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Any"
                      aria-label="Minimum price"
                      value={catalog.filters.minPrice}
                      onChange={(e) => dispatch(setFilters({ minPrice: e.target.value }))}
                    />
                  </label>
                  <span>—</span>
                  <label>
                    <span>MAXIMUM</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Any"
                      aria-label="Maximum price"
                      value={catalog.filters.maxPrice}
                      onChange={(e) => dispatch(setFilters({ maxPrice: e.target.value }))}
                    />
                  </label>
                </div>
                {[
                  { title: 'Any price', min: '', max: '' },
                  { title: `Under ${money(50)}`, min: '', max: '50' },
                  { title: `${money(50)} – ${money(150)}`, min: '50', max: '150' },
                  { title: `${money(150)} and above`, min: '150', max: '' },
                ].map((range) => (
                  <label key={range.title} className="check-row">
                    <input
                      type="radio"
                      name="priceRange"
                      checked={
                        catalog.filters.minPrice === range.min &&
                        catalog.filters.maxPrice === range.max
                      }
                      onChange={() =>
                        dispatch(setFilters({ minPrice: range.min, maxPrice: range.max }))
                      }
                    />
                    <span>{range.title}</span>
                  </label>
                ))}
              </div>
              <div className="filter-editorial">
                <span className="eyebrow">A LITTLE LESS SEARCHING</span>
                <h2>
                  More of
                  <br />
                  what you love.
                </h2>
                <p>
                  Choose a category. Find your price.
                  <br />
                  Make it yours.
                </p>
                <ArrowDown size={22} strokeWidth={1.3} />
              </div>
            </div>
            <div className="filter-bottom">
              <span>
                <strong>{count}</strong> {count === 1 ? 'filter' : 'filters'} selected
              </span>
              <div>
                <button
                  className="button secondary small-button"
                  onClick={() => dispatch(resetFilters())}
                >
                  Reset all
                </button>
                <button className="button small-button" onClick={() => dispatch(toggleFilters())}>
                  Show {products.length} results <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      {count > 0 && (
        <div className="active-filters">
          {catalog.filters.search && (
            <button onClick={() => dispatch(setFilters({ search: '' }))}>
              “{catalog.filters.search}” <X size={12} />
            </button>
          )}
          {catalog.filters.categoryIds.map((id) => (
            <button key={id} onClick={() => dispatch(toggleCategory(id))}>
              {catalog.categories.find((c) => c.id === id)?.name || `Category ${id}`}{' '}
              <X size={12} />
            </button>
          ))}
          {(catalog.filters.minPrice || catalog.filters.maxPrice) && (
            <button onClick={() => dispatch(setFilters({ minPrice: '', maxPrice: '' }))}>
              {catalog.filters.minPrice ? money(Number(catalog.filters.minPrice)) : 'Any'} –{' '}
              {catalog.filters.maxPrice ? money(Number(catalog.filters.maxPrice)) : 'Any'}{' '}
              <X size={12} />
            </button>
          )}
          <button className="clear-all" onClick={() => dispatch(resetFilters())}>
            Clear all
          </button>
        </div>
      )}
      <div className="results-toolbar">
        <p>
          <strong>{products.length}</strong>{' '}
          <span className="muted">
            {products.length === 1 ? 'product' : 'products'}{' '}
            {count ? 'match your filters' : 'to make your everyday'}
          </span>
        </p>
        <div className="segmented" aria-label="Product view">
          <button
            className={catalog.layout === 'grid' ? 'active' : ''}
            onClick={() => dispatch(setLayout('grid'))}
            aria-pressed={catalog.layout === 'grid'}
          >
            <Grid2X2 size={14} /> Grid
          </button>
          <button
            className={catalog.layout === 'list' ? 'active' : ''}
            onClick={() => dispatch(setLayout('list'))}
            aria-pressed={catalog.layout === 'list'}
          >
            <List size={15} /> List
          </button>
        </div>
      </div>
      <ErrorBanner message={catalog.error} retry={() => void dispatch(loadCatalog())} />
      {catalog.status === 'loading' && !catalog.products.length ? (
        <div className="product-grid">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="skeleton-card">
              <div />
              <span />
              <span />
            </div>
          ))}
        </div>
      ) : catalog.status === 'succeeded' && !products.length ? (
        <EmptyState
          title={
            catalog.products.length ? 'A fresh search, perhaps?' : 'Something good is on its way.'
          }
          action={
            count ? (
              <button className="button secondary" onClick={() => dispatch(resetFilters())}>
                Clear filters
              </button>
            ) : undefined
          }
        >
          {count
            ? 'Try another category or a wider price range.'
            : 'The collection will appear here as products become available.'}
        </EmptyState>
      ) : (
        <div className={`product-grid ${catalog.layout === 'list' ? 'product-list' : ''}`}>
          {visible.map((product) => (
            <article className="product-card" key={product.id}>
              <Link
                to={`/products/${product.id}`}
                className="product-image-link"
                aria-label={`View ${product.name}`}
              >
                <Photo src={productPhoto(product)} alt={product.name} />
                <span className="product-view">
                  <ArrowUpRight size={18} />
                </span>
              </Link>
              <div className="product-card-body">
                <div className="product-meta">
                  {product.categoryIds
                    .map((id) => catalog.categories.find((c) => c.id === id)?.name)
                    .filter(Boolean)
                    .slice(0, 2)
                    .join(' · ') || 'THE COLLECTION'}
                </div>
                <Link to={`/products/${product.id}`} className="product-name">
                  {product.name}
                </Link>
                <div className="product-card-bottom">
                  <strong>{money(product.price)}</strong>
                  <button
                    className="add-button"
                    onClick={() => void add(product.id)}
                    disabled={busy}
                    aria-label={`Add ${product.name} to cart`}
                  >
                    Add <Plus size={13} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {products.length > 0 && (
        <div className="load-more">
          <span>
            Showing {Math.min(catalog.visibleCount, products.length)} of {products.length} products
          </span>
          <div className="load-progress">
            <span
              style={{ width: `${Math.min(catalog.visibleCount / products.length, 1) * 100}%` }}
            />
          </div>
          {catalog.visibleCount < products.length ? (
            <button className="button dark" onClick={() => dispatch(loadMore())}>
              Discover more <Plus size={14} />
            </button>
          ) : (
            <span className="collection-end">You’re all caught up.</span>
          )}
        </div>
      )}
    </>
  );
}
function CheckMark() {
  return <span className="tiny-check">✓</span>;
}
