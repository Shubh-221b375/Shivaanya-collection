/**
 * Shivaanya Collection — orders → Google Sheet + Gmail confirmations
 *
 * Your sheet:
 * https://docs.google.com/spreadsheets/d/1BzA3Lq9mLGFD21TI_sk04mc8TJ_ITEhsb9YMInTChQ/edit
 *
 * Setup (one time):
 * 1. Open the sheet above → Extensions → Apps Script
 * 2. Delete any default Code.gs content → paste this entire file → Save
 * 3. Set WEBHOOK_SECRET below (pick a long random string)
 * 4. Run `setupOrderSheet` once (Run ▶) and allow permissions
 * 5. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the Web app URL (ends with /exec)
 * 7. Vercel → Settings → Environment Variables:
 *    GOOGLE_SHEETS_WEBHOOK_URL = (paste URL)
 *    GOOGLE_SHEETS_WEBHOOK_SECRET = (same as WEBHOOK_SECRET below)
 * 8. Redeploy the Vercel site
 *
 * After updating this script: Deploy → Manage deployments → Edit → Version: New version → Deploy
 * (Required so Gmail order emails start working.)
 */

/** Tab that receives order rows — uses your existing Sheet1. */
const SHEET_NAME = "Sheet1";

/** Must match GOOGLE_SHEETS_WEBHOOK_SECRET on Vercel exactly. */
const WEBHOOK_SECRET = "Shivaanya-orders-2026-8439192467";

/** Fallback company inbox when Vercel does not pass companyNotifyEmails. */
const DEFAULT_COMPANY_EMAIL = "anjalikumari.shivcollection@gmail.com";

const HEADERS = [
  "Order Number",
  "Placed At (UTC)",
  "Customer Name",
  "Email",
  "Phone",
  "Address Line 1",
  "Address Line 2",
  "City",
  "State",
  "PIN",
  "Payment Method",
  "Total Payable (INR)",
  "Subtotal (INR)",
  "Shipping (INR)",
  "Bag Total (INR)",
  "COD Handling (INR)",
  "Item Count",
  "Items Summary",
  "Product Codes",
  "Promo Code",
  "Promo Discount (INR)",
  "Alternate Address",
  "Razorpay Payment ID",
  "Razorpay Order ID",
];

