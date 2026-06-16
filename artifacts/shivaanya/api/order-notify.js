/**
 * Vercel Serverless — assign order number + notifications.
 *
 * Env (Vercel, never commit):
 * - RESEND_API_KEY + RESEND_FROM_EMAIL — customer + company email (Resend, primary)
 * - RESEND_REPLY_TO — optional reply-to (defaults to ORDER_NOTIFY_EMAIL)
 * - ORDER_NOTIFY_EMAIL — company inbox(es), comma-separated
 * - TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_SMS_FROM — customer SMS
 * - TWILIO_NOTIFY_PHONE — optional company SMS alert (E.164, e.g. +918439192467)
 * - GOOGLE_SHEETS_WEBHOOK_URL + GOOGLE_SHEETS_WEBHOOK_SECRET — Apps Script (sheet + Gmail email fallback)
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

/** Resend test sender — only delivers to the Resend account email, not shoppers. */
function isResendSandboxFrom(fromRaw) {
  const s = String(fromRaw ?? "").toLowerCase();
  return s.includes("resend.dev") || s.includes("onboarding@");
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

function buildCustomerEmailPlain(order) {
  const addr = [order.addressLine1, order.addressLine2, `${order.city}, ${order.state} ${order.pincode}`]
    .filter(Boolean)
    .join(", ");
  const payLine =
    order.paymentMethod === "cod"
      ? `Cash on Delivery — total due ${formatInr(order.totalPayableInr)}`
      : `Paid online — ${formatInr(order.totalPayableInr)}`;
  return [
    `Order ${order.orderNumber} confirmed — Shivaanya Collection`,
    "",
    `Hi ${order.customerName}, thank you for shopping with us.`,
    "",
    payLine,
    `Items (${order.itemCount}): ${order.itemsSummary}`,
    order.productCodes ? `Product codes: ${order.productCodes}` : "",
    `Deliver to: ${addr}`,
    `Ship to alternate address: ${order.shipElsewhere}`,
    "",
    `We'll call +91 ${order.phone} before dispatch.`,
    "Questions? Reply to this email or WhatsApp +91 84391 92467.",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildCompanyEmailPlain(order) {
  return [
    `New website order — ${order.orderNumber}`,
    `Placed at ${order.placedAt} (UTC)`,
    `Customer: ${order.customerName}`,
    `Email: ${order.email} · Phone: +91 ${order.phone}`,
    `Total: ${formatInr(order.totalPayableInr)}`,
    `Items: ${order.itemsSummary}`,
  ].join("\n");
}

async function sendResendEmail({ to, subject, html, text }) {
  const key = process.env.RESEND_API_KEY?.trim();
  const fromRaw = process.env.RESEND_FROM_EMAIL?.trim();
  if (!key) return { ok: false, reason: "RESEND_API_KEY not set on Vercel" };
  if (!fromRaw) return { ok: false, reason: "RESEND_FROM_EMAIL not set on Vercel" };

  const from = fromRaw.includes("<") ? fromRaw : `Shivaanya Collection <${fromRaw}>`;
  const recipients = (Array.isArray(to) ? to : [to]).map((s) => String(s).trim()).filter(Boolean);
  if (!recipients.length) return { ok: false, reason: "No recipient" };

  const replyTo = process.env.RESEND_REPLY_TO?.trim() || parseNotifyEmails()[0];
  const payload = {
    from,
    to: recipients,
    subject,
    html,
    text: text || undefined,
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
    if (res.ok) return { ok: true, provider: "resend" };
    const errText = await res.text().catch(() => "");
    let detail = errText.slice(0, 500);
    try {
      const parsed = JSON.parse(errText);
      detail = parsed?.message || parsed?.error || detail;
    } catch {
      /* keep raw */
    }
    console.error("[order-notify] Resend failed:", res.status, detail);
    return { ok: false, reason: `Resend: ${detail}` };
  } catch (err) {
    console.error("[order-notify] Resend error:", err);
    return { ok: false, reason: "Resend network error" };
  }
}

async function sendTwilioSms(toE164, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_SMS_FROM?.trim();
  if (!sid) return { ok: false, reason: "TWILIO_ACCOUNT_SID not set on Vercel" };
  if (!token) return { ok: false, reason: "TWILIO_AUTH_TOKEN not set on Vercel" };
  if (!from) return { ok: false, reason: "TWILIO_SMS_FROM not set on Vercel" };
  if (!toE164) return { ok: false, reason: "Invalid phone number" };
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
    if (res.ok) return { ok: true };
    const errText = await res.text().catch(() => "");
    console.error("[order-notify] Twilio SMS failed:", res.status, errText.slice(0, 500));
    return { ok: false, reason: `Twilio HTTP ${res.status}` };
  } catch (err) {
    console.error("[order-notify] Twilio error:", err);
    return { ok: false, reason: "Twilio network error" };
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

async function fetchAppsScriptWebhook(url, body) {
  const json = JSON.stringify(body);
  const post = async (targetUrl) =>
    fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json,
      redirect: "manual",
    });

  let res = await post(url);
  // Google Apps Script often 302s to googleusercontent.com — re-POST with body (fetch would drop it on redirect).
  if ([301, 302, 303, 307, 308].includes(res.status)) {
    const loc = res.headers.get("location");
    if (loc) res = await post(loc);
  }
  return res;
}

async function appendOrderToGoogleSheet(
  order,
  { sendEmailsViaGmail = false, sendCustomerEmailViaGmail = false, sendCompanyEmailViaGmail = false, companyNotifyEmails = "" } = {},
) {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim();
  if (!url) {
    return { ok: false, emailSent: false, companyEmailSent: false, error: "GOOGLE_SHEETS_WEBHOOK_URL not set on Vercel" };
  }

  const secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim() || "";
  if (!secret) {
    return { ok: false, emailSent: false, companyEmailSent: false, error: "GOOGLE_SHEETS_WEBHOOK_SECRET not set on Vercel" };
  }

  const customerMail = sendEmailsViaGmail || sendCustomerEmailViaGmail;
  const companyMail = sendEmailsViaGmail || sendCompanyEmailViaGmail;

  try {
    const res = await fetchAppsScriptWebhook(url, {
      secret,
      sendEmailsViaGmail: customerMail || companyMail,
      sendCustomerEmailViaGmail: customerMail,
      sendCompanyEmailViaGmail: companyMail,
      companyNotifyEmails,
      ...order,
    });
    const raw = await res.text().catch(() => "");
    let data = {};
    try {
      data = JSON.parse(raw || "{}");
    } catch {
      console.error("[order-notify] Google Sheet webhook non-JSON:", res.status, raw.slice(0, 300));
      return {
        ok: false,
        emailSent: false,
        companyEmailSent: false,
        error: `Webhook returned HTTP ${res.status} (not JSON). Redeploy Apps Script and check GOOGLE_SHEETS_WEBHOOK_URL.`,
      };
    }
    if (!res.ok || data.ok === false) {
      console.error("[order-notify] Google Sheet webhook failed:", res.status, data);
      return {
        ok: false,
        emailSent: !!data.emailSent,
        companyEmailSent: !!data.companyEmailSent,
        error: data.error || `Webhook HTTP ${res.status}`,
      };
    }
    return {
      ok: true,
      emailSent: !!data.emailSent,
      companyEmailSent: !!data.companyEmailSent,
      emailError: data.emailError || "",
    };
  } catch (err) {
    console.error("[order-notify] Google Sheet webhook error:", err);
    return { ok: false, emailSent: false, companyEmailSent: false, error: String(err) };
  }
}

async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method === "GET") {
    const url = !!process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim();
    const secret = !!process.env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim();
    const notify = !!process.env.ORDER_NOTIFY_EMAIL?.trim();
    return res.status(200).json({
      ok: true,
      message: "Shivaanya order-notify",
      configured: { sheetWebhook: url, sheetSecret: secret, orderNotifyEmail: notify },
    });
  }

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

  const companyEmailsCsv = companyEmails.join(", ");
  const resendFrom = process.env.RESEND_FROM_EMAIL?.trim() || "";
  const resendSandbox = isResendSandboxFrom(resendFrom);

  const customerResendPromise = resendSandbox
    ? Promise.resolve({
        ok: false,
        reason: "Resend sandbox sender — customer emails use Gmail until domain is verified",
      })
    : sendResendEmail({
        to: email,
        subject: customerSubject,
        html: buildCustomerEmailHtml(order),
        text: buildCustomerEmailPlain(order),
      });

  const [customerEmailResult, companyEmailResult, smsResult, companySmsResult] = await Promise.all([
    customerResendPromise,
    companyEmails.length
      ? sendResendEmail({
          to: companyEmails,
          subject: companySubject,
          html: buildCompanyEmailHtml(order),
          text: buildCompanyEmailPlain(order),
        })
      : Promise.resolve({ ok: false, reason: "ORDER_NOTIFY_EMAIL not set" }),
    (() => {
      const e164 = toE164India(phone);
      return e164 ? sendTwilioSms(e164, customerSms) : Promise.resolve({ ok: false, reason: "Invalid phone" });
    })(),
    companyNotifyPhone ? sendTwilioSms(companyNotifyPhone, companySms) : Promise.resolve({ ok: false }),
  ]);

  let emailSent = customerEmailResult.ok;
  let companyEmailSent = companyEmailResult.ok;
  const smsSent = smsResult.ok;
  const companySmsSent = companySmsResult.ok;

  // Gmail via Google Sheets Apps Script (customer +/or company when Resend did not send).
  const sheetResult = await appendOrderToGoogleSheet(order, {
    sendEmailsViaGmail: true,
    sendCustomerEmailViaGmail: true,
    sendCompanyEmailViaGmail: true,
    companyNotifyEmails: companyEmailsCsv || process.env.ORDER_NOTIFY_EMAIL?.trim() || "",
  });

  if (!emailSent && sheetResult.emailSent) emailSent = true;
  if (!companyEmailSent && sheetResult.companyEmailSent) companyEmailSent = true;

  if (!emailSent) {
    console.warn(
      "[order-notify] Customer email not sent.",
      customerEmailResult.reason ||
        sheetResult.emailError ||
        sheetResult.error ||
        (sheetResult.ok && !sheetResult.emailSent ? sheetResult.emailError || "Gmail send failed in Apps Script" : "unknown"),
    );
  }
  if (!smsSent) {
    console.warn("[order-notify] Customer SMS not sent.", smsResult.reason || "unknown");
  }

  return res.status(200).json({
    ok: true,
    orderNumber,
    emailSent,
    companyEmailSent,
    sheetUpdated: sheetResult.ok,
    smsSent,
    companySmsSent,
    emailProvider: emailSent ? (customerEmailResult.ok ? "resend" : "gmail") : null,
    sheetError: sheetResult.ok ? undefined : sheetResult.error,
  });
}

module.exports = handler;
