/**
 * Vercel Serverless — creates a Razorpay Order so Checkout shows the exact cart total.
 * Vercel env (never commit): RAZORPAY_KEY_SECRET, RAZORPAY_KEY_ID (optional if VITE_RAZORPAY_KEY_ID is set for server).
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

async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "").trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

  if (!keyId || !keySecret) {
    return res.status(500).json({
      error:
        "Razorpay server keys missing. In Vercel add RAZORPAY_KEY_SECRET (and RAZORPAY_KEY_ID if needed). Never expose the secret in the browser.",
    });
  }

  const body = await parseJsonBody(req);
  if (body === null) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const amountPaise = Number(body.amountPaise);
  const receipt = String(body.receipt || `shivaanya_${Date.now()}`)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 40);
  const notes = body.notes && typeof body.notes === "object" && !Array.isArray(body.notes) ? body.notes : {};

  if (!Number.isFinite(amountPaise) || amountPaise < 100) {
    return res.status(400).json({ error: "amountPaise must be at least 100 (₹1.00)" });
  }

  const safeNotes = {};
  for (const [k, v] of Object.entries(notes)) {
    safeNotes[String(k).slice(0, 40)] = String(v).slice(0, 500);
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  let razorpayRes;
  try {
    razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: Math.round(amountPaise),
        currency: "INR",
        receipt,
        notes: safeNotes,
      }),
    });
  } catch {
    return res.status(502).json({ error: "Could not reach Razorpay" });
  }

  const data = await razorpayRes.json().catch(() => ({}));

  if (!razorpayRes.ok) {
    const msg =
      data?.error?.description || data?.error?.reason || data?.error?.code || "Razorpay order creation failed";
    return res.status(400).json({ error: msg });
  }

  return res.status(200).json({
    orderId: data.id,
    amountPaise: data.amount,
    currency: data.currency,
    keyId,
  });
}

module.exports = handler;
