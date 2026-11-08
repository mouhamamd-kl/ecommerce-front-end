import {
  createAsyncThunk,
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { api, failure } from '../../lib/api';
import type { ApiFailure, Category, LoadStatus, Product } from '../../lib/types';

export interface CatalogFilters {
  search: string;
  categoryIds: number[];
  minPrice: string;
  maxPrice: string;
  sort: string;
}
export const defaultFilters: CatalogFilters = {
  search: '',
  categoryIds: [],
  minPrice: '',
  maxPrice: '',
  sort: 'name',
};
interface CatalogState {
  products: Product[];
  categories: Category[];
  status: LoadStatus;
  error: string | null;
  selected: Product | null;
  detailStatus: LoadStatus;
  detailError: string | null;
  filters: CatalogFilters;
  layout: 'grid' | 'list';
  visibleCount: number;
  filtersOpen: boolean;
}
const initialState: CatalogState = {
  products: [],
  categories: [],
  status: 'idle',
  error: null,
  selected: null,
  detailStatus: 'idle',
  detailError: null,
  filters: defaultFilters,
  layout: 'grid',
  visibleCount: 12,
  filtersOpen: true,
};
export const loadCatalog = createAsyncThunk<
  { products: Product[]; categories: Category[] },
  void,
  { rejectValue: ApiFailure }
>('catalog/load', async (_, { rejectWithValue }) => {
  try {
    const [products, categories] = await Promise.all([
      api<Product[]>('/products'),
      api<Category[]>('/categories'),
    ]);
    return { products, categories };
  } catch (error) {
    return rejectWithValue(failure(error));
  }
});
export const loadProduct = createAsyncThunk<Product, number, { rejectValue: ApiFailure }>(
  'catalog/product',
  async (id, { rejectWithValue }) => {
    try {
      return await api<Product>(`/products/${id}`);
    } catch (error) {
      return rejectWithValue(failure(error));
    }
  },
);
const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<CatalogFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
      state.visibleCount = 12;
    },
    toggleCategory(state, action: PayloadAction<number>) {
      const id = action.payload;
      state.filters.categoryIds = state.filters.categoryIds.includes(id)
        ? state.filters.categoryIds.filter((value) => value !== id)
        : [...state.filters.categoryIds, id];
      state.visibleCount = 12;
    },
    resetFilters(state) {
      state.filters = defaultFilters;
      state.visibleCount = 12;
    },
    setLayout(state, action: PayloadAction<'grid' | 'list'>) {
      state.layout = action.payload;
    },
    loadMore(state) {
      state.visibleCount += 12;
    },
    toggleFilters(state) {
      state.filtersOpen = !state.filtersOpen;
    },
  },
  extraReducers(builder) {
    builder.addCase(loadCatalog.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(loadCatalog.fulfilled, (state, action) => {
      state.status = 'succeeded';
      Object.assign(state, action.payload);
    });
    builder.addCase(loadCatalog.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.payload?.message || 'Unable to load products.';
    });
    builder.addCase(loadProduct.pending, (state) => {
      state.detailStatus = 'loading';
      state.selected = null;
      state.detailError = null;
    });
    builder.addCase(loadProduct.fulfilled, (state, action) => {
      state.detailStatus = 'succeeded';
      state.selected = action.payload;
    });
    builder.addCase(loadProduct.rejected, (state, action) => {
      state.detailStatus = 'failed';
      state.detailError = action.payload?.message || 'Unable to load this product.';
    });
  },
});
export function filterProducts(products: Product[], filters: CatalogFilters): Product[] {
  const search = filters.search.trim().toLowerCase();
  return products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search) &&
        (!filters.categoryIds.length ||
          p.categoryIds.some((id) => filters.categoryIds.includes(id))) &&
        (!filters.minPrice || p.price >= Number(filters.minPrice)) &&
        (!filters.maxPrice || p.price <= Number(filters.maxPrice)),
    )
    .sort((a, b) =>
      filters.sort === 'price-asc'
        ? a.price - b.price
        : filters.sort === 'price-desc'
          ? b.price - a.price
          : filters.sort === 'newest'
            ? b.id - a.id
            : a.name.localeCompare(b.name),
    );
}
export const selectFilteredProducts = createSelector(
  [
    (state: { catalog: CatalogState }) => state.catalog.products,
    (state: { catalog: CatalogState }) => state.catalog.filters,
  ],
  filterProducts,
);
export const { setFilters, toggleCategory, resetFilters, setLayout, loadMore, toggleFilters } =
  catalogSlice.actions;
export default catalogSlice.reducer;
