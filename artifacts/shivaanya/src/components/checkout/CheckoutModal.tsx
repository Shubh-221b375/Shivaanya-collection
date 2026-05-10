import { useEffect, useState, type FormEvent } from "react";
import { X, Loader2 } from "lucide-react";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";

export type CheckoutDeliveryDetails = {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod: "online" | "cod";
};

function normalizePhone(s: string): string {
  const d = s.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return d.slice(2);
  if (d.length === 11 && d.startsWith("0")) return d.slice(1);
  return d;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type Props = {
  open: boolean;
  onClose: () => void;
  grandTotalInr: number;
  subtotalInr: number;
  shippingInr: number;
  itemCount: number;
  itemsSummary: string;
  razorpayKeyId: string;
  onPaymentSuccess: () => void;
  onCodComplete: (details: CheckoutDeliveryDetails) => void;
};

export function CheckoutModal({
  open,
  onClose,
  grandTotalInr,
  subtotalInr,
  shippingInr,
  itemCount,
  itemsSummary,
  razorpayKeyId,
  onPaymentSuccess,
  onCodComplete,
}: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const deliveryPayload = (): CheckoutDeliveryDetails => ({
    fullName: fullName.trim(),
    email: email.trim(),
    phone: normalizePhone(phone),
    addressLine1: addressLine1.trim(),
    addressLine2: addressLine2.trim(),
    city: city.trim(),
    state: state.trim(),
    pincode: pincode.replace(/\D/g, "").slice(0, 6),
    paymentMethod,
  });

  const validate = (): string | null => {
    const p = deliveryPayload();
    if (p.fullName.length < 2) return "Enter your full name";
    if (!validateEmail(p.email)) return "Enter a valid email";
    if (p.phone.length !== 10) return "Enter a valid 10-digit mobile number";
    if (p.addressLine1.length < 5) return "Enter street / building address";
    if (p.city.length < 2) return "Enter city";
    if (p.state.length < 2) return "Enter state or UT";
    if (!/^\d{6}$/.test(p.pincode)) return "Enter a valid 6-digit PIN code";
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    const details = deliveryPayload();

    if (details.paymentMethod === "cod") {
      onCodComplete(details);
      onClose();
      return;
    }

    if (!razorpayKeyId) {
      setError("Razorpay is not configured. Add VITE_RAZORPAY_KEY_ID for the storefront.");
      return;
    }

    setBusy(true);
    const amountPaise = Math.round(grandTotalInr * 100);
    const receipt = `bag_${Date.now()}`;
    const notes: Record<string, string> = {
      customer_name: details.fullName.slice(0, 120),
      customer_email: details.email.slice(0, 120),
      customer_phone: details.phone,
      address: [details.addressLine1, details.addressLine2, details.city, details.state, details.pincode]
        .filter(Boolean)
        .join(", ")
        .slice(0, 500),
      items: itemsSummary.slice(0, 500),
      subtotal_inr: String(subtotalInr),
      shipping_inr: String(shippingInr),
      total_inr: String(grandTotalInr),
      item_count: String(itemCount),
    };

    try {
      const res = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountPaise, receipt, notes }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; orderId?: string; keyId?: string; amountPaise?: number };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not start payment. Try again.");
        setBusy(false);
        return;
      }
      const { orderId, amountPaise: orderPaise, keyId } = data;
      if (!orderId || !keyId) {
        setError("Invalid response from payment server. If you are on local dev, run `vercel dev` or deploy to Vercel.");
        setBusy(false);
        return;
      }

      await openRazorpayCheckout({
        keyId,
        amountInr: grandTotalInr,
        orderId,
        amountPaise: orderPaise ?? amountPaise,
        merchantName: "Shivaanya Collection",
        description: `Pay ₹${grandTotalInr.toLocaleString("en-IN")}`,
        prefill: {
          name: details.fullName,
          email: details.email,
          contact: details.phone,
        },
        notes: { ...notes, payment: "prepaid" },
        onSuccess: () => {
          setBusy(false);
          onPaymentSuccess();
          onClose();
          window.alert(
            `Payment received: ₹${grandTotalInr.toLocaleString("en-IN")}. You will get confirmation on ${details.email}.`,
          );
        },
        onDismiss: () => setBusy(false),
      });
      setBusy(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach payment server.");
      setBusy(false);
    }
  };

  const inputCls =
    "w-full border border-black/10 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-black";

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close checkout"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-black/5"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-black/5 bg-white/95 backdrop-blur-sm">
          <h2 id="checkout-title" className="text-lg font-semibold text-black tracking-tight">
            Checkout
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 text-black/50 hover:text-black transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          <p className="text-xs text-black/45">
            Total to pay:{" "}
            <span className="font-semibold text-black">₹{grandTotalInr.toLocaleString("en-IN")}</span>{" "}
            (includes shipping)
          </p>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-black/50">Full name</label>
            <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-black/50">Email</label>
              <input
                type="email"
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-black/50">Mobile</label>
              <input
                type="tel"
                inputMode="numeric"
                className={inputCls}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit number"
                required
                autoComplete="tel"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-black/50">Address line 1</label>
            <input
              className={inputCls}
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="House / flat, street"
              required
              autoComplete="address-line1"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-black/50">Address line 2 (optional)</label>
            <input
              className={inputCls}
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Landmark, area"
              autoComplete="address-line2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-black/50">City</label>
              <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} required autoComplete="address-level2" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-black/50">State</label>
              <input className={inputCls} value={state} onChange={(e) => setState(e.target.value)} required autoComplete="address-level1" />
            </div>
          </div>
          <div className="space-y-1 max-w-[200px]">
            <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-black/50">PIN code</label>
            <input
              className={inputCls}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              required
              autoComplete="postal-code"
            />
          </div>

          <fieldset className="space-y-2 pt-2 border-t border-black/5">
            <legend className="text-[10px] font-semibold tracking-[0.15em] uppercase text-black/50 mb-2">Payment</legend>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="pay"
                checked={paymentMethod === "online"}
                onChange={() => setPaymentMethod("online")}
                className="accent-black"
              />
              <span className="text-sm text-black">Pay online (UPI, card, netbanking) — ₹{grandTotalInr.toLocaleString("en-IN")}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="pay"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
                className="accent-black"
              />
              <span className="text-sm text-black">Cash on Delivery (COD)</span>
            </label>
          </fieldset>

          {error && (
            <p className="text-xs text-red-600 leading-relaxed" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-black text-white py-3.5 rounded-full text-xs font-semibold tracking-[0.2em] uppercase hover:bg-black/85 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing…
              </>
            ) : paymentMethod === "cod" ? (
              "Place order — Cash on Delivery"
            ) : (
              `Pay ₹${grandTotalInr.toLocaleString("en-IN")} with Razorpay`
            )}
          </button>
          <p className="text-[10px] text-black/35 text-center leading-relaxed">
            Online payments use your exact bag total. Verify payments and fulfil orders in the Razorpay Dashboard.
          </p>
        </form>
      </div>
    </div>
  );
}
