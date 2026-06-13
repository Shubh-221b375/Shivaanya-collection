/**
 * HEAD-check S3 objects for June 2026 catalog slugs (and optional full import list).
 * Usage: node scripts/verify-s3-catalog.mjs
 */

import https from "node:https";

const BUCKET = process.env.SIVAANYA_S3_BUCKET?.trim() || "shivaanya-collection-media";
const HOST = `${BUCKET}.s3.ap-south-1.amazonaws.com`;

const JUNE2026 = [
  ["sarees", "sarees-code-mu-1550p-20260613t070546z-3-001"],
  ["sarees", "sarees-code-mp-1699p-20260613t070542z-3-001"],
  ["anarkalis", "anarkalis-code-ar-1600p-20260613t070550z-3-001"],
  ["sarees", "sarees-code-df-1199p-20260613t070554z-3-001"],
  ["suits", "suits-code-lw-820-20260613t070612z-3-001"],
  ["anarkalis", "anarkalis-code-lw-1390-20260613t070540z-3-001"],
];

function headObject(objectPath) {
  return new Promise((resolve) => {
    const req = https.request({ hostname: HOST, path: objectPath, method: "HEAD", timeout: 8000 }, (res) => {
      const ok = res.statusCode === 200 && String(res.headers["content-type"] || "").startsWith("image");
      resolve({ ok, status: res.statusCode, type: res.headers["content-type"] });
    });
    req.on("error", () => resolve({ ok: false, status: 0 }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, status: 0 });
    });
    req.end();
  });
}

let failures = 0;
for (const [cat, slug] of JUNE2026) {
  const p = `/media/catalog/${cat}/${slug}/img001.jpeg`;
  const r = await headObject(p);
  if (r.ok) console.log("OK ", p);
  else {
    failures++;
    console.log("MISS", p, `(HTTP ${r.status})`);
  }
}
process.exit(failures ? 1 : 0);
