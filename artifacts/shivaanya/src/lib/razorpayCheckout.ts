const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

export type OpenRazorpayOptions = {
  keyId: string;
  /** Total in INR (rupees). Converted to paise for Razorpay. */
  amountInr: number;
  merchantName?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  onSuccess?: (res: RazorpayHandlerResponse) => void;
  onDismiss?: () => void;
};

let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  const w = window as Window & { Razorpay?: new (o: object) => { open: () => void; on: (e: string, fn: () => void) => void } };
  if (w.Razorpay) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load Razorpay"));
      document.body.appendChild(s);
    });
  }
  return scriptPromise;
}

/**
 * Opens Razorpay Standard Checkout with a fixed amount (no manual typing).
 * Uses Key ID only (`VITE_RAZORPAY_KEY_ID`). Verify payments on your server with the secret for production.
 */
export async function openRazorpayCheckout(opts: OpenRazorpayOptions): Promise<void> {
  const w = window as Window & { Razorpay?: new (o: object) => { open: () => void; on: (e: string, fn: () => void) => void } };
  await loadRazorpayScript();
  const Razorpay = w.Razorpay;
  if (!Razorpay) throw new Error("Razorpay unavailable");

  const paise = Math.max(100, Math.round(opts.amountInr * 100));

  const instance = new Razorpay({
    key: opts.keyId,
    amount: String(paise),
    currency: "INR",
    name: opts.merchantName ?? "Shivaanya Collection",
    description: opts.description ?? "Order payment",
    prefill: opts.prefill ?? {},
    notes: opts.notes ?? {},
    theme: { color: "#000000" },
    handler(res: RazorpayHandlerResponse) {
      opts.onSuccess?.(res);
    },
    modal: {
      ondismiss: () => opts.onDismiss?.(),
    },
  });

  instance.open();
}
