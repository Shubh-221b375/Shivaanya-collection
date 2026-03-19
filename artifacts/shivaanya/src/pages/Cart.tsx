import { useRef } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, Package } from "lucide-react";
import { useGetCart, useRemoveFromCart } from "@workspace/api-client-react";
import { useSessionId } from "@/hooks/use-session";

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
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
  const sessionId = useSessionId();
  const { data: cart, isLoading, refetch } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId } }
  );
  const removeItemMutation = useRemoveFromCart();

  const handleRemove = async (itemId: number) => {
    if (!sessionId) return;
    await removeItemMutation.mutateAsync({ itemId, params: { sessionId } } as any);
    refetch();
  };

  if (isLoading || !sessionId) {
    return (
      <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const items = cart?.items || [];
  const total = cart?.total || 0;
  const isEmpty = items.length === 0;

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <div className="relative h-36 bg-foreground overflow-hidden">
        <div className="relative z-10 h-full flex flex-col items-center justify-center">
          <p className="text-accent text-xs tracking-[0.4em] uppercase mb-2">Your Selection</p>
          <h1 className="font-serif text-4xl text-white font-light">Shopping Bag</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </Link>

        {isEmpty ? (
          <FadeIn>
            <div className="text-center py-24">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="font-serif text-3xl text-foreground mb-3 font-light">Your bag is empty</h2>
              <p className="text-muted-foreground mb-10 text-sm">Discover our curated collections of traditional Indian clothing</p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-10 py-4 text-sm font-medium tracking-widest uppercase hover:bg-primary/90 transition-all"
              >
                Explore Collections <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeIn>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, i) => (
                <FadeIn key={item.id} delay={i * 0.08}>
                  <motion.div
                    layout
                    className="flex gap-4 p-4 bg-card border border-border"
                  >
                    <Link href={`/product/${item.productId}`} className="flex-shrink-0">
                      <div className="w-24 h-32 overflow-hidden">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.productId}`} className="hover:text-primary transition-colors">
                        <h3 className="font-serif text-lg text-foreground leading-tight mb-1 line-clamp-2">
                          {item.productName}
                        </h3>
                      </Link>

                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2 mb-3">
                        <span className="border border-border px-2 py-0.5">{item.color}</span>
                        <span className="border border-border px-2 py-0.5">{item.size}</span>
                        <span className="border border-border px-2 py-0.5">Qty: {item.quantity}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-serif text-xl font-semibold text-primary">
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </span>
                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={removeItemMutation.isPending}
                          className="text-muted-foreground hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </FadeIn>
              ))}
            </div>

            {/* Order Summary */}
            <FadeIn delay={0.2}>
              <div className="space-y-4">
                <div className="bg-card border border-border p-6">
                  <h2 className="font-serif text-xl text-foreground mb-6">Order Summary</h2>

                  <div className="space-y-3 text-sm mb-6">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal ({cart?.itemCount || 0} items)</span>
                      <span>₹{total.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Shipping</span>
                      <span className={total >= 5000 ? "text-green-600 font-medium" : ""}>
                        {total >= 5000 ? "Free" : "₹299"}
                      </span>
                    </div>
                    {total < 5000 && (
                      <p className="text-xs text-accent">
                        Add ₹{(5000 - total).toLocaleString("en-IN")} more for free shipping
                      </p>
                    )}
                    <div className="border-t border-border pt-3 flex justify-between font-semibold text-foreground text-base">
                      <span>Total</span>
                      <span className="font-serif text-xl text-primary">
                        ₹{(total + (total >= 5000 ? 0 : 299)).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <button className="w-full bg-primary text-primary-foreground py-4 text-sm font-medium tracking-widest uppercase hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group">
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="mt-6 pt-6 border-t border-border space-y-3">
                    {[
                      { icon: Package, text: "Tracked delivery with updates" },
                      { icon: ShoppingBag, text: "Premium packaging included" },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Icon className="w-4 h-4 text-accent flex-shrink-0" />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Promo code */}
                <div className="bg-card border border-border p-6">
                  <h3 className="text-sm font-medium tracking-widest uppercase mb-4">Promo Code</h3>
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Enter code"
                      className="flex-1 border border-border px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary rounded-none"
                    />
                    <button className="px-4 py-2.5 bg-foreground text-background text-sm hover:bg-primary transition-colors">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        )}
      </div>
    </div>
  );
}
