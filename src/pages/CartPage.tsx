import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { changeCart, loadCart } from '../features/cart/cartSlice';
import { placeOrder } from '../features/orders/ordersSlice';
import { showNotice } from '../features/ui/uiSlice';
import { EmptyState, ErrorBanner, PageTitle, Spinner } from '../components/ui';
import { money } from '../lib/format';
export default function CartPage() {
  const dispatch = useAppDispatch();
  const { data: cart, status, busy, error } = useAppSelector((s) => s.cart);
  const orders = useAppSelector((s) => s.orders);
  const [address, setAddress] = useState('');
  const navigate = useNavigate();
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await dispatch(
      placeOrder({ shippingAddress: address.trim(), paymentMethod: 'cash_on_delivery' }),
    );
    if (placeOrder.fulfilled.match(result)) {
      void dispatch(loadCart());
      dispatch(
        showNotice({
          message: `Order #${result.payload.id} is placed. Something good is on its way.`,
          tone: 'success',
        }),
      );
      navigate('/orders');
    }
  };
  const locked = busy || orders.busy;
  return (
    <>
      <PageTitle
        eyebrow="A FEW GOOD CHOICES"
        title="Your everyday, in a bag."
        description={`${cart?.itemCount || 0} items. A little closer to yours.`}
      />
      <ErrorBanner message={error} retry={() => void dispatch(loadCart())} />
      {status === 'loading' && !cart ? (
        <Spinner label="Opening your bag…" />
      ) : cart?.items.length ? (
        <div className="cart-layout">
          <section className="cart-items">
            {cart.items.map((item) => (
              <article className="cart-item" key={item.id}>
                <span className="cart-item-icon">
                  <ShoppingBag size={28} strokeWidth={1.2} />
                </span>
                <div className="cart-item-info">
                  <Link to={`/products/${item.productId}`}>
                    {item.product?.name || 'Unavailable product'}
                  </Link>
                  <span>{item.product ? money(item.product.price) : 'No longer available'}</span>
                </div>
                <div className="quantity-control">
                  <button
                    aria-label={`Decrease ${item.product?.name || 'item'} quantity`}
                    disabled={locked || item.quantity <= 1}
                    onClick={() =>
                      void dispatch(
                        changeCart({
                          action: 'update',
                          itemId: item.id,
                          quantity: item.quantity - 1,
                        }),
                      )
                    }
                  >
                    <Minus size={13} />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    aria-label={`Increase ${item.product?.name || 'item'} quantity`}
                    disabled={locked}
                    onClick={() =>
                      void dispatch(
                        changeCart({
                          action: 'update',
                          itemId: item.id,
                          quantity: item.quantity + 1,
                        }),
                      )
                    }
                  >
                    <Plus size={13} />
                  </button>
                </div>
                <strong>{money(item.subtotal)}</strong>
                <button
                  className="icon-button muted"
                  disabled={locked}
                  onClick={() => void dispatch(changeCart({ action: 'remove', itemId: item.id }))}
                  aria-label={`Remove ${item.product?.name || 'item'}`}
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
            <Link to="/" className="back-link">
              <ArrowLeft size={15} /> Keep exploring
            </Link>
          </section>
          <form className="checkout-card" onSubmit={(event) => void submit(event)}>
            <span className="eyebrow">THE FINISHING TOUCHES</span>
            <h2>Make it yours.</h2>
            <ErrorBanner message={orders.error} />
            <label className="field">
              Shipping address
              <textarea
                required
                minLength={5}
                maxLength={2000}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, building, city, and any delivery details"
                rows={4}
              />
            </label>
            <div className="payment-option">
              <span className="radio-dot" />
              <span>
                <strong>Cash on delivery</strong>
                <small>Pay when your order arrives.</small>
              </span>
            </div>
            <div className="checkout-total">
              <span>Order total</span>
              <strong>{money(cart.total)}</strong>
            </div>
            <button
              className="button full"
              disabled={locked || cart.items.some((item) => !item.product?.isActive)}
            >
              {orders.busy ? (
                <Spinner label="Placing your order…" />
              ) : (
                <>
                  Place order <ArrowRight size={17} />
                </>
              )}
            </button>
            <p className="small muted">
              Stock is reserved when you place your order. We’ll let you know if a quantity is
              unavailable.
            </p>
          </form>
        </div>
      ) : (
        status !== 'failed' && (
          <EmptyState
            title="Your bag has room for something good."
            action={
              <Link to="/" className="button">
                Explore the collection <ArrowRight size={15} />
              </Link>
            }
          >
            Find your next everyday essential and add it here.
          </EmptyState>
        )
      )}
    </>
  );
}
