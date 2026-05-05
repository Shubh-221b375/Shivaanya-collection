/**
 * Build the S3-ready folder tree locally: public/media/catalog/<category>/<product-slug>/img001* … vdo001* …
 * Same layout and filenames as storefront URLs (/media/catalog/…) so you can sync this folder to a bucket prefix.
 *
 * Usage (from artifacts/shivaanya):
 *   npm run catalog:sync
 *   SHIVAANYA_WEBSITE_ROOT="C:\\path\\to\\SHIVAANYA_COLLECTION_WEBSITE" npm run catalog:sync
 */

import path from "node:path";
import {
  materializeWebsiteLeafMedia,
  resolveDestCatalogRoot,
  resolveWebsiteRoot,
  walkWebsiteCatalogLeaves,
} from "./lib/website-catalog-sync.mjs";

const SITE_ROOT = path.resolve(import.meta.dirname, "..");
const DEST_ROOT = resolveDestCatalogRoot(SITE_ROOT);
const WEBSITE_ROOT = resolveWebsiteRoot();

let synced = 0;
let skippedNoPhotos = 0;

for (const leaf of walkWebsiteCatalogLeaves(WEBSITE_ROOT)) {
  const ok = materializeWebsiteLeafMedia(DEST_ROOT, leaf);
  if (ok) synced++;
  else skippedNoPhotos++;
}

console.log(
  `Synced ${synced} product media folders → ${DEST_ROOT}` +
    (skippedNoPhotos ? ` (${skippedNoPhotos} skipped: no photos)` : ""),
);
console.log(
  "Upload to S3: sync the contents of public/media/catalog/ so object keys match /media/catalog/… (bucket website or CloudFront origin path).",
);
