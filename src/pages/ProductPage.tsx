import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { loadProduct } from '../features/catalog/catalogSlice';
import { ErrorBanner, Photo, Spinner } from '../components/ui';
import { useAddToCart } from '../components/useAddToCart';
import { money, productPhoto } from '../lib/format';
export default function ProductPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const {
    selected: product,
    detailStatus,
    detailError,
    categories,
  } = useAppSelector((s) => s.catalog);
  const [quantity, setQuantity] = useState(1);
  const [photo, setPhoto] = useState<string>();
  const { add, busy } = useAddToCart();
  useEffect(() => {
    const refresh = () => { void dispatch(loadProduct(Number(id))); };
    refresh();
    window.addEventListener('focus', refresh);
    setQuantity(1);
    setPhoto(undefined);
    return () => window.removeEventListener('focus', refresh);
  }, [id, dispatch]);
  return (
    <>
      <Link to="/" className="back-link">
        <ArrowLeft size={15} /> Back to the collection
      </Link>
      <ErrorBanner message={detailError} retry={() => void dispatch(loadProduct(Number(id)))} />
      {detailStatus === 'loading' ? (
        <div className="loading-page">
          <Spinner label="Finding your next favourite…" />
        </div>
      ) : (
        product && (
          <div className="product-detail">
            <div>
              <Photo
                src={photo || productPhoto(product)}
                alt={product.name}
                className="detail-photo"
              />
              {product.photos.length > 1 && (
                <div className="photo-thumbnails">
                  {[...product.photos]
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((item, index) => (
                      <button
                        key={item.id ?? index}
                        className={photo === item.url ? 'active' : ''}
                        onClick={() => setPhoto(item.url)}
                        aria-label={`View product photo ${index + 1}`}
                      >
                        <Photo src={item.url} alt={`${product.name} photo ${index + 1}`} />
                      </button>
                    ))}
                </div>
              )}
            </div>
            <section className="detail-info">
              <span className="eyebrow">
                {product.categoryIds
                  .map((id) => categories.find((c) => c.id === id)?.name)
                  .filter(Boolean)
                  .join(' / ') || 'THE BARAKAH COLLECTION'}
              </span>
              <h1>{product.name}</h1>
              <p className="detail-price">{money(product.price)}</p>
              <div className="detail-divider" />
              <p className="detail-copy">
                A new addition to your everyday. Choose your quantity and make it yours.
              </p>
              <span className="field-label">QUANTITY</span>
              <div className="detail-buy">
                <div className="quantity-control">
                  <button
                    disabled={quantity <= 1 || busy}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={15} />
                  </button>
                  <span>{quantity}</span>
                  <button
                    disabled={busy}
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => void add(product.id, quantity)}
                >
                  <ShoppingBag size={17} />
                  {busy ? 'Adding…' : 'Add to cart'}
                  <ArrowRight size={16} />
                </button>
              </div>
              <p className="detail-footnote">
                Availability is confirmed when your order is placed.
              </p>
              <dl className="detail-facts">
                <div>
                  <dt>Product</dt>
                  <dd>#{String(product.id).padStart(4, '0')}</dd>
                </div>
                <div>
                  <dt>Payment</dt>
                  <dd>Cash on delivery</dd>
                </div>
              </dl>
            </section>
          </div>
        )
      )}
    </>
  );
}
