import { describe, expect, it } from 'vitest';
import { defaultFilters, filterProducts } from './catalogSlice';
import type { Product } from '../../lib/types';
const products: Product[] = [
  { id: 1, name: 'Wireless Headphones', price: 100, isActive: true, categoryIds: [1], photos: [] },
  { id: 2, name: 'Keyboard', price: 50, isActive: true, categoryIds: [2], photos: [] },
  { id: 3, name: 'Studio Headphones', price: 200, isActive: true, categoryIds: [1, 2], photos: [] },
];
describe('catalog selectors', () => {
  it('combines text, category, and price without mutating API data', () => {
    expect(
      filterProducts(products, {
        ...defaultFilters,
        search: ' HEADPHONES ',
        categoryIds: [2],
        minPrice: '150',
        maxPrice: '250',
      }).map((p) => p.id),
    ).toEqual([3]);
    expect(products.map((p) => p.id)).toEqual([1, 2, 3]);
  });
  it('uses OR across categories and sorts the returned collection', () => {
    expect(
      filterProducts(products, { ...defaultFilters, categoryIds: [1, 2], sort: 'price-asc' }).map(
        (p) => p.id,
      ),
    ).toEqual([2, 1, 3]);
    expect(
      filterProducts(products, { ...defaultFilters, sort: 'newest' }).map((p) => p.id),
    ).toEqual([3, 2, 1]);
  });
  it('preserves a legitimate zero-price bound', () => {
    expect(filterProducts(products, { ...defaultFilters, maxPrice: '0' })).toHaveLength(0);
  });
});
