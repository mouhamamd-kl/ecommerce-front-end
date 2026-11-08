export const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: import.meta.env.VITE_CURRENCY || 'USD',
  }).format(value);
export const date = (value: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(value),
  );
export const label = (value: string) =>
  value.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
export const productPhoto = (product: {
  photos: { url: string; isPrimary: boolean; sortOrder: number }[];
}) =>
  (
    product.photos.find((p) => p.isPrimary) ||
    [...product.photos].sort((a, b) => a.sortOrder - b.sortOrder)[0]
  )?.url;
