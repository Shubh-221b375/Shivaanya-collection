/**
 * Prepare + upload June 2026 product folders to S3 in the layout the storefront expects.
 *
 * 1) Put your six code folders under a source directory (flat or by category).
 * 2) Run: node scripts/publish-june2026-catalog.mjs --source "D:\\path\\to\\folders"
 * 3) Requires AWS CLI configured: aws s3 sync ...
 *
 * Expected S3 keys after upload:
 *   media/catalog/sarees/sarees-code-mu-1550p-20260613t070546z-3-001/img001.jpeg
 *   … (same slugs as src/data/june2026CatalogProducts.ts)
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  materializeWebsiteLeafMedia,
  resolveDestCatalogRoot,
  sanitizeSlug,
} from "./lib/website-catalog-sync.mjs";

const SITE_ROOT = path.resolve(import.meta.dirname, "..");
const DEST_ROOT = resolveDestCatalogRoot(SITE_ROOT);
const S3_BUCKET = process.env.SIVAANYA_S3_BUCKET?.trim() || "shivaanya-collection-media";
const S3_PREFIX = "media/catalog";

/** Official folder names → website category folder */
const FOLDER_MAP = [
  { code: "Code- MU 1550P-20260613T070546Z-3-001", category: "Sarees" },
  { code: "Code- MP 1699P-20260613T070542Z-3-001", category: "Sarees" },
  { code: "Code-AR 1600P-20260613T070550Z-3-001", category: "Anarkalis" },
  { code: "Code-DF 1199P-20260613T070554Z-3-001", category: "Sarees" },
  { code: "Code-LW 820-20260613T070612Z-3-001", category: "Suits" },
  { code: "Code- LW 1390-20260613T070540Z-3-001", category: "Anarkalis" },
];

function parseArgs() {
  const args = process.argv.slice(2);
  let source = process.env.JUNE2026_SOURCE?.trim() || "";
  let dryRun = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--source" && args[i + 1]) source = args[++i];
    if (args[i] === "--dry-run") dryRun = true;
  }
  return { source: source ? path.resolve(source) : "", dryRun };
}

function findFolder(sourceRoot, code) {
  const direct = path.join(sourceRoot, code);
  if (fs.existsSync(direct) && fs.statSync(direct).isDirectory()) return direct;
  for (const cat of ["Sarees", "Anarkalis", "Suits", "sarees", "anarkalis", "suits"]) {
    const nested = path.join(sourceRoot, cat, code);
    if (fs.existsSync(nested) && fs.statSync(nested).isDirectory()) return nested;
  }
  return null;
}

function copyTree(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    if (fs.statSync(from).isDirectory()) copyTree(from, to);
    else fs.copyFileSync(from, to);
  }
}

const { source, dryRun } = parseArgs();
if (!source || !fs.existsSync(source)) {
  console.error("Usage: node scripts/publish-june2026-catalog.mjs --source <folder-with-code-folders>");
  console.error("Each code folder must contain photos/videos (any filenames — renamed to img001*, vdo001*).");
  process.exit(1);
}

const staging = path.join(SITE_ROOT, ".catalog-staging");
if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });
fs.mkdirSync(staging, { recursive: true });

let synced = 0;
const missing = [];

for (const { code, category } of FOLDER_MAP) {
  const leaf = findFolder(source, code);
  if (!leaf) {
    missing.push(code);
    continue;
  }
  const relLeaf = `${category}/${code}`;
  const slug = sanitizeSlug(relLeaf);
  const destCat = category.replace(/\s+/g, "_").toLowerCase();
  const stagedLeaf = path.join(staging, category, code);
  copyTree(leaf, stagedLeaf);
  const ok = materializeWebsiteLeafMedia(DEST_ROOT, {
    leafAbs: stagedLeaf,
    slug,
    destCat,
  });
  if (ok) {
    synced++;
    console.log("✓", code, "→", `/media/catalog/${destCat}/${slug}/`);
  } else {
    console.warn("✗ no photos in", code);
  }
}

fs.rmSync(staging, { recursive: true, force: true });

console.log(`\nMaterialized ${synced}/${FOLDER_MAP.length} products under ${DEST_ROOT}`);
if (missing.length) {
  console.warn("Missing folders:", missing.join(", "));
}

const syncSrc = path.join(DEST_ROOT);
const syncDest = `s3://${S3_BUCKET}/${S3_PREFIX}/`;
console.log(`\nUpload command:\n  aws s3 sync "${syncSrc}" "${syncDest}" --acl public-read`);

if (dryRun) {
  console.log("\n(dry-run — skipping aws s3 sync)");
  process.exit(missing.length ? 1 : 0);
}

const aws = spawnSync("aws", ["s3", "sync", syncSrc, syncDest, "--acl", "public-read"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
if (aws.status !== 0) {
  console.error("\nAWS sync failed. Configure AWS CLI (aws configure) and run the command above manually.");
  process.exit(aws.status ?? 1);
}
console.log("\nDone. Redeploy the site if needed, then hard-refresh the shop page.");
