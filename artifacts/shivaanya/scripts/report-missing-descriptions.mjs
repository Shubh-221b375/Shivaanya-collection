/**
 * Lists leaf asset folders under SHIVAANYA_COLLECTION_WEBSITE that lack
 * Description / description.txt / Description.txt (matches import rules).
 */

import fs from "node:fs";
import path from "node:path";

const WEBSITE_ROOT =
  process.env.SHIVAANYA_WEBSITE_ROOT ||
  path.resolve(
    import.meta.dirname,
    "..",
    "..",
    "..",
    "SHIVAANYA_COLLECTION_WEBSITE",
  );

const SKIP_TOP = new Set([
  "Categories",
  "Dream_Bridal_look_section",
  "Our_story_section",
  "Suits",
]);

const SCAN_TOP_NAMES = new Set(["Lehengas", "Sarees", "Plazo Set", "Anarkalis", "product1234"]);

const MEDIA_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm", ".mov"]);
const IMG_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function isMediaDir(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isFile()) continue;
    if (MEDIA_EXT.has(path.extname(e.name).toLowerCase())) return true;
  }
  return false;
}

function findLeafMediaDirs(categoryRootAbs) {
  const out = [];
  function walk(d) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    const subs = [];
    for (const e of entries) {
      if (e.isDirectory()) subs.push(path.join(d, e.name));
    }
    if (isMediaDir(d)) {
      let anyChildHasMedia = false;
      for (const sd of subs) {
        walk(sd);
        if (isMediaDir(sd)) anyChildHasMedia = true;
      }
      if (!anyChildHasMedia) out.push(d);
    } else {
      for (const sd of subs) walk(sd);
    }
  }
  walk(categoryRootAbs);
  return out;
}

function hasDescriptionFile(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (/^description$/i.test(name)) return true;
    if (/^description\.txt$/i.test(name)) return true;
  }
  return false;
}

function hasImageStill(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isFile()) continue;
    if (IMG_EXT.has(path.extname(e.name).toLowerCase())) return true;
  }
  return false;
}

if (!fs.existsSync(WEBSITE_ROOT)) {
  console.error("WEBSITE_ROOT missing:", WEBSITE_ROOT);
  process.exit(1);
}

const missing = [];

for (const te of fs.readdirSync(WEBSITE_ROOT, { withFileTypes: true })) {
  if (!te.isDirectory()) continue;
  if (SKIP_TOP.has(te.name)) continue;
  if (!SCAN_TOP_NAMES.has(te.name)) continue;

  const catRoot = path.join(WEBSITE_ROOT, te.name);
  for (const leaf of findLeafMediaDirs(catRoot)) {
    if (!hasImageStill(leaf)) continue;
    if (hasDescriptionFile(leaf)) continue;
    missing.push(path.relative(WEBSITE_ROOT, leaf));
  }
}

missing.sort((a, b) => a.localeCompare(b));

console.log(`Leaf product folders WITH images but WITHOUT Description / description.txt / Description.txt (${missing.length})\n`);
for (const rel of missing) console.log(rel);
