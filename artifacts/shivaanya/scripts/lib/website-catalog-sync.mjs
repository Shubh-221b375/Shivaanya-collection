/**
 * Shared walker + filesystem layout for storefront catalog media.
 *
 * Sources: SHIVAANYA_COLLECTION_WEBSITE (adjust via SHIVAANYA_WEBSITE_ROOT).
 * Output: Vite serves them as URLs /media/catalog/<destCat>/<slug>/img001.webp …
 */

import fs from "node:fs";
import path from "node:path";

export const WEBSITE_ROOT_DEFAULT = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  "SHIVAANYA_COLLECTION_WEBSITE",
);

export function resolveWebsiteRoot() {
  return process.env.SHIVAANYA_WEBSITE_ROOT?.trim()
    ? path.resolve(process.env.SHIVAANYA_WEBSITE_ROOT)
    : WEBSITE_ROOT_DEFAULT;
}

export const SKIP_TOP = new Set([
  "Categories",
  "Dream_Bridal_look_section",
  "Our_story_section",
  "Suits",
]);

export const CATEGORY_NAME = {
  Lehengas: "Lehengas",
  Sarees: "Sarees",
  "Plazo Set": "Palazzo Sets",
  Anarkalis: "Anarkalis",
};

/** Matches import script — excludes duplicate / unused SKUs */
export const SKIP_PATH_SUBSTR = [
  "Plazo Set\\Code-1215",
  "Plazo Set\\Code-1234",
  "Plazo Set\\product1234",
  "Sarees\\Code-1230",
];

export const MEDIA_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm", ".mov"]);
export const VIDEO_EXT = new Set([".mp4", ".webm", ".mov"]);
export const IMG_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export function extOf(p) {
  return path.extname(p).toLowerCase();
}

export function sanitizeSlug(seg) {
  return (
    seg
      .replace(/\\/g, "/")
      .split("/")
      .join("-")
      .replace(/[^\w\d\-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()
      .slice(0, 80) || "item"
  );
}

/** Natural sort filenames (img1, img2, … img10) */
export function natKey(s) {
  return String(s).replace(/\d+/g, (n) => n.padStart(8, "0"));
}

export function shouldSkip(leafAbsRel) {
  const norm = leafAbsRel.split("/").join("\\");
  for (const sub of SKIP_PATH_SUBSTR) {
    if (norm.includes(sub)) return true;
  }
  return false;
}

function isMediaDir(dir) {
  const names = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of names) {
    if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (MEDIA_EXT.has(ext)) return true;
    }
  }
  return false;
}

function findLeafMediaDirs(categoryRootAbs) {
  const out = [];
  function walk(d) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    const subs = [];
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      subs.push(path.join(d, e.name));
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

export function resolveDestCatalogRoot(siteRootAbs) {
  return path.join(siteRootAbs, "public", "media", "catalog");
}

/**
 * Yield one record per leaf product folder that has media under WEBSITE_ROOT.
 * @returns {Iterable<{ categoryName: string, relLeaf: string, leafAbs: string, slug: string, destCat: string }>}
 */
export function* walkWebsiteCatalogLeaves(websiteRoot) {
  if (!fs.existsSync(websiteRoot)) {
    throw new Error("WEBSITE_ROOT missing: " + websiteRoot);
  }

  const topEntries = fs.readdirSync(websiteRoot, { withFileTypes: true });
  for (const te of topEntries) {
    if (!te.isDirectory()) continue;
    if (SKIP_TOP.has(te.name)) continue;
    if (!Object.prototype.hasOwnProperty.call(CATEGORY_NAME, te.name)) continue;

    const categoryName = CATEGORY_NAME[te.name];
    const catRoot = path.join(websiteRoot, te.name);
    const leaves = findLeafMediaDirs(catRoot);

    for (const leafAbs of leaves) {
      const relLeaf = path.relative(websiteRoot, leafAbs);
      if (shouldSkip(relLeaf)) continue;

      const slug = sanitizeSlug(relLeaf);
      const destCat = categoryName.replace(/\s+/g, "_").toLowerCase();
      yield { categoryName, relLeaf, leafAbs, slug, destCat };
    }
  }
}

/**
 * Mirrors one leaf folder → destRoot/<destCat>/<slug>/img001*, vdo001* (same naming as storefront).
 * @returns {{ imageUrls: string[], videoUrl?: string, basenameList: string[], imageSourcePaths: string[] } | null}
 */
export function materializeWebsiteLeafMedia(destCatalogRoot, { leafAbs, slug, destCat }) {
  const destDir = path.join(destCatalogRoot, destCat, slug);
  fs.mkdirSync(destDir, { recursive: true });

  const files = fs
    .readdirSync(leafAbs)
    .map((name) => path.join(leafAbs, name))
    .filter((f) => MEDIA_EXT.has(extOf(f)));

  const imgs = files.filter((f) => IMG_EXT.has(extOf(f))).sort((a, b) => natKey(path.basename(a)).localeCompare(natKey(path.basename(b))));
  const vdos = files.filter((f) => VIDEO_EXT.has(extOf(f))).sort((a, b) => path.basename(a).localeCompare(path.basename(b)));

  if (!imgs.length) return null;

  const imageUrls = [];
  let nv = 0;
  let videoUrl;

  let ni = 0;
  for (const fp of imgs) {
    ni++;
    const ext = extOf(fp) || ".jpg";
    const dest = path.join(destDir, `img${String(ni).padStart(3, "0")}${ext}`);
    fs.copyFileSync(fp, dest);
    imageUrls.push(`/media/catalog/${destCat}/${slug}/img${String(ni).padStart(3, "0")}${ext}`);
  }

  for (const fp of vdos) {
    nv++;
    const ext = extOf(fp) || ".mp4";
    const web = `/media/catalog/${destCat}/${slug}/vdo${String(nv).padStart(3, "0")}${ext}`;
    const dest = path.join(destDir, `vdo${String(nv).padStart(3, "0")}${ext}`);
    fs.copyFileSync(fp, dest);
    if (videoUrl === undefined) videoUrl = web;
  }

  const basenameList = imgs.map((f) => path.basename(f));

  return { imageUrls, videoUrl, basenameList, imageSourcePaths: imgs };
}
