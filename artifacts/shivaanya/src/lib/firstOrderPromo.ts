/** Matches site banner: 10% off first completed order only (device-local flag). */
export const FIRST_ORDER_PROMO_CODE = "HELLO10";
export const FIRST_ORDER_PROMO_PERCENT = 10;

const STORAGE_FIRST_ORDER_DONE = "shivaanya_first_order_completed_v1";

export function hasCompletedFirstOrder(): boolean {
  try {
    return localStorage.getItem(STORAGE_FIRST_ORDER_DONE) === "1";
  } catch {
    return false;
  }
}

export function markFirstOrderCompleted(): void {
  try {
    localStorage.setItem(STORAGE_FIRST_ORDER_DONE, "1");
  } catch {
    /* ignore */
  }
}

export function discountInrForHello10(subtotalInr: number): number {
  if (subtotalInr <= 0) return 0;
  return Math.round(subtotalInr * (FIRST_ORDER_PROMO_PERCENT / 100));
}

export function normalizePromoInput(raw: string): string {
  return raw.trim().toUpperCase();
}
