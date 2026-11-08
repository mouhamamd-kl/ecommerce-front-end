import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, failure, sessionToken } from '../../lib/api';
import type { ApiFailure, Cart, LoadStatus } from '../../lib/types';
import { sessionCleared } from '../../app/actions';
const initialState: { data: Cart | null; status: LoadStatus; busy: boolean; error: string | null } =
  { data: null, status: 'idle', busy: false, error: null };
export const loadCart = createAsyncThunk<Cart, void, { rejectValue: ApiFailure }>(
  'cart/load',
  async (_, { getState, rejectWithValue }) => {
    try {
      return await api<Cart>('/cart', { token: sessionToken(getState()) });
    } catch (error) {
      return rejectWithValue(failure(error));
    }
  },
);
type Change =
  | { action: 'add'; productId: number; quantity: number }
  | { action: 'update'; itemId: number; quantity: number }
  | { action: 'remove'; itemId: number }
  | { action: 'clear' };
export const changeCart = createAsyncThunk<Cart, Change, { rejectValue: ApiFailure }>(
  'cart/change',
  async (change, { getState, rejectWithValue }) => {
    try {
      const path =
        change.action === 'clear'
          ? '/cart'
          : change.action === 'add'
            ? '/cart/items'
            : `/cart/items/${change.itemId}`;
      const method =
        change.action === 'add' ? 'POST' : change.action === 'update' ? 'PATCH' : 'DELETE';
      const body =
        change.action === 'add'
          ? { productId: change.productId, quantity: change.quantity }
          : change.action === 'update'
            ? { quantity: change.quantity }
            : undefined;
      return await api<Cart>(path, { method, body, token: sessionToken(getState()) });
    } catch (error) {
      return rejectWithValue(failure(error));
    }
  },
);
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartError(state) {
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder.addCase(loadCart.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(loadCart.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.data = action.payload;
    });
    builder.addCase(loadCart.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.payload?.message || 'Unable to load your cart.';
    });
    builder.addCase(changeCart.pending, (state) => {
      state.busy = true;
      state.error = null;
    });
    builder.addCase(changeCart.fulfilled, (state, action) => {
      state.busy = false;
      state.data = action.payload;
    });
    builder.addCase(changeCart.rejected, (state, action) => {
      state.busy = false;
      state.error = action.payload?.message || 'Unable to update your cart.';
    });
    builder.addCase(sessionCleared, () => initialState);
  },
});
export const { clearCartError } = cartSlice.actions;
export default cartSlice.reducer;