/** Run once from Apps Script editor to add column headers to Sheet1. */
function setupOrderSheet() {
  const sheet = getOrderSheet_();
  sheet.clear();
  sheet.appendRow(HEADERS);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    if (!payload.secret || payload.secret !== WEBHOOK_SECRET) {
      return jsonResponse({ ok: false, error: "Unauthorized" });
    }

    const sheet = getOrderSheet_();
    if (sheet.getLastRow() === 0) {
      setupOrderSheet();
    }

    sheet.appendRow([
      payload.orderNumber || "",
      payload.placedAt || "",
      payload.customerName || "",
      payload.email || "",
      payload.phone || "",
      payload.addressLine1 || "",
      payload.addressLine2 || "",
      payload.city || "",
      payload.state || "",
      payload.pincode || "",
      payload.paymentMethod || "",
      payload.totalPayableInr || "",
      payload.subtotalInr || "",
      payload.shippingInr || "",
      payload.bagTotalInr || "",
      payload.codHandlingFeeInr || "",
      payload.itemCount || "",
      payload.itemsSummary || "",
      payload.productCodes || "",
      payload.promoCode || "",
      payload.promoDiscountInr || "",
      payload.shipElsewhere || "",
      payload.razorpayPaymentId || "",
      payload.razorpayOrderId || "",
    ]);

    let emailSent = false;
    let companyEmailSent = false;
    let emailError = "";
    try {
      const mail = sendOrderEmails_(payload, { customer: true, company: true });
      emailSent = mail.emailSent;
      companyEmailSent = mail.companyEmailSent;
      emailError = mail.emailError || "";
    } catch (mailErr) {
      emailError = String(mailErr);
      console.error("sendOrderEmails_ failed: " + mailErr);
    }

    return jsonResponse({
      ok: true,
      sheetLogged: true,
      emailSent: emailSent,
      companyEmailSent: companyEmailSent,
      emailError: emailError,
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

/** Optional: open the web app URL in a browser — should return {"ok":true,"message":"Shivaanya order webhook ready"}. */
function doGet() {
  return jsonResponse({ ok: true, message: "Shivaanya order webhook ready" });
}

function sendOrderEmails_(order, opts) {
  opts = opts || { customer: true, company: true };
  let emailSent = false;
  let companyEmailSent = false;
  const errors = [];

  const customerEmail = String(order.email || "").trim();
  if (opts.customer && customerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    try {
      const subject = "Order " + order.orderNumber + " confirmed — Shivaanya Collection";
      const html = buildCustomerEmailHtml_(order);
      const plain = buildCustomerEmailPlain_(order);
      GmailApp.sendEmail(customerEmail, subject, plain, {
        htmlBody: html,
        name: "Shivaanya Collection",
      });
      emailSent = true;
    } catch (err) {
      errors.push("customer: " + err);
      console.error("Customer email failed: " + err);
    }
  }

  const companyList = parseCompanyEmails_(order.companyNotifyEmails);
  if (opts.company && companyList.length) {
    try {
      const subject =
        "[New order] " +
        order.orderNumber +
        " — ₹" +
        Math.round(Number(order.totalPayableInr) || 0).toLocaleString("en-IN");
      const html = buildCompanyEmailHtml_(order);
      const plain = buildCompanyEmailPlain_(order);
      GmailApp.sendEmail(companyList.join(","), subject, plain, {
        htmlBody: html,
        name: "Shivaanya Orders",
      });
      companyEmailSent = true;
    } catch (err) {
      errors.push("company: " + err);
      console.error("Company email failed: " + err);
    }
  }

  return { emailSent: emailSent, companyEmailSent: companyEmailSent, emailError: errors.join("; ") };
}

function parseCompanyEmails_(raw) {
  const list = String(raw || "")
    .split(/[,;]/)
    .map(function (s) {
      return s.trim();
    })
    .filter(function (s) {
      return s && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
    });
  if (list.length) return list;
  return DEFAULT_COMPANY_EMAIL ? [DEFAULT_COMPANY_EMAIL] : [];
}

function formatInr_(n) {
  return "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");
}

function escapeHtml_(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildCustomerEmailHtml_(order) {
  const addr = [
    order.addressLine1,
    order.addressLine2,
    order.city + ", " + order.state + " " + order.pincode,
  ]
    .filter(Boolean)
    .map(escapeHtml_)
    .join("<br/>");

  const payLine =
    order.paymentMethod === "cod"
      ? "Cash on Delivery — total due " +
        formatInr_(order.totalPayableInr) +
        " (includes " +
        formatInr_(order.codHandlingFeeInr) +
        " COD handling where applicable)."
      : "Paid online — " + formatInr_(order.totalPayableInr) + ".";

  const promoLine =
    order.promoCode && Number(order.promoDiscountInr) > 0
      ? "<p>Promo: " +
        escapeHtml_(order.promoCode) +
        " (−" +
        formatInr_(order.promoDiscountInr) +
        " on items)</p>"
      : "";

  return (
    "<!DOCTYPE html><html><body style=\"font-family:system-ui,sans-serif;line-height:1.5;color:#111;\">" +
    "<h1 style=\"font-size:18px;\">Order confirmed — Shivaanya Collection</h1>" +
    "<p><strong>Order no:</strong> " +
    escapeHtml_(order.orderNumber) +
    "</p>" +
    "<p>Hi " +
    escapeHtml_(order.customerName) +
    ", thank you for shopping with us.</p>" +
    "<p>" +
    payLine +
    "</p>" +
    promoLine +
    "<p><strong>Items (" +
    escapeHtml_(order.itemCount) +
    "):</strong> " +
    escapeHtml_(order.itemsSummary) +
    "</p>" +
    (order.productCodes
      ? "<p><strong>Product codes:</strong> " + escapeHtml_(order.productCodes) + "</p>"
      : "") +
    "<p><strong>Deliver to:</strong><br/>" +
    addr +
    "</p>" +
    "<p style=\"font-size:13px;color:#333;margin-top:16px;\">Our team will call you on <strong>+91 " +
    escapeHtml_(order.phone) +
    "</strong> to confirm before dispatch.</p>" +
    "<p style=\"font-size:12px;color:#666;\">Questions? Reply to this email or WhatsApp us at +91 84391 92467.</p>" +
    "</body></html>"
  );
}

function buildCustomerEmailPlain_(order) {
  return (
    "Order " +
    order.orderNumber +
    " confirmed — Shivaanya Collection\n\n" +
    "Hi " +
    order.customerName +
    ", thank you for shopping with us.\n\n" +
    "Total: " +
    formatInr_(order.totalPayableInr) +
    "\n" +
    "Items: " +
    order.itemsSummary +
    "\n\n" +
    "We'll call +91 " +
    order.phone +
    " before dispatch.\n" +
    "WhatsApp: +91 84391 92467"
  );
}

function buildCompanyEmailHtml_(order) {
  const addr = [
    order.addressLine1,
    order.addressLine2,
    order.city + ", " + order.state + " " + order.pincode,
  ]
    .filter(Boolean)
    .map(escapeHtml_)
    .join("<br/>");

  const paymentLabel =
    order.paymentMethod === "cod" ? "Cash on Delivery (COD)" : "Paid online (Razorpay)";

  return (
    "<!DOCTYPE html><html><body style=\"font-family:system-ui,sans-serif;line-height:1.5;color:#111;\">" +
    "<h1 style=\"font-size:18px;\">New website order — " +
    escapeHtml_(order.orderNumber) +
    "</h1>" +
    "<p>Customer: <strong>" +
    escapeHtml_(order.customerName) +
    "</strong></p>" +
    "<p>Email: " +
    escapeHtml_(order.email) +
    " · Phone: +91 " +
    escapeHtml_(order.phone) +
    "</p>" +
    "<p>Payment: " +
    paymentLabel +
    " · Total: <strong>" +
    formatInr_(order.totalPayableInr) +
    "</strong></p>" +
    "<p><strong>Items:</strong> " +
    escapeHtml_(order.itemsSummary) +
    "</p>" +
    "<p><strong>Deliver to:</strong><br/>" +
    addr +
    "</p>" +
    "</body></html>"
  );
}

function buildCompanyEmailPlain_(order) {
  return (
    "New order " +
    order.orderNumber +
    "\n" +
    order.customerName +
    " · +91 " +
    order.phone +
    "\n" +
    "Total " +
    formatInr_(order.totalPayableInr) +
    "\n" +
    order.itemsSummary
  );
}

function getOrderSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (sheet) return sheet;
  return ss.insertSheet(SHEET_NAME);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/** Run once from Apps Script editor to verify Gmail sends (no webhook). */
function testOrderEmail() {
  const sample = {
    orderNumber: "SHV-TEST-EMAIL",
    customerName: "Test Customer",
    email: DEFAULT_COMPANY_EMAIL,
    phone: "9876543210",
    addressLine1: "123 Test Street",
    addressLine2: "",
    city: "Mumbai",
    state: "MH",
    pincode: "400001",
    paymentMethod: "cod",
    totalPayableInr: 1699,
    codHandlingFeeInr: 150,
    itemCount: 1,
    itemsSummary: "Test saree ×1",
    shipElsewhere: "No",
    companyNotifyEmails: DEFAULT_COMPANY_EMAIL,
  };
  const result = sendOrderEmails_(sample, { customer: true, company: true });
  Logger.log(JSON.stringify(result));
}
