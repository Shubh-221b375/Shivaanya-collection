/**
 * Shivaanya Collection — append website orders to Google Sheets
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
 */

/** Tab that receives order rows — uses your existing Sheet1. */
const SHEET_NAME = "Sheet1";

/** Must match GOOGLE_SHEETS_WEBHOOK_SECRET on Vercel exactly. */
const WEBHOOK_SECRET = "change-me-to-a-long-random-string";

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
      payload.promoCode || "",
      payload.promoDiscountInr || "",
      payload.shipElsewhere || "",
      payload.razorpayPaymentId || "",
      payload.razorpayOrderId || "",
    ]);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

/** Optional: open the web app URL in a browser — should return {"ok":true,"message":"Shivaanya order webhook ready"}. */
function doGet() {
  return jsonResponse({ ok: true, message: "Shivaanya order webhook ready" });
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
