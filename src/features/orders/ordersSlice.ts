import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, failure, sessionToken } from '../../lib/api';
import type { ApiFailure, LoadStatus, Order, OrderStatus, Role } from '../../lib/types';
import { sessionCleared } from '../../app/actions';
const initialState: {
  items: Order[];
  selected: Order | null;
  status: LoadStatus;
  busy: boolean;
  error: string | null;
} = { items: [], selected: null, status: 'idle', busy: false, error: null };
export const loadOrders = createAsyncThunk<Order[], Role, { rejectValue: ApiFailure }>(
  'orders/load',
  async (role, { getState, rejectWithValue }) => {
    try {
      return await api<Order[]>(role === 'admin' ? '/admin/orders' : '/orders', {
        token: sessionToken(getState()),
      });
    } catch (error) {
      return rejectWithValue(failure(error));
    }
  },
);
export const loadOrder = createAsyncThunk<
  Order,
  { id: number; role: Role },
  { rejectValue: ApiFailure }
>('orders/detail', async ({ id, role }, { getState, rejectWithValue }) => {
  try {
    return await api<Order>(`${role === 'admin' ? '/admin/orders' : '/orders'}/${id}`, {
      token: sessionToken(getState()),
    });
  } catch (error) {
    return rejectWithValue(failure(error));
  }
});
export const placeOrder = createAsyncThunk<
  Order,
  { shippingAddress: string; paymentMethod: 'cash_on_delivery' },
  { rejectValue: ApiFailure }
>('orders/place', async (body, { getState, rejectWithValue }) => {
  try {
    return await api<Order>('/orders', { method: 'POST', body, token: sessionToken(getState()) });
  } catch (error) {
    return rejectWithValue(failure(error));
  }
});
export const updateOrder = createAsyncThunk<
  Order,
  { id: number; role: Role; status?: OrderStatus; adminNote?: string },
  { rejectValue: ApiFailure }
>('orders/update', async ({ id, role, status, adminNote }, { getState, rejectWithValue }) => {
  try {
    return await api<Order>(
      role === 'admin' ? `/admin/orders/${id}/status` : `/orders/${id}/cancel`,
      {
        method: 'PATCH',
        ...(role === 'admin'
          ? { body: { status, ...(adminNote !== undefined ? { adminNote } : {}) } }
          : {}),
        token: sessionToken(getState()),
      },
    );
  } catch (error) {
    return rejectWithValue(failure(error));
  }
});
const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    closeOrder(state) {
      state.selected = null;
      state.error = null;
    },
    clearOrderError(state) {
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder.addCase(loadOrders.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(loadOrders.fulfilled, (state, action) => {
      state.items = action.payload;
      state.status = 'succeeded';
    });
    builder.addCase(loadOrders.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.payload?.message || 'Unable to load orders.';
    });
    builder.addCase(loadOrder.pending, (state) => {
      state.selected = null;
      state.busy = true;
      state.error = null;
    });
    builder.addCase(loadOrder.fulfilled, (state, action) => {
      state.selected = action.payload;
      state.busy = false;
    });
    builder.addCase(loadOrder.rejected, (state, action) => {
      state.busy = false;
      state.error = action.payload?.message || 'Unable to load order.';
    });
    builder.addCase(placeOrder.pending, (state) => {
      state.busy = true;
      state.error = null;
    });
    builder.addCase(placeOrder.fulfilled, (state, action) => {
      state.busy = false;
      state.items.unshift(action.payload);
    });
    builder.addCase(placeOrder.rejected, (state, action) => {
      state.busy = false;
      state.error = action.payload?.message || 'Unable to place your order.';
    });
    builder.addCase(updateOrder.pending, (state) => {
      state.busy = true;
      state.error = null;
    });
    builder.addCase(updateOrder.fulfilled, (state, action) => {
      state.busy = false;
      state.items = state.items.map((item) =>
        item.id === action.payload.id ? action.payload : item,
      );
      state.selected = action.payload;
    });
    builder.addCase(updateOrder.rejected, (state, action) => {
      state.busy = false;
      state.error = action.payload?.message || 'Unable to update order.';
    });
    builder.addCase(sessionCleared, () => initialState);
  },
});
export const { closeOrder, clearOrderError } = ordersSlice.actions;
export default ordersSlice.reducer;
