import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, Package, MapPin, CreditCard, ArrowRight, Mail, MessageSquare } from "lucide-react";
import { type StoredOrder, formatOrderDate } from "@/lib/orderHistory";
import { mediaUrl } from "@/lib/mediaUrl";

type Props = {
  order: StoredOrder;
  /** Highlight as a fresh checkout success (larger hero). */
  highlight?: boolean;
};

export function OrderConfirmationView({ order, highlight = false }: Props) {
  const [, setLocation] = useLocation();

  const viewAllOrders = () => {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
    setLocation("/orders");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `${base}/orders`);
    }
  };

  const paymentLabel =
    order.paymentMethod === "cod"
      ? `Cash on Delivery — ₹${order.totalPayableInr.toLocaleString("en-IN")}`
      : `Paid online — ₹${order.totalPayableInr.toLocaleString("en-IN")}`;

  const address = [
    order.addressLine1,
    order.addressLine2,
    `${order.city}, ${order.state} ${order.pincode}`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={
        highlight
          ? "rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-[#fafafa] p-6 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.06)]"
          : "rounded-2xl border border-black/[0.06] bg-white p-6 md:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.04)]"
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-8">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
            highlight ? "bg-emerald-600 text-white" : "bg-black text-white"
          }`}
        >
          <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-black/40 mb-1">
            {highlight ? "Order placed successfully" : "Order"}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-black tracking-tight break-all">
            {order.orderNumber}
          </h2>
          <p className="text-sm text-black/45 mt-2">{formatOrderDate(order.placedAt)}</p>
          {highlight ? (
            <p className="text-sm text-emerald-900/80 mt-3 leading-relaxed max-w-xl">
              Thank you, {order.fullName.split(" ")[0] || "there"}. Our team will call to confirm before dispatch.
            </p>
          ) : null}
        </div>
        <div className="text-left sm:text-right shrink-0">
          <p className="text-[10px] tracking-[0.15em] uppercase text-black/40 mb-1">Total</p>
          <p className="text-2xl font-bold text-black">₹{order.totalPayableInr.toLocaleString("en-IN")}</p>
          <p className="text-xs text-black/45 mt-1">{paymentLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl bg-[#fafafa] border border-black/[0.04] p-4">
          <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.15em] uppercase text-black/45 mb-3">
            <MapPin className="h-3.5 w-3.5" />
            Delivery
          </div>
          <p className="text-sm font-medium text-black">{order.fullName}</p>
          <p className="text-sm text-black/55 mt-1 leading-relaxed">{address}</p>
          <p className="text-sm text-black/55 mt-2">+91 {order.phone}</p>
          <p className="text-sm text-black/45 mt-1 break-all">{order.email}</p>
        </div>

        <div className="rounded-xl bg-[#fafafa] border border-black/[0.04] p-4">
          <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.15em] uppercase text-black/45 mb-3">
            <CreditCard className="h-3.5 w-3.5" />
            Payment
          </div>
          <p className="text-sm font-medium text-black">
            {order.paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay (online)"}
          </p>
          {order.paymentMethod === "cod" && order.codHandlingFeeInr > 0 ? (
            <p className="text-xs text-black/45 mt-2">
              Includes ₹{order.codHandlingFeeInr.toLocaleString("en-IN")} COD handling
            </p>
          ) : null}
          {order.promoCode && (order.promoDiscountInr ?? 0) > 0 ? (
            <p className="text-xs text-emerald-800 mt-2">
              Promo {order.promoCode}: −₹{order.promoDiscountInr!.toLocaleString("en-IN")}
            </p>
          ) : null}
          {(order.notifyEmailSent || order.notifySmsSent) && (
            <div className="mt-4 pt-3 border-t border-black/5 space-y-1.5 text-xs text-black/50">
              {order.notifyEmailSent ? (
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  Confirmation email sent
                </p>
              ) : null}
              {order.notifySmsSent ? (
                <p className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  SMS confirmation sent
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.15em] uppercase text-black/45 mb-4">
          <Package className="h-3.5 w-3.5" />
          Items ({order.items.reduce((n, i) => n + i.quantity, 0)})
        </div>
        <ul className="space-y-3">
          {order.items.map((item) => (
            <li
              key={`${item.productId}-${item.color}-${item.size}`}
              className="flex gap-4 items-center rounded-xl border border-black/[0.04] bg-white p-3"
            >
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-[#f0f0f0]">
                <img
                  src={mediaUrl(item.productImage)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black line-clamp-2">{item.productName}</p>
                {item.productCode ? (
                  <p className="text-[10px] text-black/55 font-mono mt-1 break-all">{item.productCode}</p>
                ) : null}
                <p className="text-[10px] text-black/40 uppercase tracking-wider mt-1">
                  {item.color} · {item.size} · Qty {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold text-black shrink-0">
                ₹{(item.price * item.quantity).toLocaleString("en-IN")}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {highlight ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 flex-1 bg-black text-white py-3.5 px-6 text-xs font-semibold tracking-[0.2em] uppercase rounded-full hover:bg-black/85 transition-colors"
          >
            Continue shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={viewAllOrders}
            className="inline-flex items-center justify-center gap-2 flex-1 border border-black/15 text-black py-3.5 px-6 text-xs font-semibold tracking-[0.2em] uppercase rounded-full hover:bg-black/[0.03] transition-colors"
          >
            View all orders
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}
