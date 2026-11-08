import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, failure, sessionToken } from '../../lib/api';
import type {
  ApiFailure,
  Category,
  Inventory,
  LoadStatus,
  Movement,
  Product,
} from '../../lib/types';
import { sessionCleared } from '../../app/actions';
type Resource = 'products' | 'categories' | 'inventory';
interface AdminState {
  products: Product[];
  categories: Category[];
  inventory: Inventory[];
  movements: Movement[];
  selectedProduct: Product | null;
  status: Record<Resource, LoadStatus>;
  errors: Record<Resource, string | null>;
  busy: boolean;
  error: string | null;
  detailLoading: boolean;
  movementsLoading: boolean;
}
const initialState: AdminState = {
  products: [],
  categories: [],
  inventory: [],
  movements: [],
  selectedProduct: null,
  status: { products: 'idle', categories: 'idle', inventory: 'idle' },
  errors: { products: null, categories: null, inventory: null },
  busy: false,
  error: null,
  detailLoading: false,
  movementsLoading: false,
};
export const loadAdminResource = createAsyncThunk<
  { resource: Resource; data: Product[] | Category[] | Inventory[] },
  Resource,
  { rejectValue: ApiFailure }
>('admin/load', async (resource, { getState, rejectWithValue }) => {
  try {
    return { resource, data: await api(`/admin/${resource}`, { token: sessionToken(getState()) }) };
  } catch (error) {
    return rejectWithValue(failure(error));
  }
});
export const loadAdminProduct = createAsyncThunk<Product, number, { rejectValue: ApiFailure }>(
  'admin/product',
  async (id, { getState, rejectWithValue }) => {
    try {
      return await api<Product>(`/admin/products/${id}`, { token: sessionToken(getState()) });
    } catch (error) {
      return rejectWithValue(failure(error));
    }
  },
);
export const loadMovements = createAsyncThunk<
  Movement[],
  number | undefined,
  { rejectValue: ApiFailure }
>('admin/movements', async (productId, { getState, rejectWithValue }) => {
  try {
    return await api<Movement[]>(
      `/admin/inventory/movements${productId ? `?productId=${productId}` : ''}`,
      { token: sessionToken(getState()) },
    );
  } catch (error) {
    return rejectWithValue(failure(error));
  }
});
export interface AdminCommand {
  resource: Resource;
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate';
  id?: number;
  body?: Record<string, unknown>;
}
export const mutateAdmin = createAsyncThunk<unknown, AdminCommand, { rejectValue: ApiFailure }>(
  'admin/mutate',
  async ({ resource, action, id, body }, { getState, rejectWithValue }) => {
    try {
      if (resource === 'inventory' && !['create', 'update'].includes(action))
        throw new Error('This inventory operation is unavailable.');
      if (resource === 'categories' && action === 'activate')
        throw new Error('Use the category editor to activate a category.');
      const path = `/admin/${resource}${action === 'create' ? '' : `/${id}`}${['activate', 'deactivate'].includes(action) ? `/${action}` : ''}`;
      return await api(path, {
        method: action === 'create' ? 'POST' : action === 'delete' ? 'DELETE' : 'PATCH',
        body,
        token: sessionToken(getState()),
      });
    } catch (error) {
      return rejectWithValue(failure(error));
    }
  },
);
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError(state) {
      state.error = null;
    },
    closeAdminProduct(state) {
      state.selectedProduct = null;
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder.addCase(loadAdminResource.pending, (state, action) => {
      state.status[action.meta.arg] = 'loading';
      state.errors[action.meta.arg] = null;
    });
    builder.addCase(loadAdminResource.fulfilled, (state, action) => {
      const { resource, data } = action.payload;
      state.status[resource] = 'succeeded';
      if (resource === 'products') state.products = data as Product[];
      if (resource === 'categories') state.categories = data as Category[];
      if (resource === 'inventory') state.inventory = data as Inventory[];
    });
    builder.addCase(loadAdminResource.rejected, (state, action) => {
      state.status[action.meta.arg] = 'failed';
      state.errors[action.meta.arg] = action.payload?.message || 'Unable to load this section.';
    });
    builder.addCase(loadAdminProduct.pending, (state) => {
      state.detailLoading = true;
      state.selectedProduct = null;
      state.error = null;
    });
    builder.addCase(loadAdminProduct.fulfilled, (state, action) => {
      state.selectedProduct = action.payload;
      state.detailLoading = false;
    });
    builder.addCase(loadAdminProduct.rejected, (state, action) => {
      state.detailLoading = false;
      state.error = action.payload?.message || 'Unable to load product details.';
    });
    builder.addCase(loadMovements.pending, (state) => {
      state.movementsLoading = true;
      state.movements = [];
      state.error = null;
    });
    builder.addCase(loadMovements.fulfilled, (state, action) => {
      state.movements = action.payload;
      state.movementsLoading = false;
    });
    builder.addCase(loadMovements.rejected, (state, action) => {
      state.movementsLoading = false;
      state.error = action.payload?.message || 'Unable to load movements.';
    });
    builder.addCase(mutateAdmin.pending, (state) => {
      state.busy = true;
      state.error = null;
    });
    builder.addCase(mutateAdmin.fulfilled, (state) => {
      state.busy = false;
    });
    builder.addCase(mutateAdmin.rejected, (state, action) => {
      state.busy = false;
      state.error = action.payload?.message || 'Unable to save changes.';
    });
    builder.addCase(sessionCleared, () => initialState);
  },
});
export const { clearAdminError, closeAdminProduct } = adminSlice.actions;
export default adminSlice.reducer;
