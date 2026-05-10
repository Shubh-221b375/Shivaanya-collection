/**
 * Vercel Serverless — assign order number + optional email (Resend) + SMS (Twilio).
 *
 * Env (Vercel, never commit):
 * - RESEND_API_KEY + RESEND_FROM_EMAIL — transactional email
 * - TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_SMS_FROM — SMS (E.164)
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

async function sendResendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!key || !from) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
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
  const itemsSummary = clampStr(body.itemsSummary, 500);
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

  const addrBlock = [addressLine1, addressLine2, `${city}, ${state} ${pincode}`]
    .map((s) => escapeHtml(s))
    .filter((s) => s.length > 0)
    .join("<br/>");

  const payLine =
    paymentMethod === "cod"
      ? `Cash on Delivery — total due ₹${Math.round(totalPayableInr).toLocaleString("en-IN")} (includes ₹${Math.round(codHandlingFeeInr).toLocaleString("en-IN")} COD handling where applicable).`
      : `Paid online — ₹${Math.round(totalPayableInr).toLocaleString("en-IN")}.`;

  const promoLine =
    promoCode && promoDiscountInr > 0
      ? `<p>Promo: ${escapeHtml(promoCode)} (−₹${Math.round(promoDiscountInr).toLocaleString("en-IN")} on items)</p>`
      : "";

  const rpLine =
    razorpayPaymentId || razorpayOrderId
      ? `<p>Payment ref: ${escapeHtml(razorpayPaymentId || "—")} / Order: ${escapeHtml(razorpayOrderId || "—")}</p>`
      : "";

  const html = `
<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;">
  <h1 style="font-size:18px;">Order confirmed — Shivaanya Collection</h1>
  <p><strong>Order no:</strong> ${escapeHtml(orderNumber)}</p>
  <p>Hi ${escapeHtml(customerName)}, thank you for shopping with us.</p>
  <p>${payLine}</p>
  ${promoLine}
  ${rpLine}
  <p><strong>Items (${itemCount}):</strong> ${escapeHtml(itemsSummary)}</p>
  <p><strong>Deliver to:</strong><br/>${addrBlock}</p>
  <p><strong>Ship to alternate address:</strong> ${shipElsewhere ? "Yes" : "No"}</p>
  <p style="font-size:12px;color:#666;">Subtotal ₹${Math.round(subtotalInr).toLocaleString("en-IN")} · Shipping ₹${Math.round(shippingInr).toLocaleString("en-IN")} · Bag total ₹${Math.round(bagTotalInr).toLocaleString("en-IN")}</p>
  <p style="font-size:12px;color:#666;">We’ll send dispatch updates to this email and mobile when your order ships.</p>
</body></html>`;

  const subject = `Order ${orderNumber} confirmed — Shivaanya Collection`;

  const emailSent = await sendResendEmail({ to: email, subject, html });

  const smsBody = `Shivaanya: Order ${orderNumber} confirmed. Total Rs.${Math.round(totalPayableInr)}. ${paymentMethod === "cod" ? "COD" : "Paid online"}. We'll update you on dispatch.`;
  const e164 = toE164India(phone);
  const smsSent = e164 ? await sendTwilioSms(e164, smsBody) : false;

  return res.status(200).json({
    ok: true,
    orderNumber,
    emailSent,
    smsSent,
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = handler;
