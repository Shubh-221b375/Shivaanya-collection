import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Package, ArrowRight, ShoppingBag } from "lucide-react";
import { getOrders, getOrderByNumber } from "@/lib/orderHistory";
import { OrderConfirmationView } from "@/components/checkout/OrderConfirmationView";

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function placedOrderFromQuery(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("placed");
}

export default function Orders() {
  const [location] = useLocation();
  const placedOrderNumber = useMemo(() => placedOrderFromQuery(), [location]);
  const orders = useMemo(() => getOrders(), [location, placedOrderNumber]);
  const highlightedOrder = placedOrderNumber ? getOrderByNumber(placedOrderNumber) : undefined;
  const listOrders = highlightedOrder
    ? orders.filter((o) => o.orderNumber !== placedOrderNumber)
    : orders;

  return (
    <div className="min-h-screen bg-[#fafafa] pt-24 md:pt-28">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-16">
        <FadeUp>
          <p className="text-xs tracking-[0.35em] uppercase text-black/40 mb-3">Your account</p>
          <h1 className="text-3xl md:text-4xl font-bold text-black tracking-tight">My Orders</h1>
          <p className="text-sm text-black/45 mt-3 max-w-lg leading-relaxed">
            Orders placed on this device appear here. Sign in at checkout to save your delivery details for next time.
          </p>
        </FadeUp>

        {highlightedOrder ? (
          <div className="mt-10">
            <OrderConfirmationView order={highlightedOrder} highlight />
          </div>
        ) : null}

        {orders.length === 0 ? (
          <FadeUp delay={0.1}>
            <div className="mt-16 text-center py-16 px-6 rounded-2xl border border-dashed border-black/10 bg-white">
              <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-7 h-7 text-black/25" />
              </div>
              <h2 className="text-xl font-semibold text-black mb-2">No orders yet</h2>
              <p className="text-sm text-black/45 mb-8 max-w-sm mx-auto">
                When you place an order, it will show up here with delivery and payment details.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-black text-white px-8 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase rounded-full hover:bg-black/85 transition-colors"
              >
                Explore collections <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeUp>
        ) : (
          <div className="mt-10 space-y-8">
            {listOrders.length > 0 ? (
              <>
                <FadeUp delay={0.05}>
                  <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase text-black/40">
                    <Package className="h-3.5 w-3.5" />
                    {highlightedOrder ? "Previous orders" : "All orders"}
                  </div>
                </FadeUp>
                {listOrders.map((order, i) => (
                  <FadeUp key={order.orderNumber} delay={0.08 + i * 0.05}>
                    <OrderConfirmationView order={order} />
                  </FadeUp>
                ))}
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
