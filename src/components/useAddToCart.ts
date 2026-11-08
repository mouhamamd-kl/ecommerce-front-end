import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { changeCart } from '../features/cart/cartSlice';
import { showNotice } from '../features/ui/uiSlice';
export function useAddToCart() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((s) => s.auth.session);
  const busy = useAppSelector((s) => s.cart.busy);
  const navigate = useNavigate();
  const location = useLocation();
  const add = async (productId: number, quantity = 1) => {
    if (!session) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (session.role !== 'customer') {
      dispatch(
        showNotice({
          message: 'Sign in with a customer account to add products to a cart.',
          tone: 'error',
        }),
      );
      return;
    }
    const result = await dispatch(changeCart({ action: 'add', productId, quantity }));
    dispatch(
      showNotice({
        message: changeCart.fulfilled.match(result)
          ? 'Added to your cart.'
          : result.payload?.message || 'Could not add this product.',
        tone: changeCart.fulfilled.match(result) ? 'success' : 'error',
      }),
    );
  };
  return { add, busy };
}
