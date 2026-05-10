import { useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, Plus, Minus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { CheckoutModal, type CheckoutDeliveryDetails } from "@/components/checkout/CheckoutModal";
import { mediaUrl } from "@/lib/mediaUrl";
import {
  discountInrForHello10,
  FIRST_ORDER_PROMO_CODE,
  FIRST_ORDER_PROMO_PERCENT,
  hasCompletedFirstOrder,
  markFirstOrderCompleted,
  normalizePromoInput,
} from "@/lib/firstOrderPromo";

/** Nationwide shipping rule shown in Order Summary / Razorpay totals. */
const FREE_SHIPPING_THRESHOLD_INR = 5000;
const STANDARD_SHIPPING_INR = 199;
/** Added to bag + shipping when customer chooses Cash on Delivery. */
const COD_HANDLING_FEE_INR = 150;

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}

export default function Cart() {
  const { items, itemCount, total, removeItem, updateQuantity, clearCart } = useCart();
  const isEmpty = items.length === 0;
  const shippingFree = total >= FREE_SHIPPING_THRESHOLD_INR;
  const shippingInr = shippingFree ? 0 : STANDARD_SHIPPING_INR;

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [hello10Active, setHello10Active] = useState(false);
  const [promoBanner, setPromoBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const promoDiscountInr = hello10Active ? discountInrForHello10(total) : 0;
  const subtotalAfterPromo = Math.max(0, total - promoDiscountInr);
  const grandTotalInr = subtotalAfterPromo + shippingInr;
  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID?.trim() ?? "";

  const applyPromo = () => {
    const code = normalizePromoInput(promoInput);
    if (!code) {
      setPromoBanner({ kind: "err", text: "Enter a promo code." });
      return;
    }
    if (code !== FIRST_ORDER_PROMO_CODE) {
      setPromoBanner({ kind: "err", text: "That code isn't valid." });
      return;
    }
    if (hasCompletedFirstOrder()) {
      setPromoBanner({ kind: "err", text: "HELLO10 is only valid for your 1st order." });
      setHello10Active(false);
      return;
    }
    setHello10Active(true);
    setPromoBanner({
      kind: "ok",
      text: `${FIRST_ORDER_PROMO_CODE} applied — ${FIRST_ORDER_PROMO_PERCENT}% off your items.`,
    });
  };

  const removePromo = () => {
    setHello10Active(false);
    setPromoBanner(null);
  };

  const itemsSummary = items
    .map((i) => `${i.productName.slice(0, 40)}×${i.quantity}`)
    .join("; ")
    .slice(0, 250);

  const handleCodComplete = useCallback(
    (details: CheckoutDeliveryDetails) => {
      markFirstOrderCompleted();
      setHello10Active(false);
      setPromoInput("");
      setPromoBanner(null);
      clearCart();
      window.alert(
        [
          `Cash on Delivery order placed for ₹${details.totalPayableInr.toLocaleString("en-IN")} (includes ₹${COD_HANDLING_FEE_INR.toLocaleString("en-IN")} COD handling).`,
          "",
          `${details.fullName}`,
          `${details.addressLine1}${details.addressLine2 ? `, ${details.addressLine2}` : ""}`,
          `${details.city}, ${details.state} ${details.pincode}`,
          `Phone: ${details.phone}`,
          "",
          "Our team will call to confirm before dispatch.",
        ].join("\n"),
      );
    },
    [clearCart],
  );

  const handlePaymentSuccess = useCallback(() => {
    markFirstOrderCompleted();
    setHello10Active(false);
    setPromoInput("");
    setPromoBanner(null);
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-white pt-0">
      {/* Header */}
      <div className="relative h-48 md:h-64 bg-black overflow-hidden" id="cart-hero">
        <div className="relative z-10 h-full flex flex-col items-center justify-center">
          <p className="text-white/40 text-xs tracking-[0.4em] uppercase mb-3">Your Selection</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Shopping Bag</h1>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-12">
        {/* Back link */}
        <Link
          href="/shop"
          id="cart-back-btn"
          className="inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-black/40 hover:text-black transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </Link>

        {isEmpty ? (
          <FadeUp>
            <div className="text-center py-24">
              <div className="w-20 h-20 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-8 h-8 text-black/20" />
              </div>
              <h2 className="text-3xl font-bold text-black tracking-tight mb-3">Your bag is empty</h2>
              <p className="text-black/40 text-sm mb-10 max-w-sm mx-auto">
                Discover our curated collections of premium ethnic wear crafted by master artisans.
              </p>
              <Link
                href="/shop"
                id="cart-explore-btn"
                className="inline-flex items-center gap-2 bg-black text-white px-10 py-4 text-xs font-semibold tracking-[0.2em] uppercase rounded-full hover:bg-black/80 transition-all hover:scale-105 active:scale-95"
              >
                Explore Collections <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeUp>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3">
              {items.map((item, i) => (
                <FadeUp key={item.id} delay={i * 0.08}>
                  <motion.div
                    layout
                    className="flex gap-5 p-5 bg-[#fafafa] rounded-xl group"
                  >
                    <Link href={`/product/${item.productId}`} className="flex-shrink-0">
                      <div className="w-24 h-32 overflow-hidden rounded-lg bg-[#f0f0f0]">
                        <img
                          src={mediaUrl(item.productImage)}
                          alt={item.productName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.productId}`} className="hover:opacity-60 transition-opacity">
                        <h3 className="text-sm font-semibold text-black leading-tight mb-1 line-clamp-2">
                          {item.productName}
                        </h3>
                      </Link>

                      <div className="flex flex-wrap gap-2 text-[10px] text-black/40 tracking-wider uppercase mt-2 mb-3">
                        <span className="bg-white px-2 py-0.5 rounded-full">{item.color}</span>
                        <span className="bg-white px-2 py-0.5 rounded-full">{item.size}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-black/10 rounded-full overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="px-3 py-1.5 text-black/60 hover:bg-black/5 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 py-1.5 text-xs font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="px-3 py-1.5 text-black/60 hover:bg-black/5 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold text-black">
                            ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                          </span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-black/20 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </FadeUp>
              ))}
            </div>

            {/* Order Summary */}
            <FadeUp delay={0.2}>
              <div className="space-y-4">
                <div className="bg-[#fafafa] rounded-xl p-6">
                  <h2 className="text-sm font-semibold tracking-[0.15em] uppercase mb-6">Order Summary</h2>

                  <div className="space-y-3 text-sm mb-6">
                    <div className="flex justify-between text-black/50">
                      <span>Subtotal ({itemCount} items)</span>
                      <span>₹{total.toLocaleString("en-IN")}</span>
                    </div>
                    {promoDiscountInr > 0 ? (
                      <div className="flex justify-between text-emerald-800 text-sm font-medium">
                        <span>
                          Promo ({FIRST_ORDER_PROMO_CODE}, {FIRST_ORDER_PROMO_PERCENT}% off)
                        </span>
                        <span>−₹{promoDiscountInr.toLocaleString("en-IN")}</span>
                      </div>
                    ) : null}
                    {promoDiscountInr > 0 ? (
                      <div className="flex justify-between text-black/60 text-xs">
                        <span>Items after promo</span>
                        <span>₹{subtotalAfterPromo.toLocaleString("en-IN")}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-black/50">
                      <span>Shipping</span>
                      <span className={shippingFree ? "text-green-600 font-medium" : ""}>
                        {shippingFree ? "Free" : `₹${STANDARD_SHIPPING_INR.toLocaleString("en-IN")}`}
                      </span>
                    </div>
                    {!shippingFree && (
                      <p className="text-[10px] text-black/30 tracking-wider">
                        Add ₹{(FREE_SHIPPING_THRESHOLD_INR - total).toLocaleString("en-IN")} more for free shipping
                      </p>
                    )}
                    <div className="border-t border-black/5 pt-3 flex justify-between font-bold text-black">
                      <span>Total</span>
                      <span className="text-lg">₹{grandTotalInr.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {checkoutError && (
                    <p className="text-xs text-red-600/90 leading-relaxed mb-3" role="alert">
                      {checkoutError}
                    </p>
                  )}

                  <button
                    type="button"
                    id="checkout-btn"
                    onClick={() => {
                      setCheckoutError(null);
                      setCheckoutOpen(true);
                    }}
                    className="w-full bg-black text-white py-4 text-xs font-semibold tracking-[0.2em] uppercase rounded-full hover:bg-black/80 transition-all flex items-center justify-center gap-2 group"
                  >
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Proceed to checkout
                  </button>

                  <p className="text-[10px] text-black/35 text-center mt-2 leading-relaxed">
                    COD adds ₹{COD_HANDLING_FEE_INR.toLocaleString("en-IN")} handling (shown in checkout). Pay online for the
                    bag total only. For online payments, add{" "}
                    <code className="text-[9px]">VITE_RAZORPAY_KEY_ID</code> and on Vercel also{" "}
                    <code className="text-[9px]">RAZORPAY_KEY_SECRET</code> (server only).
                  </p>

                  <CheckoutModal
                    open={checkoutOpen}
                    onClose={() => setCheckoutOpen(false)}
                    grandTotalInr={grandTotalInr}
                    subtotalInr={total}
                    shippingInr={shippingInr}
                    itemCount={itemCount}
                    itemsSummary={itemsSummary}
                    razorpayKeyId={razorpayKeyId}
                    codHandlingFeeInr={COD_HANDLING_FEE_INR}
                    promoDiscountInr={promoDiscountInr}
                    appliedPromoCode={hello10Active ? FIRST_ORDER_PROMO_CODE : null}
                    onPaymentSuccess={handlePaymentSuccess}
                    onCodComplete={handleCodComplete}
                  />

                  <div className="mt-6 pt-6 border-t border-black/5 space-y-3">
                    {[
                      { icon: "📦", text: "Tracked delivery with updates" },
                      { icon: "🎁", text: "Premium packaging included" },
                    ].map(({ icon, text }) => (
                      <div key={text} className="flex items-center gap-3 text-[10px] text-black/40 tracking-wider">
                        <span className="text-sm">{icon}</span>
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Promo code */}
                <div className="bg-[#fafafa] rounded-xl p-6">
                  <h3 className="text-xs font-semibold tracking-[0.15em] uppercase mb-4">Promo Code</h3>
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Enter code"
                      id="promo-input"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applyPromo();
                        }
                      }}
                      disabled={hello10Active}
                      className="flex-1 border border-black/10 px-4 py-3 text-sm bg-white focus:outline-none focus:border-black rounded-l-full disabled:opacity-60"
                    />
                    <button
                      type="button"
                      id="promo-apply-btn"
                      onClick={applyPromo}
                      disabled={hello10Active}
                      className="px-6 py-3 bg-black text-white text-xs font-semibold tracking-wider uppercase rounded-r-full hover:bg-black/80 transition-colors disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                  {hello10Active ? (
                    <button
                      type="button"
                      onClick={removePromo}
                      className="mt-2 text-[11px] font-medium text-black/45 hover:text-black underline underline-offset-2"
                    >
                      Remove promo
                    </button>
                  ) : null}
                  {promoBanner ? (
                    <p
                      className={`mt-3 text-xs leading-relaxed ${
                        promoBanner.kind === "ok" ? "text-emerald-800" : "text-red-600"
                      }`}
                      role={promoBanner.kind === "err" ? "alert" : undefined}
                    >
                      {promoBanner.text}
                    </p>
                  ) : null}
                </div>
              </div>
            </FadeUp>
          </div>
        )}
      </div>
    </div>
  );
}
