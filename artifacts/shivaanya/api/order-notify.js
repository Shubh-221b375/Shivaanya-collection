/**
 * Vercel Serverless — assign order number + notifications.
 *
 * Env (Vercel, never commit):
 * - RESEND_API_KEY + RESEND_FROM_EMAIL — customer + company email (Resend)
 * - ORDER_NOTIFY_EMAIL — company inbox(es), comma-separated
 * - TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_SMS_FROM — customer SMS
 * - TWILIO_NOTIFY_PHONE — optional company SMS alert (E.164, e.g. +918439192467)
 */

async function parseJsonBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (Buffer.isBuffer(req.body)) {
      try {
        return JSON.parse(req.body.toString("utf8") || "{}");
      } catch {
        return null;
      }
    }
    if (typeof req.body === "string") {
      try {
        return JSON.parse(req.body || "{}");
      } catch {
        return null;
      }
    }
    if (typeof req.body === "object") {
      return req.body;
    }
  }
  return await new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(JSON.parse(raw || "{}"));
      } catch {
        resolve(null);
      }
    });
    req.on("error", reject);
  });
}

function makeOrderNumber() {
  const now = new Date();
  const y = String(now.getFullYear()).slice(2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SHV-${y}${m}${d}-${r}`;
}

function clampStr(s, n) {
  return String(s ?? "")
    .trim()
    .slice(0, n);
}

function toE164India(phoneDigits) {
  const d = String(phoneDigits ?? "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return `+${d}`;
  if (d.length === 11 && d.startsWith("0")) return `+91${d.slice(1)}`;
  if (d.length === 10) return `+91${d}`;
  return "";
}

function parseNotifyEmails() {
  const raw = process.env.ORDER_NOTIFY_EMAIL?.trim();
  if (!raw) return [];
  return raw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInr(n) {
  return `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
}

function formatLineItemsSummary(lineItems) {
  if (!Array.isArray(lineItems) || !lineItems.length) return "";
  return lineItems
    .map((i) => {
      const code = i?.productCode ? `[${clampStr(i.productCode, 120)}] ` : "";
      const qty = Math.min(999, Math.max(1, parseInt(String(i?.quantity), 10) || 1));
      return `${code}${clampStr(i?.productName, 80)} (${clampStr(i?.color, 24)}, ${clampStr(i?.size, 24)}) ×${qty}`;
    })
    .join("; ")
    .slice(0, 900);
}

function extractProductCodes(lineItems) {
  if (!Array.isArray(lineItems)) return "";
  return lineItems
    .map((i) => clampStr(i?.productCode, 120))
    .filter(Boolean)
    .join("; ")
    .slice(0, 500);
}

async function sendResendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY?.trim();
  const fromRaw = process.env.RESEND_FROM_EMAIL?.trim();
  if (!key || !fromRaw) return false;

  const from = fromRaw.includes("<") ? fromRaw : `Shivaanya Collection <${fromRaw}>`;
  const recipients = (Array.isArray(to) ? to : [to]).map((s) => String(s).trim()).filter(Boolean);
  if (!recipients.length) return false;

  const replyTo = parseNotifyEmails()[0];
  const payload = {
    from,
    to: recipients,
    subject,
    html,
  };
  if (replyTo) payload.reply_to = replyTo;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendTwilioSms(toE164, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_SMS_FROM?.trim();
  if (!sid || !token || !from || !toE164) return false;
  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: toE164,
        From: from,
        Body: body.slice(0, 1600),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function buildOrderRecord(orderNumber, fields) {
  const {
    customerName,
    email,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    pincode,
    paymentMethod,
    totalPayableInr,
    bagTotalInr,
    itemsSummary,
    productCodes,
    itemCount,
    subtotalInr,
    shippingInr,
    codHandlingFeeInr,
    shipElsewhere,
    promoCode,
    promoDiscountInr,
    razorpayPaymentId,
    razorpayOrderId,
  } = fields;

  return {
    orderNumber,
    placedAt: new Date().toISOString(),
    customerName,
    email,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    pincode,
    paymentMethod,
    totalPayableInr: Math.round(totalPayableInr),
    subtotalInr: Math.round(subtotalInr),
    shippingInr: Math.round(shippingInr),
    bagTotalInr: Math.round(bagTotalInr),
    codHandlingFeeInr: Math.round(codHandlingFeeInr),
    itemCount,
    itemsSummary,
    productCodes,
    promoCode: promoCode || "",
    promoDiscountInr: Math.round(promoDiscountInr),
    shipElsewhere: shipElsewhere ? "Yes" : "No",
    razorpayPaymentId: razorpayPaymentId || "",
    razorpayOrderId: razorpayOrderId || "",
  };
}

function buildCustomerEmailHtml(order) {
  const addrBlock = [order.addressLine1, order.addressLine2, `${order.city}, ${order.state} ${order.pincode}`]
    .map((s) => escapeHtml(s))
    .filter((s) => s.length > 0)
    .join("<br/>");

  const payLine =
    order.paymentMethod === "cod"
      ? `Cash on Delivery — total due ${formatInr(order.totalPayableInr)} (includes ${formatInr(order.codHandlingFeeInr)} COD handling where applicable).`
      : `Paid online — ${formatInr(order.totalPayableInr)}.`;

  const promoLine =
    order.promoCode && order.promoDiscountInr > 0
      ? `<p>Promo: ${escapeHtml(order.promoCode)} (−${formatInr(order.promoDiscountInr)} on items)</p>`
      : "";

  const rpLine =
    order.razorpayPaymentId || order.razorpayOrderId
      ? `<p>Payment ref: ${escapeHtml(order.razorpayPaymentId || "—")} / Order: ${escapeHtml(order.razorpayOrderId || "—")}</p>`
      : "";

  return `
<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;">
  <h1 style="font-size:18px;">Order confirmed — Shivaanya Collection</h1>
  <p><strong>Order no:</strong> ${escapeHtml(order.orderNumber)}</p>
  <p>Hi ${escapeHtml(order.customerName)}, thank you for shopping with us.</p>
  <p>${payLine}</p>
  ${promoLine}
  ${rpLine}
  <p><strong>Items (${order.itemCount}):</strong> ${escapeHtml(order.itemsSummary)}</p>
  ${
    order.productCodes
      ? `<p><strong>Product codes:</strong> ${escapeHtml(order.productCodes)}</p>`
      : ""
  }
  <p><strong>Deliver to:</strong><br/>${addrBlock}</p>
  <p><strong>Ship to alternate address:</strong> ${order.shipElsewhere}</p>
  <p style="font-size:12px;color:#666;">Subtotal ${formatInr(order.subtotalInr)} · Bag total ${formatInr(order.bagTotalInr)}</p>
  <p style="font-size:13px;color:#333;margin-top:16px;">Our team will call you on <strong>+91 ${escapeHtml(order.phone)}</strong> to confirm before dispatch.</p>
  <p style="font-size:12px;color:#666;">Questions? Reply to this email or WhatsApp us.</p>
</body></html>`;
}

function buildCompanyEmailHtml(order) {
  const addrBlock = [order.addressLine1, order.addressLine2, `${order.city}, ${order.state} ${order.pincode}`]
    .map((s) => escapeHtml(s))
    .filter((s) => s.length > 0)
    .join("<br/>");

  const paymentLabel = order.paymentMethod === "cod" ? "Cash on Delivery (COD)" : "Paid online (Razorpay)";

  return `
<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;">
  <h1 style="font-size:18px;">New website order — ${escapeHtml(order.orderNumber)}</h1>
  <p style="font-size:13px;color:#444;">Placed at ${escapeHtml(order.placedAt)} (UTC)</p>
  <table style="border-collapse:collapse;font-size:14px;margin:16px 0;">
    <tr><td style="padding:4px 12px 4px 0;color:#666;">Customer</td><td><strong>${escapeHtml(order.customerName)}</strong></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666;">Email</td><td><a href="mailto:${escapeHtml(order.email)}">${escapeHtml(order.email)}</a></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666;">Phone</td><td><a href="tel:+91${escapeHtml(order.phone)}">+91 ${escapeHtml(order.phone)}</a></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666;">Payment</td><td>${escapeHtml(paymentLabel)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666;">Total due</td><td><strong>${formatInr(order.totalPayableInr)}</strong></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666;">Subtotal</td><td>${formatInr(order.subtotalInr)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666;">Shipping</td><td>${formatInr(order.shippingInr)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666;">COD handling</td><td>${formatInr(order.codHandlingFeeInr)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666;">Promo</td><td>${order.promoCode ? `${escapeHtml(order.promoCode)} (−${formatInr(order.promoDiscountInr)})` : "—"}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666;">Alternate address</td><td>${escapeHtml(order.shipElsewhere)}</td></tr>
  </table>
  <p><strong>Items (${order.itemCount}):</strong> ${escapeHtml(order.itemsSummary)}</p>
  ${
    order.productCodes
      ? `<p><strong>Product codes:</strong> ${escapeHtml(order.productCodes)}</p>`
      : ""
  }
  <p><strong>Deliver to:</strong><br/>${addrBlock}</p>
  ${
    order.razorpayPaymentId || order.razorpayOrderId
      ? `<p style="font-size:13px;">Razorpay payment: ${escapeHtml(order.razorpayPaymentId || "—")} · Order: ${escapeHtml(order.razorpayOrderId || "—")}</p>`
      : ""
  }
</body></html>`;
}

async function appendOrderToGoogleSheet(order) {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim();
  if (!url) return false;

  const secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim() || "";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, ...order }),
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({}));
    return data.ok !== false;
  } catch {
    return false;
  }
}

