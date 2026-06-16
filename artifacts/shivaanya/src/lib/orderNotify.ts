/** Payload sent to `/api/order-notify` (server assigns official order number + sends email/SMS). */

export type OrderLineNotify = {
  productCode?: string;
  productName: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
  /** Full URL for the colour variant image the customer ordered. */
  imageUrl?: string;
};

export type OrderConfirmationPayload = {
  customerName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod: "cod" | "online";
  /** Amount customer pays (COD includes handling fee). */
  totalPayableInr: number;
  /** Bag + shipping before COD fee (matches Razorpay / summary). */
  bagTotalInr: number;
  itemsSummary: string;
  /** Structured lines for emails / sheet (includes product codes). */
  lineItems?: OrderLineNotify[];
  itemCount: number;
  subtotalInr: number;
  shippingInr: number;
  codHandlingFeeInr: number;
  shipElsewhere: boolean;
  promoCode?: string | null;
  promoDiscountInr?: number;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
};

export type OrderConfirmationResult = {
  orderNumber: string;
  emailSent: boolean;
  companyEmailSent?: boolean;
  sheetUpdated?: boolean;
  smsSent: boolean;
};

/** Human-readable summary for email/SMS — includes product code when available. */
export function buildOrderItemsSummary(
  items: Array<{
    productCode?: string;
    productName: string;
    color: string;
    size: string;
    quantity: number;
  }>,
): string {
  return items
    .map((i) => {
      const codePrefix = i.productCode?.trim() ? `[${i.productCode.trim()}] ` : "";
      const label = `${codePrefix}${i.productName} (${i.color}, ${i.size})`;
      return `${label} ×${i.quantity}`;
    })
    .join("; ")
    .slice(0, 900);
}

function orderNotifyApiUrl(): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const path = "/api/order-notify";
  if (!base || base === "/") return path;
  const trimmed = base.replace(/\/$/, "");
  return `${trimmed}${path}`;
}

/** Client fallback if the notify API is unreachable (still show an order ref). */
export function generateFallbackOrderNumber(): string {
  const d = new Date();
  const y = String(d.getFullYear()).slice(2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SHV-${y}${m}${day}-${rand}`;
}

/**
 * Registers the order server-side (official order no.) and triggers email + SMS when configured.
 * Never throws — returns fallback order number if the API fails.
 */
export async function submitOrderConfirmation(payload: OrderConfirmationPayload): Promise<OrderConfirmationResult> {
  try {
    const res = await fetch(orderNotifyApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as {
      orderNumber?: string;
      emailSent?: boolean;
      companyEmailSent?: boolean;
      sheetUpdated?: boolean;
      smsSent?: boolean;
      error?: string;
    };
    if (res.ok && typeof data.orderNumber === "string" && data.orderNumber.length > 0) {
      return {
        orderNumber: data.orderNumber,
        emailSent: !!data.emailSent,
        companyEmailSent: !!data.companyEmailSent,
        sheetUpdated: !!data.sheetUpdated,
        smsSent: !!data.smsSent,
      };
    }
  } catch {
    /* network / parse */
  }
  return {
    orderNumber: generateFallbackOrderNumber(),
    emailSent: false,
    smsSent: false,
  };
}
