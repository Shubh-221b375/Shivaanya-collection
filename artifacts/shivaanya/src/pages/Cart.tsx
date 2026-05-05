import { useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, Plus, Minus, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";
import { mediaUrl } from "@/lib/mediaUrl";

/** Nationwide shipping rule shown in Order Summary / Razorpay totals. */
const FREE_SHIPPING_THRESHOLD_INR = 5000;
const STANDARD_SHIPPING_INR = 199;

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
  const grandTotalInr = total + shippingInr;
  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID?.trim() ?? "";

  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleRazorpayCheckout = useCallback(async () => {
    if (!razorpayKeyId) {
      setCheckoutError(
        "Add your Razorpay Key Id to the environment as VITE_RAZORPAY_KEY_ID (see Razorpay Dashboard → Account & Settings → API Keys → Key Id). Restart the dev server after saving .env.local.",
      );
      return;
    }
    setCheckoutError(null);
    setCheckoutBusy(true);
    try {
      const summary = items
        .map((i) => `${i.productName.slice(0, 40)}×${i.quantity}`)
        .join("; ")
        .slice(0, 250);

      await openRazorpayCheckout({
        keyId: razorpayKeyId,
        amountInr: grandTotalInr,
        merchantName: "Shivaanya Collection",
        description: `Order — ${itemCount} item(s)`,
        notes: {
          items: summary,
          subtotal_inr: String(total),
          shipping_inr: String(shippingInr),
        },
        onSuccess: () => {
          clearCart();
          window.alert(
            `Payment submitted for ₹${grandTotalInr.toLocaleString("en-IN")}. You will receive confirmation from the store.`,
          );
        },
        onDismiss: () => {},
      });
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : "Could not open Razorpay. Try again.");
    } finally {
      setCheckoutBusy(false);
    }
  }, [
    razorpayKeyId,
    grandTotalInr,
    itemCount,
    items,
    total,
    shippingInr,
    clearCart,
  ]);

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
                    disabled={checkoutBusy}
                    onClick={handleRazorpayCheckout}
                    className="w-full bg-black text-white py-4 text-xs font-semibold tracking-[0.2em] uppercase rounded-full hover:bg-black/80 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {checkoutBusy ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    ) : (
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    )}
                    Pay ₹{grandTotalInr.toLocaleString("en-IN")} with Razorpay
                  </button>

                  <p className="text-[10px] text-black/35 text-center mt-2 leading-relaxed">
                    {razorpayKeyId
                      ? "Checkout opens with bag total + shipping prefilled — Razorpay handles the amount automatically."
                      : "Create .env.local next to package.json with VITE_RAZORPAY_KEY_ID=your_key from Razorpay Dashboard, then restart npm run dev."}
                  </p>

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
                      className="flex-1 border border-black/10 px-4 py-3 text-sm bg-white focus:outline-none focus:border-black rounded-l-full"
                    />
                    <button
                      id="promo-apply-btn"
                      className="px-6 py-3 bg-black text-white text-xs font-semibold tracking-wider uppercase rounded-r-full hover:bg-black/80 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        )}
      </div>
    </div>
  );
}