async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = await parseJsonBody(req);
  if (body === null || typeof body !== "object") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const customerName = clampStr(body.customerName, 120);
  const email = clampStr(body.email, 120).toLowerCase();
  const phone = clampStr(body.phone, 20).replace(/\D/g, "");
  const addressLine1 = clampStr(body.addressLine1, 200);
  const addressLine2 = clampStr(body.addressLine2, 200);
  const city = clampStr(body.city, 80);
  const state = clampStr(body.state, 80);
  const pincode = clampStr(body.pincode, 10).replace(/\D/g, "").slice(0, 6);
  const paymentMethod = body.paymentMethod === "online" ? "online" : "cod";
  const totalPayableInr = Number(body.totalPayableInr);
  const bagTotalInr = Number(body.bagTotalInr);
  const lineItems = Array.isArray(body.lineItems) ? body.lineItems.slice(0, 50) : [];
  const itemsSummaryFromLines = formatLineItemsSummary(lineItems);
  const itemsSummary = itemsSummaryFromLines || clampStr(body.itemsSummary, 900);
  const productCodes = extractProductCodes(lineItems);
  const itemCount = Math.min(999, Math.max(0, parseInt(String(body.itemCount), 10) || 0));
  const subtotalInr = Number(body.subtotalInr);
  const shippingInr = Number(body.shippingInr);
  const codHandlingFeeInr = Number(body.codHandlingFeeInr) || 0;
  const shipElsewhere = !!body.shipElsewhere;
  const promoCode = body.promoCode ? clampStr(body.promoCode, 40) : "";
  const promoDiscountInr = Number(body.promoDiscountInr) || 0;
  const razorpayPaymentId = body.razorpayPaymentId ? clampStr(body.razorpayPaymentId, 80) : "";
  const razorpayOrderId = body.razorpayOrderId ? clampStr(body.razorpayOrderId, 80) : "";

  if (customerName.length < 2) return res.status(400).json({ error: "Name required" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Invalid email" });
  if (phone.length !== 10) return res.status(400).json({ error: "Invalid phone" });
  if (!Number.isFinite(totalPayableInr) || totalPayableInr < 1) return res.status(400).json({ error: "Invalid total" });

  const orderNumber = makeOrderNumber();
  const order = buildOrderRecord(orderNumber, {
    customerName,
    email,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    pincode,
    paymentMethod,
    totalPayableInr,
    bagTotalInr,
    itemsSummary,
    productCodes,
    itemCount,
    subtotalInr,
    shippingInr,
    codHandlingFeeInr,
    shipElsewhere,
    promoCode,
    promoDiscountInr,
    razorpayPaymentId,
    razorpayOrderId,
  });

  const companyEmails = parseNotifyEmails();
  const customerSubject = `Order ${orderNumber} confirmed — Shivaanya Collection`;
  const companySubject = `[New order] ${orderNumber} — ₹${Math.round(totalPayableInr).toLocaleString("en-IN")}`;

  const payLabel = paymentMethod === "cod" ? "COD" : "Paid online";
  const siteBase = (process.env.ORDER_SITE_URL || process.env.VERCEL_URL || "").replace(/\/$/, "");
  const ordersLink = siteBase ? ` Orders: ${siteBase.startsWith("http") ? siteBase : `https://${siteBase}`}/orders` : "";
  const customerSms = `Shivaanya Collection: Order ${orderNumber} confirmed. Total Rs.${Math.round(totalPayableInr)} (${payLabel}). We'll call before dispatch.${ordersLink}`;

  const companyNotifyPhone = process.env.TWILIO_NOTIFY_PHONE?.trim();
  const companySms = `New order ${orderNumber}: ${customerName}, Rs.${Math.round(totalPayableInr)} (${payLabel}). ${phone}. ${productCodes ? productCodes.slice(0, 60) + ". " : ""}${itemsSummary.slice(0, 60)}`;

  const [emailSent, companyEmailSent, sheetUpdated, smsSent, companySmsSent] = await Promise.all([
    sendResendEmail({
      to: email,
      subject: customerSubject,
      html: buildCustomerEmailHtml(order),
    }),
    companyEmails.length
      ? sendResendEmail({
          to: companyEmails,
          subject: companySubject,
          html: buildCompanyEmailHtml(order),
        })
      : Promise.resolve(false),
    appendOrderToGoogleSheet(order),
    (() => {
      const e164 = toE164India(phone);
      return e164 ? sendTwilioSms(e164, customerSms) : Promise.resolve(false);
    })(),
    companyNotifyPhone ? sendTwilioSms(companyNotifyPhone, companySms) : Promise.resolve(false),
  ]);

  return res.status(200).json({
    ok: true,
    orderNumber,
    emailSent,
    companyEmailSent,
    sheetUpdated,
    smsSent,
    companySmsSent,
  });
}

module.exports = handler;
