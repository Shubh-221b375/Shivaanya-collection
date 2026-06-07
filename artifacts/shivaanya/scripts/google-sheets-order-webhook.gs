/**
 * Shivaanya Collection — append website orders to Google Sheets
 *
 * Setup:
 * 1. Create a Google Sheet (e.g. "Shivaanya Orders").
 * 2. Extensions → Apps Script → paste this file.
 * 3. Set WEBHOOK_SECRET below (same value as GOOGLE_SHEETS_WEBHOOK_SECRET on Vercel).
 * 4. Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web app URL → Vercel env GOOGLE_SHEETS_WEBHOOK_URL
 */

const SHEET_NAME = "Orders";
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

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    if (!payload.secret || payload.secret !== WEBHOOK_SECRET) {
      return jsonResponse({ ok: false, error: "Unauthorized" });
    }

    const sheet = getOrCreateSheet_(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
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

function getOrCreateSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
