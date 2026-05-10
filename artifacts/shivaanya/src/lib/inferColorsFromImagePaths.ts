/**
 * Derive PDP colour labels from image URLs when filenames encode shades (not from guessing).
 * Full pixel-accurate naming still needs manual review for bare `img001` galleries.
 */

import type { Product } from "@/data/products";

function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const u = raw?.trim();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

/** Basename only (no query string). */
export function basenameOf(url: string): string {
  const t = url?.trim();
  if (!t) return "";
  const noQuery = t.split("?")[0] ?? t;
  const i = Math.max(noQuery.lastIndexOf("/"), noQuery.lastIndexOf("\\"));
  return i >= 0 ? noQuery.slice(i + 1) : noQuery;
}

/** Generic catalogue frame names with no encoded shade (img001, img-02, …). */
function isBareGalleryBasename(url: string): boolean {
  const n = stripExt(basenameOf(url)).replace(/\s+/g, "");
  if (/^img[-_]?\d{1,4}$/i.test(n)) return true;
  if (/^img\d{3,}$/i.test(n)) return true;
  return false;
}

const TOKEN_TO_LABEL: Record<string, string> = {
  baby_pink: "Baby Pink",
  babypink: "Baby Pink",
  hot_pink: "Hot Pink",
  hotpink: "Hot Pink",
  levender: "Lavender",
  lavender: "Lavender",
  maroon: "Maroon",
  marron: "Maroon",
  rani: "Rani",
  wine: "Wine",
  orange: "Orange",
  purple: "Purple",
  red: "Red",
  black: "Black",
  white: "White",
  cream: "Cream",
  sky_blue: "Sky Blue",
  skyblue: "Sky Blue",
  royal_blue: "Royal Blue",
  royalblue: "Royal Blue",
  bottel_green: "Bottle Green",
  bottle_green: "Bottle Green",
  bottlegreen: "Bottle Green",
  fanta: "Fanta",
  yellow: "Yellow",
  olive: "Olive",
  mauve: "Mauve",
  rose: "Rose Pink",
  rose_pink: "Rose Pink",
  navy: "Navy Blue",
  peach: "Peach",
  mint: "Mint",
  gold: "Gold",
  mehandi: "Mehendi Green",
  mehndi: "Mehendi Green",
};

function titleCaseWords(s: string): string {
  return s
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Best-effort shade from a single asset path (tokens in filename / folder).
 */
export function shadeLabelFromImageUrl(url: string): string | null {
  const path = url.replace(/\\/g, "/").toLowerCase();
  const base = stripExt(basenameOf(url)).replace(/\s+/g, "_").toLowerCase();

  // e.g. 1215_baby_pink.jpeg, 714_black.jpg
  const mNumToken = /^(\d+)_([a-z_]+)$/i.exec(base);
  if (mNumToken?.[2]) {
    const key = mNumToken[2].toLowerCase();
    if (TOKEN_TO_LABEL[key]) return TOKEN_TO_LABEL[key];
    return titleCaseWords(mNumToken[2].replace(/_/g, " "));
  }

  // mp3_rp_orange_1.jpg
  const mMp = /mp3_rp_([a-z]+)/i.exec(base);
  if (mMp?.[1]) {
    const key = mMp[1].toLowerCase();
    if (TOKEN_TO_LABEL[key]) return TOKEN_TO_LABEL[key];
    return titleCaseWords(mMp[1]);
  }

  // Folder or file contains CODE #### SHADE (e.g. ...1238 RANI FRONT...)
  const codeShade = /(?:^|[/_])code[\s_-]*\d+[\s_-]+([a-z]{3,})(?:[\s_-]+(?:front|back|moni|real|model))?/i.exec(
    path.replace(/\.[a-z]+$/i, ""),
  );
  if (codeShade?.[1]) {
    const raw = codeShade[1].toLowerCase();
    if (TOKEN_TO_LABEL[raw]) return TOKEN_TO_LABEL[raw];
    return titleCaseWords(codeShade[1]);
  }

  // Ram-102 MAROON style
  const ram = /ram[_-]\d+[_-]?([a-z]{3,})/i.exec(path);
  if (ram?.[1]) {
    const key = ram[1].toLowerCase();
    if (TOKEN_TO_LABEL[key]) return TOKEN_TO_LABEL[key];
    return titleCaseWords(ram[1]);
  }

  // Underscore tokens in basename: pick longest known token
  const parts = base.split(/[^a-z0-9]+/).filter((p) => p.length >= 3 && !/^img\d+$/i.test(p));
  for (const p of [...parts].reverse()) {
    const key = p.toLowerCase();
    if (TOKEN_TO_LABEL[key]) return TOKEN_TO_LABEL[key];
  }

  return null;
}

/**
 * Refines imported catalogue rows: use filename-derived shades when possible;
 * otherwise remove bogus multi-colour lists on bare img-only galleries.
 */
export function refineImportedProductColors(product: Product): Product {
  const imgs = dedupeUrls(product.images?.length ? product.images : [product.imageUrl]);
  if (imgs.length === 0) return product;

  const perFrame = imgs.map((u) => shadeLabelFromImageUrl(u));
  const bareOnly = imgs.every((u) => isBareGalleryBasename(u));
  const anyFilenameShade = perFrame.some((s) => s !== null);

  // Every frame resolved to a shade → align parallel variant lists
  if (perFrame.every((s): s is string => s !== null)) {
    return {
      ...product,
      colors: perFrame,
      parallelColorVariants: perFrame.length >= 2 && perFrame.length === imgs.length,
      colorImageIndices: undefined,
      colorGalleryImages: undefined,
    };
  }

  // First occurrence of each shade (model shots mixed with flats)
  const seen = new Map<string, number>();
  for (let i = 0; i < perFrame.length; i++) {
    const s = perFrame[i];
    if (!s) continue;
    if (!seen.has(s)) seen.set(s, i);
  }
  if (seen.size >= 2) {
    const colors = [...seen.keys()];
    const colorImageIndices = colors.map((c) => seen.get(c)!);
    return {
      ...product,
      colors,
      colorImageIndices,
      parallelColorVariants: false,
      colorGalleryImages: colors.map((c) => imgs[seen.get(c)!]!),
    };
  }

  // Generic img### galleries with no shade tokens → drop importer-invented multi-colour lists.
  if (bareOnly && product.colors.length > 1 && !product.parallelColorVariants && !anyFilenameShade) {
    return {
      ...product,
      colors: ["As shown"],
      colorImageIndices: undefined,
      colorGalleryImages: undefined,
      parallelColorVariants: false,
    };
  }

  return product;
}
