export type Role = 'customer' | 'admin';
export type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
export interface ApiFailure {
  message: string;
  status: number;
}
export interface Profile {
  id: number | string;
  email: string;
  role: Role;
}
export interface Session {
  token: string;
  role: Role;
  profile: Profile | null;
}
export interface Category {
  id: number;
  name: string;
  isActive: boolean;
}
export interface Photo {
  id?: number;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}
export interface Stock {
  quantityOnHand: number;
  quantityReserved: number;
  availableQuantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
}
export interface Product {
  id: number;
  name: string;
  price: number;
  isActive: boolean;
  categoryIds: number[];
  photos: Photo[];
  inventory?: Stock | null;
}
export interface Inventory extends Stock {
  id: number;
  productId: number;
  createdAt: string;
  updatedAt: string;
  product: { id: number; name: string; price: number; isActive: boolean } | null;
}
export interface Movement {
  id: number;
  inventoryId: number;
  type: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  referenceId: string | null;
  referenceOrderId: number | null;
  createdAt: string;
  inventory: Inventory | null;
}
export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  subtotal: number;
  product: { id: number; name: string; price: number; isActive: boolean } | null;
}
export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  itemCount: number;
  total: number;
}
export type OrderStatus =
  'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export interface OrderItem {
  id: number;
  productId: number | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}
export interface Order {
  id: number;
  userId: number;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  shippingAddress: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  relatedOrderId: number | null;
  recipientId: number | null;
  recipientType: string;
  isRead: boolean;
  createdAt: string;
}
export interface NotificationPage {
  items: Notification[];
  pagination: {
    total: number;
    current_page: number;
    total_pages: number;
    per_page: number;
    count: number;
  };
  unreadCount?: number;
}
export const transitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};
