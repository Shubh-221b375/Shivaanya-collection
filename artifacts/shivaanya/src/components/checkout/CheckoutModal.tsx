import { useEffect, useState, type FormEvent } from "react";
import { X, Loader2 } from "lucide-react";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";
import { useAuth } from "@/context/AuthContext";
import type { UserProfile } from "@/context/AuthContext";

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
  /** Subtotal + shipping + COD handling fee when applicable. */
  totalPayableInr: number;
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

/** Same-origin API path; respects Vite `base` if ever non-root. */
function createRazorpayOrderApiUrl(): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const path = "/api/create-razorpay-order";
  if (!base || base === "/") return path;
  const trimmed = base.replace(/\/$/, "");
  return `${trimmed}${path}`;
}

type AuthMode = "guest" | "signin" | "signup";

type Props = {
  open: boolean;
  onClose: () => void;
  grandTotalInr: number;
  subtotalInr: number;
  shippingInr: number;
  itemCount: number;
  itemsSummary: string;
  razorpayKeyId: string;
  /** Extra rupees added for Cash on Delivery (shown next to COD option). */
  codHandlingFeeInr: number;
  /** Discount already reflected in `grandTotalInr` / payment amount (e.g. HELLO10). */
  promoDiscountInr?: number;
  appliedPromoCode?: string | null;
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
  codHandlingFeeInr,
  promoDiscountInr = 0,
  appliedPromoCode = null,
  onPaymentSuccess,
  onCodComplete,
}: Props) {
  const { user, isAuthenticated, signIn, signUp, signOut, updateProfile } = useAuth();

  const [authMode, setAuthMode] = useState<AuthMode>("guest");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const [shipElsewhere, setShipElsewhere] = useState(false);
  const [altLine1, setAltLine1] = useState("");
  const [altLine2, setAltLine2] = useState("");
  const [altCity, setAltCity] = useState("");
  const [altState, setAltState] = useState("");
  const [altPincode, setAltPincode] = useState("");

  const [editingProfile, setEditingProfile] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setBusy(false);
      setAuthBusy(false);
      setPassword("");
      setPasswordConfirm("");
      setShipElsewhere(false);
      setEditingProfile(false);
      return;
    }
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
      setPhone(user.phone);
      setAddressLine1(user.addressLine1);
      setAddressLine2(user.addressLine2);
      setCity(user.city);
      setState(user.state);
      setPincode(user.pincode);
      setAuthMode("guest");
    } else {
      setEditingProfile(false);
    }
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const profileFromForm = (): UserProfile => ({
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    phone: normalizePhone(phone),
    addressLine1: addressLine1.trim(),
    addressLine2: addressLine2.trim(),
    city: city.trim(),
    state: state.trim(),
    pincode: pincode.replace(/\D/g, "").slice(0, 6),
  });

  const totalPayableInr =
    grandTotalInr + (paymentMethod === "cod" ? codHandlingFeeInr : 0);

  const deliveryPayload = (): CheckoutDeliveryDetails => {
    const base = profileFromForm();
    if (shipElsewhere) {
      return {
        ...base,
        addressLine1: altLine1.trim(),
        addressLine2: altLine2.trim(),
        city: altCity.trim(),
        state: altState.trim(),
        pincode: altPincode.replace(/\D/g, "").slice(0, 6),
        paymentMethod,
        totalPayableInr,
      };
    }
    return { ...base, paymentMethod, totalPayableInr };
  };

  const validate = (): string | null => {
    const p = deliveryPayload();
    if (p.fullName.length < 2) return "Enter your full name";
    if (!validateEmail(p.email)) return "Enter a valid email";
    if (p.phone.length !== 10) return "Enter a valid 10-digit mobile number";
    if (shipElsewhere) {
      if (p.addressLine1.length < 5) return "Enter the alternate delivery street / building";
      if (p.city.length < 2) return "Enter delivery city";
      if (p.state.length < 2) return "Enter delivery state";
      if (!/^\d{6}$/.test(p.pincode)) return "Enter a valid 6-digit PIN for delivery";
    } else {
      if (p.addressLine1.length < 5) return "Enter street / building address";
      if (p.city.length < 2) return "Enter city";
      if (p.state.length < 2) return "Enter state or UT";
      if (!/^\d{6}$/.test(p.pincode)) return "Enter a valid 6-digit PIN code";
    }
    return null;
  };

  const handleSignInClick = async () => {
    setError(null);
    if (!email.trim()) {
      setError("Enter your email to sign in.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setAuthBusy(true);
    const r = await signIn(email, password);
    setAuthBusy(false);
    if (!r.ok) setError(r.error);
  };

  const handleSaveProfileClick = () => {
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    if (!isAuthenticated) return;
    updateProfile(profileFromForm());
    setEditingProfile(false);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (authMode === "signin" && !isAuthenticated) {
      setError("Please sign in with your email and password, or choose Guest checkout.");
      return;
    }

    if (authMode === "signup" && !isAuthenticated) {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== passwordConfirm) {
        setError("Passwords do not match.");
        return;
      }
      const v = validate();
      if (v) {
        setError(v);
        return;
      }
      setBusy(true);
      const r = await signUp(email, password, profileFromForm());
      setBusy(false);
      if (!r.ok) {
        setError(r.error);
        return;
      }
    } else {
      const v = validate();
      if (v) {
        setError(v);
        return;
      }
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
      ship_elsewhere: shipElsewhere ? "yes" : "no",
      ...(promoDiscountInr > 0 && appliedPromoCode
        ? { promo_code: appliedPromoCode.slice(0, 40), promo_discount_inr: String(promoDiscountInr) }
        : {}),
    };

    try {
      const res = await fetch(createRazorpayOrderApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountPaise, receipt, notes }),
      });
      const ct = res.headers.get("content-type") ?? "";
      const raw = await res.text();
      let data: { error?: string; orderId?: string; keyId?: string; amountPaise?: number } = {};
      if (ct.includes("application/json")) {
        try {
          data = JSON.parse(raw || "{}") as typeof data;
        } catch {
          data = {};
        }
      }
      if (!res.ok) {
        if (res.status === 404) {
          setError(
            "Payment API not found (404). If this project is linked to the whole Git repo, redeploy after the latest push so /api is included—or in Vercel set Root Directory to artifacts/shivaanya.",
          );
        } else {
          setError(
            typeof data.error === "string"
              ? data.error
              : raw && raw.length < 280
                ? raw
                : `Could not start payment (HTTP ${res.status}). Try again.`,
          );
        }
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
    "w-full border border-black/10 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-black disabled:bg-black/[0.04] disabled:text-black/60";
  const fieldDisabled = isAuthenticated && !editingProfile && !shipElsewhere;

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
        className="relative w-full sm:max-w-xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-black/5"
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
          <div className="text-xs text-black/45 space-y-1">
            {promoDiscountInr > 0 && appliedPromoCode ? (
              <p className="text-[11px] text-emerald-800 font-medium">
                {appliedPromoCode}: −₹{promoDiscountInr.toLocaleString("en-IN")} on items (already included below)
              </p>
            ) : null}
            <p>
              {paymentMethod === "cod" ? (
                <>
                  Total due:{" "}
                  <span className="font-semibold text-black">₹{totalPayableInr.toLocaleString("en-IN")}</span>
                  <span className="text-black/40">
                    {" "}
                    (bag + shipping + ₹{codHandlingFeeInr.toLocaleString("en-IN")} COD handling)
                  </span>
                </>
              ) : (
                <>
                  Total: <span className="font-semibold text-black">₹{grandTotalInr.toLocaleString("en-IN")}</span>{" "}
                  (includes shipping)
                </>
              )}
            </p>
          </div>

          {/* Account */}
          <div className="rounded-2xl border border-black/10 bg-[#fafafa] p-4 space-y-3">
            <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-black/45">Account</p>
            {isAuthenticated ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-black">
                  Signed in as <span className="font-medium">{user?.email}</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setFullName("");
                    setEmail("");
                    setPhone("");
                    setAddressLine1("");
                    setAddressLine2("");
                    setCity("");
                    setState("");
                    setPincode("");
                  }}
                  className="text-xs font-medium text-black/50 hover:text-black underline underline-offset-2"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(["guest", "signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setAuthMode(m);
                      setError(null);
                    }}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-colors ${
                      authMode === m ? "bg-black text-white" : "bg-white border border-black/10 text-black/60 hover:border-black/30"
                    }`}
                  >
                    {m === "guest" ? "Guest" : m === "signin" ? "Sign in" : "Sign up"}
                  </button>
                ))}
              </div>
            )}

            {!isAuthenticated && authMode === "signin" && (
              <div className="space-y-2 pt-1">
                <input
                  type="password"
                  className={inputCls}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={handleSignInClick}
                  className="w-full py-2.5 rounded-full text-xs font-semibold tracking-[0.15em] uppercase bg-black text-white hover:bg-black/85 disabled:opacity-50"
                >
                  {authBusy ? "Signing in…" : "Sign in"}
                </button>
                <p className="text-[10px] text-black/40">We’ll fill your saved delivery details after sign in.</p>
              </div>
            )}

            {!isAuthenticated && authMode === "signup" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <input
                  type="password"
                  className={inputCls}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password (6+ chars)"
                  autoComplete="new-password"
                />
                <input
                  type="password"
                  className={inputCls}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                />
                <p className="sm:col-span-2 text-[10px] text-black/40">
                  Fill delivery details below — we’ll save them to your account when you pay or place a COD order.
                </p>
              </div>
            )}
          </div>

          {isAuthenticated && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-black">
                <input
                  type="checkbox"
                  checked={editingProfile}
                  onChange={(e) => setEditingProfile(e.target.checked)}
                  className="accent-black rounded"
                />
                Edit my saved details
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-black">
                <input
                  type="checkbox"
                  checked={shipElsewhere}
                  onChange={(e) => {
                    setShipElsewhere(e.target.checked);
                    if (e.target.checked) setEditingProfile(false);
                  }}
                  className="accent-black rounded"
                />
                Deliver to a different address
              </label>
            </div>
          )}

          {isAuthenticated && editingProfile && !shipElsewhere && (
            <button
              type="button"
              onClick={handleSaveProfileClick}
              className="w-full py-2.5 rounded-full text-xs font-semibold tracking-[0.15em] uppercase border border-black/20 text-black hover:bg-black/5"
            >
              Save details to my account
            </button>
          )}

          {shipElsewhere && (
            <div className="rounded-xl border border-dashed border-black/20 p-4 space-y-3 bg-white">
              <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-black/50">Alternate delivery address</p>
              <input
                className={inputCls}
                value={altLine1}
                onChange={(e) => setAltLine1(e.target.value)}
                placeholder="Address line 1"
                required={shipElsewhere}
              />
              <input
                className={inputCls}
                value={altLine2}
                onChange={(e) => setAltLine2(e.target.value)}
                placeholder="Address line 2 (optional)"
              />
              <div className="grid grid-cols-2 gap-2">
                <input className={inputCls} value={altCity} onChange={(e) => setAltCity(e.target.value)} placeholder="City" required={shipElsewhere} />
                <input className={inputCls} value={altState} onChange={(e) => setAltState(e.target.value)} placeholder="State" required={shipElsewhere} />
              </div>
              <input
                className={inputCls}
                value={altPincode}
                onChange={(e) => setAltPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="PIN code"
                inputMode="numeric"
                required={shipElsewhere}
              />
              <p className="text-[10px] text-black/40">Name, email & phone below are still used for order updates.</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-black/50">Full name</label>
            <input
              className={inputCls}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={fieldDisabled}
              autoComplete="name"
            />
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
                disabled={isAuthenticated || fieldDisabled}
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
                disabled={fieldDisabled}
                autoComplete="tel"
              />
            </div>
          </div>

          {!shipElsewhere && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-black/50">Address line 1</label>
                <input
                  className={inputCls}
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="House / flat, street"
                  required
                  disabled={fieldDisabled}
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
                  disabled={fieldDisabled}
                  autoComplete="address-line2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-black/50">City</label>
                  <input
                    className={inputCls}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    disabled={fieldDisabled}
                    autoComplete="address-level2"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold tracking-[0.15em] uppercase text-black/50">State</label>
                  <input
                    className={inputCls}
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                    disabled={fieldDisabled}
                    autoComplete="address-level1"
                  />
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
                  disabled={fieldDisabled}
                  autoComplete="postal-code"
                />
              </div>
            </>
          )}

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
              <span className="text-sm text-black">Pay online — ₹{grandTotalInr.toLocaleString("en-IN")}</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="pay"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
                className="accent-black mt-1 shrink-0"
              />
              <span className="text-sm text-black leading-snug">
                <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                  Cash on Delivery (COD)
                  <span className="text-[11px] font-semibold tracking-wide uppercase text-amber-900 bg-amber-50 border border-amber-200/90 rounded-full px-2.5 py-0.5">
                    + ₹{codHandlingFeeInr.toLocaleString("en-IN")} handling
                  </span>
                </span>
                <span className="block text-[11px] text-black/45 mt-1">
                  On delivery you pay ₹{(grandTotalInr + codHandlingFeeInr).toLocaleString("en-IN")} (includes ₹
                  {codHandlingFeeInr.toLocaleString("en-IN")} COD handling).
                </span>
              </span>
            </label>
          </fieldset>

          {error && (
            <p className="text-xs text-red-600 leading-relaxed" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || authBusy}
            className="w-full bg-black text-white py-3.5 rounded-full text-xs font-semibold tracking-[0.2em] uppercase hover:bg-black/85 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing…
              </>
            ) : paymentMethod === "cod" ? (
              `Place order — ₹${totalPayableInr.toLocaleString("en-IN")} COD`
            ) : (
              `Pay ₹${grandTotalInr.toLocaleString("en-IN")} with Razorpay`
            )}
          </button>
          <p className="text-[10px] text-black/35 text-center leading-relaxed">
            Accounts are stored on this device only (not a full cloud login). Clear site data to remove saved details.
          </p>
        </form>
      </div>
    </div>
  );
}
