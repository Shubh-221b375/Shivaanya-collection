/**
 * Scan SHIVAANYA_COLLECTION_WEBSITE for leaf folders with images/videos.
 * Copies files with URL-safe names into public/media/catalog/...
 * Writes src/data/importedWebsiteProducts.ts (exported array only).
 *
 * For S3 uploads without regenerating TS, use: npm run catalog:sync
 *
 * Usage (from artifacts/shivaanya): npm run catalog:import
 */

import fs from "node:fs";
import path from "node:path";
import {
  materializeWebsiteLeafMedia,
  resolveWebsiteRoot,
  walkWebsiteCatalogLeaves,
} from "./lib/website-catalog-sync.mjs";

const SITE_ROOT = path.resolve(import.meta.dirname, "..");
const DEST_ROOT = path.join(SITE_ROOT, "public", "media", "catalog");
const OUT_FILE = path.join(SITE_ROOT, "src", "data", "importedWebsiteProducts.ts");

function numericFromPath(p) {
  const hay = String(p);
  const m =
    /\bprice\s*-?\s*(\d{3,5})\b/i.exec(hay) ||
    /\(\s*price\s*-?\s*(\d{3,5})/i.exec(hay);
  return m ? parseInt(m[1], 10) : undefined;
}

function derivePrice(relLeaf, basenames, descRaw) {
  const fromRel = numericFromPath(relLeaf);
  if (fromRel) return fromRel;
  for (const b of basenames.slice(0, 8)) {
    const n = numericFromPath(b);
    if (n) return n;
  }
  const dr = descRaw || "";
  const fromDesc = numericFromPath(dr);
  if (fromDesc) return fromDesc;
  const flex = /\b(?:rate|price)\s*[:-]+\s*(\d{3,5})/i.exec(dr);
  if (flex) return parseInt(flex[1], 10);
  const m =
    /\b(?:rate|price)\s*[:\-]?\s*(\d{3,5})\s*(?:\/-)?\s*(?:inr)?\b/i.exec(dr) ||
    /₹\s*(\d{3,5})/.exec(dr);
  return m ? parseInt(m[1], 10) : 0;
}

function hashSlug(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function readDescription(leafDir) {
  const candidates = [];
  try {
    for (const name of fs.readdirSync(leafDir)) {
      if (/^description$/i.test(name) || /^description\.txt$/i.test(name) || /^Description$/i.test(name)) {
        candidates.push(path.join(leafDir, name));
      }
    }
  } catch {
    return "";
  }
  if (!candidates.length) return "";
  candidates.sort((a, b) => a.length - b.length);
  try {
    return fs.readFileSync(candidates[0], "utf8");
  } catch {
    return "";
  }
}

/** Per-line emoji / markdown strip (keeps newlines in callers). */
function stripEmojiMarksLine(s) {
  return String(s)
    .normalize("NFKD")
    .replace(/\p{Extended_Pictographic}/gu, " ")
    .replace(/\*{1,3}/g, "")
    .replace(/[_~]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Preserve line breaks so Blouse/Lehenga style blocks survive. */
function scrubCaptionLinesForRetail(raw) {
  return String(raw)
    .split(/\r?\n/)
    .flatMap((l) => stripEmojiMarksLine(l).split(/\s+[•\*]\s+/).map((x) => x.trim()))
    .filter((line) => {
      if (line.length < 4) return false;
      const low = line.toLowerCase();
      if (/^👉|^⚖/.test(line)) return false;
      if (/\bone level up\b|a one quality\b|prime quality product just\b/.test(low)) return false;
      if (/\bloves\b.*\binspiration\b/.test(low)) return false;
      if (/^d\.?\s*name\b/i.test(low)) return false;
      if (/\b(booking|whatsapp|dm|contact)\b/i.test(low) && /\d/.test(line)) return false;
      if (/\b\d{10}\b/.test(line)) return false;
      if (/\brate\b[^\n]{0,40}\d{3,5}|\bmrp\b[^\n]{0,20}\d{3,5}|^\s*price\s*[:-]+\s*\d|(?:^|\s)price[^\n]{0,40}\d{3,5}|₹\s*\d{3,5}|\d+\s*[/-]\s*(?:inr|rs|only)\b/i.test(low))
        return false;
      return true;
    });
}

function cleanupRetailCopy(s) {
  return String(s)
    .replace(/\bmarshmellow\b/gi, "marshmallow")
    .replace(/\bthred\b/gi, "thread")
    .replace(/\bmodll?ing\b/gi, "modelling")
    .replace(/\bsobber\b/gi, "sober")
    .replace(/\bbottel\b/gi, "bottle");
}

function capSentence(s) {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** PDP copy: Flipkart-style bullet-only lines (plus a short imagery disclaimer bullet). */
function toMarketplaceDescription(raw, categoryName, skuLabel) {
  const cat = categoryName.trim() || "Ensemble";
  const DISCLAIMER =
    "Colour / finish may look slightly different on your screen — use carousel images as the guide for shade and motifs.";

  function bulletBlock(strings) {
    return cleanupRetailCopy(strings.filter(Boolean).map((s) => `• ${s}`).join("\n")).trim();
  }

  const genericFillers = [
    `Premium ${cat.toLowerCase()} from Shivaanya Collection.`,
    `${skuLabel} — see gallery photos for blouse, drape layout, and work detail.`,
    "Contact customer care for measurements / sizing.",
    DISCLAIMER,
  ];

  const knownLabelPrefix =
    /^(fabric|inner|lining|outer|work|blouse|lehenga|dupatta|pant|saree|jacket|kurti|choli|cups|flair|size|length|weight)\b/im;

  if (!raw || !String(raw).trim()) return bulletBlock(genericFillers);

  const kvRe = /^([A-Za-z][A-Za-z0-9 &\/.'%-]{1,54})\s*[:-]+\s*(.+)$/u;

  function addFact(bucket, seenSet, text) {
    let t = text.replace(/^[\s•*-]+/, "").trim();
    t = capSentence(t.replace(/\s+[:-]+$/, ""));
    if (t.length < 12 || t.length > 268) return;
    const nk = t.toLowerCase().replace(/^[^:]+:\s+/, "").replace(/\s+/g, " ").slice(0, 120);
    if (!nk || seenSet.has(nk)) return;
    seenSet.add(nk);
    bucket.push(t);
  }

  const lines = scrubCaptionLinesForRetail(raw);
  if (!lines.length) return bulletBlock(genericFillers);

  const candidates = [];
  const seenNorm = new Set();

  for (let rawLine of lines) {
    let line = stripEmojiMarksLine(rawLine).replace(/\s*[:-]+\s*$/, "").trim();
    if (line.length < 4) continue;

    const trimmedForKv = line
      .replace(/^([A-Za-z][\w\s]+?)\*\s*-+\s*/, "$1: ")
      .replace(/^([A-Za-z][\w\s]+)-\*\s+/i, "$1: ")
      .replace(/\bInner\s*-\s*\*/gi, "Inner:");

    const lm = kvRe.exec(trimmedForKv);
    if (lm && lm[2].trim().length > 2) {
      const labelRaw = lm[1].trim();
      const label = knownLabelPrefix.test(`${labelRaw}:`)
        ? capSentence(labelRaw.toLowerCase().replace(/\s+:+\s*$/, ""))
        : capSentence(labelRaw.charAt(0).toUpperCase() + labelRaw.slice(1).toLowerCase());
      addFact(candidates, seenNorm, `${label}: ${capSentence(lm[2].trim())}`);
      continue;
    }

    const clauses = trimmedForKv.split(/\s+along\s+with\s+|,\s*along\s+with\s+|,\s+|;\s+/i).filter(Boolean);
    const minClause = clauses.length > 1 ? 8 : 12;
    for (const clause of clauses) {
      const c = stripEmojiMarksLine(clause).trim();
      if (c.length < minClause) continue;
      const lowClause = c.toLowerCase();

      /** Long prose saree/lehenga captions */
      if (/\bfabric\b/i.test(c) && /\b(prin|embro|zar|mirror|motif)\b/i.test(c) === false && c.length > 40) {
        addFact(candidates, seenNorm, `Fabric: ${capSentence(c.replace(/\bfabric\b/i, "").trim())}`);
      } else if (/^soft\s|^pure\s|^premium\s|^designer\s/i.test(c) && /\b(silk|chinon|georgette|cotton)\b/i.test(lowClause)) {
        addFact(candidates, seenNorm, `Fabric: ${capSentence(c)}`);
      } else addFact(candidates, seenNorm, capSentence(c));
      if (candidates.length > 14) break;
    }
    if (candidates.length > 14) break;
  }

  let bullets = candidates.slice(0, 14).map((b) => b.replace(/\uFE0F/g, "").trim());

  bullets = bullets.filter((b) => {
    if (/[\u0900-\u097F]/.test(b)) return false;
    const low = b.toLowerCase();
    if (/\breal modell?ing product\b|\bnew premium launch\b|\bready to dispatch\b|^big flair\s*\d|^one level up$/.test(low))
      return false;
    if (/^\s*festival special crop top\b/i.test(b) && !/:/.test(b)) return false;
    if (/^shivaanya collection\b/i.test(low) && b.length < 78 && !/:/.test(b)) return false;
    if (/^(saree|blouse|lehenga) details\b$/i.test(b)) return false;
    return true;
  });

  bullets = bullets.slice(0, 12);

  const outLines = [];
  const lineSeen = new Set();
  function pushLine(text) {
    const t = cleanupRetailCopy(text.replace(/\uFE0F/g, "").replace(/\s+/g, " ").trim());
    const key = t.toLowerCase().slice(0, 140);
    if (t.length < 10 || lineSeen.has(key)) return;
    lineSeen.add(key);
    outLines.push(t);
  }

  for (const b of bullets) {
    pushLine(b);
    if (outLines.length >= 13) break;
  }

  if (outLines.length === 0) {
    genericFillers.forEach(pushLine);
  } else {
    pushLine(DISCLAIMER);
  }

  const body = bulletBlock(outLines.slice(0, 14));
  return body.trim();
}

const STOPWORDS = new Set([
  "",
  "clg",
  "back",
  "front",
  "real",
  "model",
  "vdo",
  "id",
  "pic",
  "jpeg",
  "jpg",
  "wa",
]);

function basenameNoExt(fn) {
  return path.basename(fn).replace(/\.[^.]+$/, "");
}

/**
 * PDP swatch URL ↔️ colour labels: aligns `colors[]` with gallery frames whose filenames encode the shade
 * (e.g. CODE SHADE BACK/FRONT, or 1238 RANI.JPEG), skipping collage files (CLG), preferring FRONT shots.
 */
function deriveColorImageIndices(imgsSorted, colorTitles, code /** number string or undefined */) {
  const titles = (colorTitles || []).map((t) => String(t).trim()).filter(Boolean);
  if (titles.length < 2 || titles.some((t) => /^as shown$/i.test(t))) return undefined;
  const basenames = imgsSorted.map((p) => basenameNoExt(p));
  /** Only generic numbering — cannot infer reliably */
  if (basenames.every((b) => /^img\s*\d+$/i.test(b.replace(/\s+/g, "")))) return undefined;

  const codeRe = code ? new RegExp(`^\\s*${code}\\s+`, "i") : null;

  function preprocessBase(bare) {
    let s = String(bare)
      .replace(/^IMG-\d+-WA\d+-/i, "")
      .replace(/^VID-/i, "")
      .replace(/_/g, " ")
      .replace(/\./g, " ");
    if (codeRe) s = s.replace(codeRe, "").trim();
    return s.normalize("NFKD").toLowerCase();
  }

  function colorKeywords(title) {
    let n = title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/\b(bottel|bottle)\b/gi, "bottle")
      .replace(/\b(baby)\s+pink\b/gi, "baby pink")
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const parts = n.split(/\s+/).filter((w) => w.length >= 2 || /^rani$/i.test(w) || /^red$/i.test(w));
    /** drop generic words that appear in filenames for every shot */
    return parts.filter((w) => !/^(pure|semi|heavy|beautiful|exclusive)$/i.test(w));
  }

  const indices = [];
  const taken = new Set();

  for (const title of titles) {
    const kws = colorKeywords(title);
    if (!kws.length) return undefined;

    let bestIx = -1;
    let bestScore = -Infinity;

    for (let ix = 0; ix < basenames.length; ix++) {
      if (taken.has(ix)) continue;
      let bnRaw = preprocessBase(basenames[ix]);

      /** Collage thumbnails — skip for swatches */
      const isClgShot = bnRaw === "clg" || bnRaw.startsWith("clg ") || bnRaw.endsWith(" clg") || /\sclg\s/.test(` ${bnRaw} `);
      if (isClgShot) continue;

      if (!kws.every((kw) => bnRaw.includes(kw))) continue;

      let score = kws.reduce((acc, kw) => acc + Math.min(10, kw.length), 0);
      if (/\bfront\b/.test(bnRaw)) score += 80;
      if (/\bback\b/.test(bnRaw)) score += 20;
      score -= ix * 0.001;

      if (score > bestScore) {
        bestScore = score;
        bestIx = ix;
      }
    }

    /** Single-token fallback — longest discriminating keyword only */
    if (bestIx < 0 && kws.length > 0) {
      const ordered = [...kws].sort((a, b) => b.length - a.length);
      for (const kw of ordered) {
        let hit = -1;
        let bestS = -Infinity;
        for (let ix = 0; ix < basenames.length; ix++) {
          if (taken.has(ix)) continue;
          const bn = preprocessBase(basenames[ix]);
          if (/^clg\b/.test(bn)) continue;
          if (!bn.includes(kw)) continue;
          let score = /\bfront\b/.test(bn) ? 50 : /\bback\b/.test(bn) ? 20 : 5;
          if (score > bestS) {
            bestS = score;
            hit = ix;
          }
        }
        if (hit >= 0) {
          bestIx = hit;
          break;
        }
      }
    }

    if (bestIx < 0) return undefined;

    indices.push(bestIx);
    taken.add(bestIx);
  }

  return indices.length === titles.length ? indices : undefined;
}

function guessColors(imagePaths, codePrefix /** e.g. 1239 */) {
  const colors = [];
  const reCode = codePrefix ? new RegExp("^" + codePrefix + "\\s+", "i") : null;
  for (const p of imagePaths.slice(0, 120)) {
    const bare = basenameNoExt(p);
    if (/^img\d+$/i.test(bare.replace(/\s+/g, ""))) continue;
    if (/^booking\s+no\b/i.test(bare)) continue;
    let base = bare.replace(/^IMG-\d+-WA\d+-/i, "").replace(/^VID-/i, "");
    if (reCode) base = base.replace(reCode, "");
    if (/^MP3\s+/i.test(base)) {
      const m = /^MP3\s+RP\s+/i.exec(base);
      base = base.replace(/^MP3\s+RP\s+/i, "");
      base = base.replace(/^MP3\s+/i, "");
    }
    const parts = base
      .split(/[\s_\-]+/)
      .map((s) => s.replace(/\d+/g, "").trim())
      .filter(Boolean);
    // last meaningful token cluster often shade name before BACK/FRONT
    let shade = "";
    for (let i = parts.length - 1; i >= 0; i--) {
      const w = parts[i].replace(/[^\w]/g, "");
      if (!w || STOPWORDS.has(w.toLowerCase())) continue;
      shade = parts.slice(0, i + 1).join(" ");
      break;
    }
    if (!shade) continue;
    const title = shade
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
    if (title.length > 22 || /\b(img|wa\.jpg|booking|videoweb|webp)\b/i.test(title)) continue;
    if (!colors.includes(title)) colors.push(title);
  }
  return colors.slice(0, 16);
}

function extractCodeFromPath(rel) {
  const s = rel.replace(/\\/g, "/");
  const m =
    /Code\s*-\s*(\d+)/i.exec(s) ||
    /Ram-\s*(\d+)/i.exec(s) ||
    /(\d{4})\s+(?:REAL|MODEL|MONI)/i.exec(s);
  return m ? m[1] : undefined;
}

function buildProductTitle(categoryName, rel, slug) {
  const code = extractCodeFromPath(rel.replace(/\\/g, "/"));
  const lower = slug.toLowerCase();
  const productTail = lower.match(/\b(product\d+)\b$/);
  if (code && !productTail) return `Code ${code} · ${categoryName} · Shivaanya Collection`;
  if (productTail) return `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} · ${productTail[1]} · Shivaanya Collection`;
  const bits = slug.split("-").slice(-4).filter(Boolean).join(" ");
  return `${categoryName} · ${bits || slug}`.replace(/\s+/g, " ").trim();
}

function copyAndBuild() {
  const WEBSITE_ROOT = resolveWebsiteRoot();
  if (!fs.existsSync(WEBSITE_ROOT)) throw new Error("WEBSITE_ROOT missing: " + WEBSITE_ROOT);

  const products = [];
  let nextId = parseInt(process.env.IMPORT_PRODUCT_ID_START || "100", 10);

  for (const leaf of walkWebsiteCatalogLeaves(WEBSITE_ROOT)) {
    const media = materializeWebsiteLeafMedia(DEST_ROOT, leaf);
    if (!media) continue;

    const { imageUrls, videoUrl, basenameList, imageSourcePaths: imgs } = media;
    const { relLeaf, categoryName, slug, leafAbs } = leaf;

    const descRaw = readDescription(leafAbs);
    const price = derivePrice(relLeaf + path.sep + basenameList.join("|"), basenameList, descRaw);
    const title = buildProductTitle(categoryName, relLeaf, slug);
    const code = extractCodeFromPath(relLeaf);
    const inferred = guessColors(imgs, code);
    const colors = inferred.length ? inferred : ["As shown"];
    const colorImageIndices =
      deriveColorImageIndices(imgs, colors, code) ?? deriveColorImageIndices(imgs, colors, undefined);

    const description = toMarketplaceDescription(descRaw, categoryName, title);

    const id = nextId++;

    const productRow = {
      id,
      name: title,
      price,
      originalPrice: price > 0 ? Math.round(price * 1.06) + 49 : undefined,
      imageUrl: imageUrls[0],
      videoUrl,
      videoObjectPosition: videoUrl ? "center 38%" : undefined,
      videoBottomClipPct: videoUrl ? 18 : undefined,
      images: imageUrls,
      categoryName,
      description,
      fabric:
        categoryName === "Sarees"
          ? "Designer drape fabrication with luxury finish"
          : categoryName === "Lehengas"
            ? "Occasion-ready skirt and blouse materials with artisan finishing"
            : categoryName === "Palazzo Sets"
              ? "Soft flowing suit fabric with ornate accents"
              : "Lightweight breathable suit textiles with ornate detailing",
      colors,
      sizes: categoryName === "Sarees" ? ["Free Size (Saree)"] : ["S", "M", "L", "XL", "XXL"],
      rating: Number((4.45 + ((hashSlug(slug) % 40) / 100)).toFixed(1)),
      reviewCount: 40 + (hashSlug(slug) % 260),
      isNew: false,
      isFeatured: hashSlug(slug + "feat") % 5 === 0,
      isBestseller: hashSlug(slug + "best") % 7 === 0,
    };

    if (colorImageIndices && colorImageIndices.length === colors.length) {
      productRow.colorImageIndices = colorImageIndices;
    }

    products.push(productRow);
  }

  const ts =
    "// AUTO-GENERATED by scripts/import-website-products.mjs — do not hand-edit.\n\n" +
    'import type { Product } from "./products";\n\n' +
    "export const importedWebsiteProducts = " +
    JSON.stringify(products, null, 2) +
    " as unknown as Product[];\n";

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, ts, "utf8");

  console.log("Wrote", products.length, "products to", OUT_FILE);
  console.log("Copied assets under", DEST_ROOT);
}

copyAndBuild();
