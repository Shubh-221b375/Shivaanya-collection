const STORAGE_ORDERS = "shivaanya_orders_v1";
const STORAGE_HIGHLIGHT = "shivaanya_orders_highlight_v1";

export const ORDERS_HIGHLIGHT_EVENT = "shivaanya-orders-highlight-changed";

export type OrderLineItem = {
  productId: number;
  productCode?: string;
  productName: string;
  productImage: string;
  price: number;
  color: string;
  size: string;
  quantity: number;
};

export type StoredOrder = {
  orderNumber: string;
  placedAt: string;
  paymentMethod: "cod" | "online";
  totalPayableInr: number;
  subtotalInr: number;
  codHandlingFeeInr: number;
  promoCode?: string;
  promoDiscountInr?: number;
  items: OrderLineItem[];
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  notifyEmailSent?: boolean;
  notifySmsSent?: boolean;
};

function loadOrders(): StoredOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_ORDERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredOrder[]) : [];
  } catch {
    return [];
  }
}

function saveOrders(orders: StoredOrder[]) {
  localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders));
}

export function getOrders(): StoredOrder[] {
  return loadOrders().sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
  );
}

export function getOrderByNumber(orderNumber: string): StoredOrder | undefined {
  return loadOrders().find((o) => o.orderNumber === orderNumber);
}

export function saveOrder(order: StoredOrder): void {
  const orders = loadOrders();
  if (orders.some((o) => o.orderNumber === order.orderNumber)) return;
  saveOrders([order, ...orders]);
}

export function formatOrderDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Fresh checkout success — show one order hero on My Orders until cleared. */
export function getOrdersHighlight(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_HIGHLIGHT);
  } catch {
    return null;
  }
}

export function setOrdersHighlight(orderNumber: string): void {
  try {
    sessionStorage.setItem(STORAGE_HIGHLIGHT, orderNumber);
    window.dispatchEvent(new Event(ORDERS_HIGHLIGHT_EVENT));
  } catch {
    /* private mode */
  }
}

export function clearOrdersHighlight(): void {
  try {
    sessionStorage.removeItem(STORAGE_HIGHLIGHT);
    window.dispatchEvent(new Event(ORDERS_HIGHLIGHT_EVENT));
  } catch {
    /* private mode */
  }
}
