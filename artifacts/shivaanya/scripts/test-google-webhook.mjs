/**
 * Test Google Sheets + Gmail webhook using .env.local
 * Usage: node scripts/test-google-webhook.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

function loadEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

async function postAppsScript(url, body) {
  const json = JSON.stringify(body);
  const post = (u) =>
    fetch(u, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json,
      redirect: "manual",
    });
  let res = await post(url);
  if ([301, 302, 303, 307, 308].includes(res.status)) {
    const loc = res.headers.get("location");
    if (loc) res = await fetch(loc, { method: "GET", redirect: "follow" });
  }
  return res;
}

const env = loadEnv(envPath);
const url = env.GOOGLE_SHEETS_WEBHOOK_URL?.trim();
const secret = env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim();
const notify = env.ORDER_NOTIFY_EMAIL?.trim() || "anjalikumari.shivcollection@gmail.com";

if (!url || !secret) {
  console.error("Add GOOGLE_SHEETS_WEBHOOK_URL and GOOGLE_SHEETS_WEBHOOK_SECRET to .env.local");
  process.exit(1);
}

const payload = {
  secret,
  sendCustomerEmailViaGmail: true,
  sendCompanyEmailViaGmail: true,
  companyNotifyEmails: notify,
  orderNumber: `SHV-TEST-${Date.now()}`,
  placedAt: new Date().toISOString(),
  customerName: "Webhook Test",
  email: notify,
  phone: "9876543210",
  addressLine1: "123 Test St",
  addressLine2: "",
  city: "Mumbai",
  state: "MH",
  pincode: "400001",
  paymentMethod: "cod",
  totalPayableInr: 1699,
  subtotalInr: 1699,
  shippingInr: 0,
  bagTotalInr: 1699,
  codHandlingFeeInr: 150,
  itemCount: 1,
  itemsSummary: "Test item ×1",
  shipElsewhere: "No",
};

const res = await postAppsScript(url, payload);
const text = await res.text();
console.log("HTTP", res.status);
console.log(text);

if (!res.ok) process.exit(1);
const data = JSON.parse(text);
if (data.ok === false) process.exit(1);
if (!data.emailSent) {
  console.error("Sheet ok but emailSent=false. emailError:", data.emailError || "(none)");
  process.exit(1);
}
console.log("OK — check inbox for", notify);
