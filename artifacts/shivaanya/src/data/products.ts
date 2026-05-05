// Mock product data for standalone operation (when API is unavailable)

import type { CSSProperties } from "react";
import { importedWebsiteProducts } from "./importedWebsiteProducts";

/** Same URL twice (or duplicate assets) — keep first occurrence only. */
export function dedupeImages(urls: string[]): string[] {
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

function basenameOf(url: string): string {
  const t = url?.trim();
  if (!t) return "";
  const i = Math.max(t.lastIndexOf("/"), t.lastIndexOf("\\"));
  return i >= 0 ? t.slice(i + 1) : t;
}

/** Trailing catalogue frame number from `img006.jpg`-style filenames (digits only after `img`). */
function basenameImgTrailingNum(url: string): number | undefined {
  const b = basenameOf(url).toLowerCase().replace(/\s+/g, "");
  const m = /\bimg[-_]?0*(\d{1,4})\b/i.exec(b);
  if (!m) return undefined;
  const n = parseInt(m[1], 10);
  return Number.isNaN(n) ? undefined : n;
}

function maxCatalogBasenameImgNum(urls: string[]): number {
  let m = 0;
  for (const u of urls) {
    const n = basenameImgTrailingNum(u);
    if (n !== undefined) m = Math.max(m, n);
  }
  return m;
}

/**
 * When `listingHeroImage` is not set, bias toward on-model frames (late runway / WA editorial),
 * not opening sku plates (img001.) or tail pack shots.
 */
function inferListingHeroCandidate(urls: string[]): string | undefined {
  if (!urls?.length) return undefined;
  if (urls.length === 1) return urls[0];

  const total = urls.length;
  const maxImgNum = maxCatalogBasenameImgNum(urls);

  /** Skip this many terminal frames when max is large (layout / polybag). */
  const tailPackSkip = maxImgNum > 18 ? 3 : maxImgNum > 12 ? 2 : maxImgNum > 8 ? 1 : 1;
  const runwayHigh = Math.max(1, maxImgNum - tailPackSkip);
  const runwayLow = Math.max(5, Math.floor(maxImgNum * 0.66));
  const runwayIdeal =
    maxImgNum >= 5 ? Math.min(runwayHigh, Math.max(runwayLow, Math.round((runwayLow + runwayHigh) / 2))) : maxImgNum;

  let bestUrl = urls[0]!;
  let best = -Infinity;

  for (let i = 0; i < urls.length; i++) {
    const u = urls[i]!;
    const full = u.toLowerCase();
    const b = basenameOf(u).toLowerCase();
    const hay = `${b} ${full}`;

    if (/\.mp4(\?|$)/i.test(full)) continue;

    let score = -i * 0.01;

    if (/\bback\b|^.*[\s_-]back\.|rear|booking|booking\s*no|^clg\b|collage|swatch|chart/i.test(hay))
      score -= 90;
    if (/\bfront\b|^.*[\s_-]front\.|frontend/i.test(hay)) score += 55;

    if (/\/img_\d*_wa|^wa\d{3,}|whatsapp/i.test(hay)) score += 45;
    if (/\bmodel\b|\/model_|_model_|\bmiddle\b|^real|^moni\b|_moni_/i.test(hay)) score += 40;

    const isCatalogUrl = full.includes("/media/catalog/");
    const isUserProducts = full.includes("/user-products/");
    const fnNum = basenameImgTrailingNum(u);

    /** Gallery order: importers usually append runway after flats — favour back ~55%.95% of strip (not last pack). */
    if (isCatalogUrl && total >= 6) {
      const t = i / Math.max(1, total - 1);
      if (t < 0.22) score -= 38;
      else if (t < 0.38) score -= 15;
      else if (t >= 0.48 && t <= 0.94) score += 28;
      else if (t > 0.97) score -= 18;
    }

    if (isUserProducts) {
      if (/\/user-products\/[^/]+\/img-0([6-9]|1[0-9])\b/i.test(full)) score += 32;
      else if (/\/user-products\/[^/]+\/img-05\b/i.test(full)) score += 14;
      if (/\/user-products\/[^/]+\/img-0[1-4]\b/i.test(full)) score -= 28;
    } else if (!isCatalogUrl) {
      if (/\/img-05\b/i.test(full)) score += 14;
      if (/\/img-03\b|\/img-04\b|\/img-06\b/i.test(full)) score += 4;
    }

    if (isCatalogUrl && fnNum !== undefined) {
      const microSheet =
        total <= 4 && maxImgNum >= 2 && maxImgNum <= 6 && (total === maxImgNum || total <= maxImgNum + 1);

      if (microSheet) {
        if (fnNum === 1) score -= 44;
        if (total === 2) {
          if (fnNum === 2) score += 30;
          if (fnNum === 1) score -= 32;
        } else if (total === 3 && maxImgNum === 3) {
          if (fnNum === 2) score += 40;
          if (fnNum === 3) score -= 28;
        } else if (total === 4 && maxImgNum === 4) {
          if (fnNum <= 2) score -= 20;
          if (fnNum === 4) score -= 10;
          if (fnNum === 3) score += 18;
        }
      } else if (total >= 5 && maxImgNum >= 5) {
        let drift = Math.abs(fnNum - runwayIdeal);
        if (fnNum <= 4) drift += 14;
        if (fnNum <= 3 && maxImgNum >= 10) drift += 10;
        if (fnNum >= maxImgNum - 1) drift += 8;
        if (fnNum === maxImgNum && maxImgNum >= 12) drift += 12;
        score += 52 - Math.min(drift, 45) * 7;
      } else if (total >= 3 && fnNum === 1) score -= 12;
    } else if (!isCatalogUrl && !isUserProducts) {
      const imgNumLegacy =
        /\bimg[-_]?(\d{3}|\d{2})\b/i.exec(hay) ?? /\bimg(\d+)\b/i.exec(b.replace(/\s+/g, ""));
      if (imgNumLegacy) {
        const n = parseInt(imgNumLegacy[1], 10);
        if (!Number.isNaN(n) && n >= 2 && n <= 18) score += Math.min(9, Math.floor((n / 12) * 9));
      }
      if (/img001\b|^img\s*1\b/i.test(hay)) score -= 6;
    }

    if (/\/1234_model_|\/1236_|mp3_rp_/i.test(full)) score += 8;

    if (score > best) {
      best = score;
      bestUrl = u;
    }
  }

  return bestUrl;
}


/**
 * Listing / card carousel: hero first (explicit `listingHeroImage`, else inferred model-style frame), then remaining gallery URLs in original order (deduped).
 */
export function getListingCardImages(product: {
  listingHeroImage?: string;
  images: string[];
  imageUrl: string;
}): string[] {
  const deduped = dedupeImages(product.images?.length ? product.images : [product.imageUrl]);
  if (!deduped.length) return [product.imageUrl.trim()].filter(Boolean);

  let hero = product.listingHeroImage?.trim();
  if (!hero || !deduped.includes(hero)) {
    hero = inferListingHeroCandidate(deduped) ?? deduped[0]!;
  }

  const rest = deduped.filter((x) => x !== hero);
  return dedupeImages([hero, ...rest]);
}

/**
 * PDP gallery intersect of two shoots that use the same filenames in different folders.
 * Keeps `primary`'s URLs in `primary`'s order; only filenames that appear in BOTH lists qualify.
 */
export function intersectGalleryImages(primary: string[], other: string[]): string[] {
  const otherRoots = new Set(other.map((u) => basenameOf(u)).filter(Boolean));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of primary) {
    const b = basenameOf(u);
    if (!b || !otherRoots.has(b) || seen.has(b)) continue;
    seen.add(b);
    out.push(u);
  }
  return dedupeImages(out);
}

function normalizeProduct(p: Product): Product {
  const base = p.images.length > 0 ? p.images : [p.imageUrl];
  const images = dedupeImages(base);
  const imageUrl = images[0] ?? p.imageUrl;
  return { ...p, images, imageUrl };
}

/**
 * Gallery index order for PDP color swatches when not 1:1 color-to-image aligned:
 * listing hero first (usually on-model), then remaining frames in order — avoids defaulting
 * every variant to low-index slides while still biasing toward early, often model-led shots.
 */
export function preferredSwatchIndexOrder(product: Pick<Product, "images" | "listingHeroImage">): number[] {
  const n = product.images.length;
  const out: number[] = [];
  const add = (i: number) => {
    if (i >= 0 && i < n && !out.includes(i)) out.push(i);
  };
  const hero = product.listingHeroImage?.trim();
  if (hero) {
    const hi = product.images.indexOf(hero);
    if (hi >= 0) {
      add(hi);
      for (let i = 0; i < n; i++) if (i !== hi) add(i);
      return out;
    }
  }
  for (let i = 0; i < n; i++) add(i);
  return out;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  videoUrl?: string;
  /**
   * PDP motion preview: `object-cover` anchor; pairs with `videoBottomClipPct` zoom (see `getProductVideoCropStyle`).
   * When zoom is off and this is unset, framing defaults to `center 50%`.
   */
  videoObjectPosition?: string;
  /**
   * Crop strip from bottom of PDP video (~% of source frame to hide behind overflow via zoom-out crop).
   * 0 disables. Uses scale + overflow (no clip-path) so the player area stays filled with pixels.
   */
  videoBottomClipPct?: number;
  images: string[];
  categoryName: string;
  description: string;
  fabric: string;
  craftRegion?: string;
  colors: string[];
  /** Gallery index per `colors[]` entry (swatch + PDP jump-to-slide). */
  colorImageIndices?: number[];
  /**
   * Parallel to `colors`; each URL must exist in `images`.
   * Prefer full-length or on-model frames for thumbnails; reserve flat lays / tabletop shots for PDP scroll, not swatches (unless no model frame exists).
   */
  colorGalleryImages?: string[];
  /**
   * PDP: when **true** and `colors.length === images.length` (after dedupe), map shade *i* ↔ frame *i*.
   * Use only when each file is genuinely a distinct colourway (aligned filenames).
   */
  parallelColorVariants?: boolean;
  sizes: string[];
  rating: number;
  reviewCount: number;
  isNew: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  story?: string;
  /**
   * Prepended (deduped) as the first image on Shop / home product cards so the default view is on-model.
   * PDP gallery order is unchanged.
   */
  listingHeroImage?: string;
}

/**
 * PDP colour-chip labels derived from catalogue data — avoids fake multi-shade grids on single colourways.
 */
export function resolvedPdpColorLabels(product: Product): string[] {
  const meaningful = product.colors
    .map((c) => c.trim())
    .filter((c) => c && !/^available in/i.test(c));
  if (meaningful.length === 0) return ["As shown"];
  if (meaningful.length === 1) return meaningful;

  const imgs = dedupeImages(product.images.length > 0 ? product.images : [product.imageUrl]);
  const nImg = imgs.length;
  const n = meaningful.length;

  if (product.colorImageIndices?.length === n) return meaningful;

  const galleryHits = (product.colorGalleryImages ?? []).filter((u) => u?.trim());
  if (galleryHits.length === n) return meaningful;

  if (product.parallelColorVariants === true && n >= 2 && n === nImg) return meaningful;

  return ["As pictured"];
}

const PRODUCT_VIDEO_WATERMARK_SCALE_MAX = 1.88;

/**
 * PDP `<video>`: zoom + origin so bottom overlays hide behind `overflow-hidden` parents (fills the gray box).
 * Omit `videoBottomClipPct` or pass 0 to skip zoom and only honour `videoObjectPosition` when provided.
 */
export function getProductVideoCropStyle(product: Pick<Product, "videoBottomClipPct" | "videoObjectPosition">): CSSProperties {
  const raw = product.videoBottomClipPct;
  const bottom = raw === undefined ? 0 : Math.min(50, Math.max(0, raw));

  const posDefault = bottom > 0 ? "center 32%" : "center 50%";
  const pos = product.videoObjectPosition?.trim() || posDefault;

  const scale =
    bottom <= 0 ? 1 : Math.min(PRODUCT_VIDEO_WATERMARK_SCALE_MAX, 100 / Math.max(36, 100 - bottom - 4));

  const percents = pos.match(/\d+(?:\.\d+)?%/g);
  const originY = percents?.length ? percents[percents.length - 1]! : "32%";

  const out: CSSProperties = {
    objectPosition: pos,
  };
  if (scale > 1) {
    out.transform = `scale(${scale})`;
    out.transformOrigin = `center ${originY}`;
  }
  return out;
}

export interface Category {
  id: number;
  name: string;
  imageUrl: string;
  videoUrl?: string;
  /** When set, shifts `object-cover` framing (CSS `object-position`); bias lower to crop dead space above. */
  videoObjectPosition?: string;
  /** Hover scale pivot (`center` emphasizes mid-frame product detail). */
  videoScaleOrigin?: "top" | "bottom" | "center";
  /** Base zoom for category tile video (`object-cover`). Default UI value 1.35. */
  videoCoverScale?: number;
  /** Hover zoom; default adds ~0.1 to base in UI when omitted. */
  videoCoverScaleHover?: number;
  productCount: number;
}

export const mockCategories: Category[] = [
  {
    id: 1,
    name: "Sarees",
    imageUrl: "/media/1239_rani_front.jpg",
    videoUrl: "/media/saree.mp4",
    productCount: 0,
  },
  {
    id: 2,
    name: "Lehengas",
    imageUrl: "/media/img_20260313_wa0920.jpg.jpeg",
    videoUrl: "/media/Lehenga.mp4",
    videoObjectPosition: "center 88%",
    videoScaleOrigin: "bottom",
    productCount: 0,
  },
  {
    id: 3,
    name: "Suits",
    imageUrl: "/media/1234_model_1.jpg",
    videoUrl: "/media/user-products/product2/video-09.mp4",
    videoObjectPosition: "center 50%",
    videoScaleOrigin: "center",
    videoCoverScale: 1.52,
    videoCoverScaleHover: 1.62,
    productCount: 0,
  },
  {
    id: 4,
    name: "Palazzo Sets",
    imageUrl: "/media/catalog/palazzo_sets/plazo-set-product1/img001.jpg",
    videoUrl: "/media/catalog/palazzo_sets/plazo-set-product1/vdo001.mp4",
    videoObjectPosition: "center 42%",
    videoScaleOrigin: "center",
    productCount: 0,
  },
  {
    id: 5,
    name: "Anarkalis",
    imageUrl: "/media/catalog/anarkalis/anarkalis-product1/img001.jpg",
    videoUrl: "/media/catalog/anarkalis/anarkalis-product1/vdo001.mp4",
    videoObjectPosition: "center 40%",
    videoCoverScale: 1.42,
    productCount: 0,
  },
];

function isRedundantImportedProduct(p: Product): boolean {
  const u = `${p.imageUrl || ""} ${(p.images || []).join(" ")}`.toLowerCase();
  /** Same folders as handcrafted `user-products` listings */
  if (u.includes("/anarkalis/anarkalis-product4/")) return true;
  if (u.includes("/lehengas/lehengas-product1/")) return true;
  if (u.includes("/lehengas/lehengas-product2/")) return true;
  if (u.includes("/lehengas/lehengas-product6/")) return true;
  /** Second listing for the same festival crop-top set as `lehengas-product10` */
  if (u.includes("/lehengas/lehengas-product9/")) return true;
  return false;
}

function catalogDirFromImageUrl(imageUrl: string): string | undefined {
  const u = imageUrl.trim().replace(/\\/g, "/");
  const i = u.lastIndexOf("/");
  return i > 0 ? u.slice(0, i + 1) : undefined;
}

/**
 * Shopify-style imports bury runway frames mid / late filenames — set card + PDPBias hero explicitly per folder.
 * `file` basename must exist in scraped `images[]`.
 */
const CATALOG_MODEL_HERO_FILES: readonly { folderNeedle: string; file: string }[] = [
  { folderNeedle: "/lehengas/lehengas-product3/", file: "img007.webp" },
  { folderNeedle: "/lehengas/lehengas-product8/", file: "img001.jpg" },
  { folderNeedle: "/lehengas/lehengas-product4/", file: "img001.jpg" },
  { folderNeedle: "/lehengas/lehengas-product10/", file: "img003.webp" },
  { folderNeedle: "/sarees/sarees-code-1238-price-", file: "img003.jpeg" },
  { folderNeedle: "/anarkalis/anarkalis-product1/", file: "img001.jpg" },
  { folderNeedle: "/lehengas/lehengas-product11/", file: "img003.jpg" },
  { folderNeedle: "/lehengas/lehengas-ram-172-price-", file: "img001.jpeg" },
  { folderNeedle: "/palazzo_sets/plazo-set-product1/", file: "img013.jpg" },
  { folderNeedle: "/palazzo_sets/plazo-set-product2/", file: "img002.jpg" },
  { folderNeedle: "/sarees/sarees-code-1236-price-", file: "img004.jpg" },
  { folderNeedle: "/sarees/sarees-product3/", file: "img002.jpg" },
  { folderNeedle: "/sarees/sarees-product1/", file: "img004.jpg" },
  { folderNeedle: "/sarees/sarees-code-1232-price-", file: "img006.jpeg" },
  { folderNeedle: "/sarees/sarees-product4/", file: "img013.jpg" },
];

function resolveCatalogListingHero(product: Product): Product {
  const imgs = dedupeImages(product.images?.length ? product.images : [product.imageUrl]);
  if (!imgs.some((u) => u.includes("/media/catalog/"))) return product;

  let out = { ...product };

  if (!out.listingHeroImage?.trim()) {
    for (const row of CATALOG_MODEL_HERO_FILES) {
      const sample = imgs.find((u) => u.replace(/\\/g, "/").includes(row.folderNeedle));
      if (!sample) continue;
      const dir = catalogDirFromImageUrl(sample);
      if (!dir) continue;
      const heroAbs = `${dir}${row.file}`;
      if (imgs.includes(heroAbs)) {
        out = { ...out, listingHeroImage: heroAbs };
        break;
      }
    }
  }

  if (!out.listingHeroImage?.trim()) {
    const hero = inferListingHeroCandidate(imgs);
    if (hero) out = { ...out, listingHeroImage: hero };
  }

  return out;
}

/** PDP fixes for scraped imports missing colour grids (swatches ↔ gallery URLs). */
function applyImportedProductOverrides(p: Product): Product {
  let out: Product = { ...p };

  if (out.id === 123 && `${out.imageUrl}${out.images?.join("")}`.includes("ram-102-price")) {
    const baseDir =
      "/media/catalog/sarees/sarees-ram-102-price-2049-20260318t200838z-1-001-ram-102-price-2049/";
    const colorGalleryImages = dedupeImages(
      [2, 4, 6, 8, 10, 12, 14].map((n) => `${baseDir}img${String(n).padStart(3, "0")}.jpeg`),
    );
    const imgs = dedupeImages(out.images?.length ? out.images : [out.imageUrl]);
    const galleryHits = colorGalleryImages.filter((u) => imgs.includes(u));
    out = {
      ...out,
      colors: galleryHits.map((_, i) => `Colour ${i + 1}`),
      colorGalleryImages: galleryHits,
      description: [
        "• Colourways: seven modeled looks for Code Ram-102 — pick a shade chip below to jump to its gallery frame.",
        out.description.trim(),
      ].join("\n"),
    };
  }

  if (`${out.imageUrl}${out.images?.join("")}`.includes("/lehengas/lehengas-ram-172-price")) {
    const imgs = dedupeImages(out.images?.length ? out.images : [out.imageUrl]);
    const dir = catalogDirFromImageUrl(out.imageUrl ?? imgs[0] ?? "") ?? "";
    if (dir && imgs.some((u) => u.includes("lehengas-ram-172-price"))) {
      const candidates = dedupeImages(
        [`${dir}img002.jpeg`, `${dir}img008.jpeg`, `${dir}img013.jpeg`],
      ).filter((u) => imgs.includes(u));
      if (candidates.length === 3) {
        out = {
          ...out,
          colors: ["Shade 1", "Shade 2", "Shade 3"],
          colorGalleryImages: candidates,
          description: [
            "• Colourways (3): tap each chip to jump to that look in the gallery — shades follow carousel order.",
            out.description.trim(),
          ].join("\n"),
        };
      }
    }
  }

  return resolveCatalogListingHero(out);
}

const curatedMockProducts: Product[] = [
  {
    id: 1,
    name: "Shivaanya Wedding Special Set (Product 1)",
    price: 1849,
    originalPrice: 2149,
    imageUrl: "/media/user-products/product1/img-01.webp",
    images: [
      "/media/user-products/product1/img-01.webp",
      "/media/user-products/product1/img-02.webp",
      "/media/user-products/product1/img-03.webp",
      "/media/user-products/product1/img-04.webp",
      "/media/user-products/product1/img-05.webp",
      "/media/user-products/product1/img-06.webp",
      "/media/user-products/product1/img-08.webp",
      "/media/user-products/product1/img-09.webp",
      "/media/user-products/product1/img-10.webp"
    ],
    categoryName: "Lehengas",
    description:
      "A festive-ready wedding lehenga ensemble with elegant drape, rich mirror and thread embroidery, and modern bridal styling. Offered in Rose Pink or White (soft off-white)—the same intricate pattern on both palettes, with Rose Pink from the hero look and White from another gallery pose so swatches reflect each palette.",
    fabric: "Premium Blend Fabric",
    colors: ["Rose Pink", "White"],
    // Swatches: Rose → 2nd gallery frame (not hero img-01); White → on-model img-06 (library match).
    colorGalleryImages: [
      "/media/user-products/product1/img-02.webp",
      "/media/user-products/product1/img-06.webp",
    ],
    sizes: ["M", "L", "XL", "XXL"],
    rating: 4.8,
    reviewCount: 124,
    isNew: true,
    isFeatured: true,
    isBestseller: true,
    story: "Part of the exclusive Shivaanya Collection New Festival Launch, meticulously designed with A-one quality.",
    listingHeroImage: "/media/user-products/product1/img-06.webp",
  },
  {
    id: 2,
    name: "Premium Readymade Lehenga Choli",
    price: 1450,
    originalPrice: 1849,
    imageUrl: "/media/user-products/product2/img-01.webp",
    images: dedupeImages([
      "/media/user-products/product2/img-01.webp",
      "/media/user-products/product2/img-02.webp",
      "/media/user-products/product2/img-03.webp",
      "/media/user-products/product2/img-04.webp",
      "/media/user-products/product2/img-05.webp",
      "/media/user-products/product2/img-06.webp",
      "/media/user-products/product2/img-07.webp",
      "/media/user-products/product2/img-08.webp",
    ]),
    categoryName: "Lehengas",
    description:
      "Premium readymade lehenga choli for wedding and festive wear: full-stitched lehenga and blouse in Pure Simmer Vichitra with Kali pattern stitching, cotton lining, and front-hook blouse. Offered in Purple and Maroon—use the gallery and colour swatches to confirm each shade on screen.",
    fabric: "Pure Simmer Vichitra (lehenga); Position jequard blouse with cotton lining",
    colors: ["Purple", "Maroon"],
    colorGalleryImages: [
      "/media/user-products/product2/img-02.webp",
      "/media/user-products/product2/img-03.webp",
    ],
    sizes: ["M", "L", "XL", "XXL"],
    rating: 4.8,
    reviewCount: 245,
    isNew: true,
    isFeatured: true,
    isBestseller: true,
    story:
      "A stand-out festival launch piece—jewel-tone lehenga palettes and ornate borders for a polished bridal-celebration look.",
    listingHeroImage: "/media/user-products/product2/img-06.webp",
  },
  {
    id: 4,
    name: "Designer Anarkali Suit Launch (Product 4)",
    price: 1599,
    originalPrice: 1999,
    imageUrl: "/media/user-products/product4/img-01.webp",
    videoUrl: "/media/user-products/product4/video-08.mp4",
    videoObjectPosition: "center 40%",
    videoBottomClipPct: 14,
    images: [
      "/media/user-products/product4/img-01.webp",
      "/media/user-products/product4/img-02.webp",
      "/media/user-products/product4/img-03.webp",
      "/media/user-products/product4/img-04.webp",
      "/media/user-products/product4/img-05.webp",
      "/media/user-products/product4/img-06.webp",
      "/media/user-products/product4/img-07.webp"
    ],
    categoryName: "Anarkalis",
    description: "Flowy designer anarkali with graceful flare and festive aesthetics, complemented by live model motion preview.",
    fabric: "Soft Georgette Blend",
    listingHeroImage: "/media/user-products/product4/img-07.webp",
    colors: ["Rani", "Black", "Sky Blue", "Lavender"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    rating: 4.7,
    reviewCount: 92,
    isNew: true,
    isFeatured: false,
    isBestseller: true,
  },
  {
    id: 5,
    name: "Wedding Special Real Modelling Lehenga (Product 5)",
    price: 1720,
    originalPrice: 2099,
    imageUrl: "/media/user-products/product5/img-01.webp",
    images: [
      "/media/user-products/product5/img-01.webp",
      "/media/user-products/product5/img-02.webp",
      "/media/user-products/product5/img-03.webp",
      "/media/user-products/product5/img-04.webp",
      "/media/user-products/product5/img-05.webp",
      "/media/user-products/product5/img-06.webp",
      "/media/user-products/product5/img-07.webp",
      "/media/user-products/product5/img-08.webp",
      "/media/user-products/product5/img-09.webp",
      "/media/user-products/product5/img-10.webp",
      "/media/user-products/product5/img-11.webp",
      "/media/user-products/product5/img-12.webp"
    ],
    categoryName: "Lehengas",
    description:
      "Wedding-special lehenga set with coordinated blouse and drape pieces — full flare silhouette and ornate detailing for bridal and festive wear. Gallery showcases real modelling in two colour stories (mauve / dusty rose and deep maroon); use the carousel and swatches to preview each look.",
    fabric: "Jacquard & simar silk blend",
    listingHeroImage: "/media/user-products/product5/img-08.webp",
    colors: ["Mauve", "Maroon"],
    colorGalleryImages: [
      "/media/user-products/product5/img-03.webp",
      "/media/user-products/product5/img-09.webp",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    rating: 4.9,
    reviewCount: 201,
    isNew: true,
    isFeatured: true,
    isBestseller: true,
  },
  // Canonical: former id 8 (Compact Festive Set) merged — redirect /product/8 → /product/6
  {
    id: 6,
    name: "Ri8 Fashion Flame Collection · Compact Festive Set",
    price: 1649,
    originalPrice: 1999,
    imageUrl: "/media/user-products/product6/img-01.webp",
    videoUrl: "/media/user-products/product6/video-08.mp4",
    videoObjectPosition: "center 24%",
    videoBottomClipPct: 32,
    images: intersectGalleryImages(
      [
        "/media/user-products/product6/img-01.webp",
        "/media/user-products/product6/img-02.webp",
        "/media/user-products/product6/img-03.webp",
        "/media/user-products/product6/img-04.webp",
        "/media/user-products/product6/img-05.webp",
        "/media/user-products/product6/img-06.webp",
        "/media/user-products/product6/img-07.webp",
        "/media/user-products/product6/img-09.webp",
      ],
      [
        "/media/user-products/product8/img-01.webp",
        "/media/user-products/product8/img-02.webp",
        "/media/user-products/product8/img-03.webp",
        "/media/user-products/product8/img-04.webp",
      ]
    ),
    categoryName: "Lehengas",
    description:
      "Single listing for the Flame / Compact Festive silhouette (previously duplicated under Lehengas and Suits). This piece is offered in one colourway (black) with a compact intersected gallery from both prior listings.",
    fabric: "Designer Net + Lining",
    listingHeroImage: "/media/user-products/product6/img-03.webp",
    colors: ["Black"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    rating: 4.6,
    reviewCount: 129,
    isNew: false,
    isFeatured: false,
    isBestseller: false,
  },
  {
    id: 7,
    name: "Modern Ethnic Collection (Product 7)",
    price: 1599,
    originalPrice: 1899,
    imageUrl: "/media/1234_model_1.jpg",
    videoUrl: "/media/1234_model_vdo_1_.mp4",
    videoObjectPosition: "center 40%",
    videoBottomClipPct: 14,
    images: [
      "/media/1234_model_1.jpg",
      "/media/1234_model_2.jpg",
      "/media/1234_model_3.jpg",
      "/media/1234_model_4.jpg"
    ],
    categoryName: "Suits",
    description: "Contemporary ethnic set with mirror-inspired detailing, crafted for festive parties and wedding functions.",
    fabric: "Soft Chinon",
    colors: ["Olive", "Black", "Hot Pink", "Lavender"],
    sizes: ["S", "M", "L", "XL", "XXL", "3XL"],
    rating: 4.9,
    reviewCount: 312,
    isNew: true,
    isFeatured: true,
    isBestseller: true,
  },
  {
    id: 9,
    name: "Aliya Cut Real Mirror Work Palazzo Set (1215)",
    price: 1299,
    imageUrl: "/media/1215_baby_pink.jpeg",
    categoryName: "Palazzo Sets",
    images: [
      "/media/1215_baby_pink.jpeg",
      "/media/1215_black.jpg",
      "/media/1215_hot_pink.jpeg",
      "/media/1215_maroon.jpeg",
      "/media/1215_levender.jpeg",
      "/media/1215_red.jpeg"
    ],
    description: "Command attention in this spectacular Aliya cut kediya-style Palazzo set. It showcases a soft Chinon top embellished with stunning coding and real mirror work around the neck, matched with a luxurious 3-meter flair. Paired with a premium full-flare soft Chinon palazzo and a gorgeous fancy lacework dupatta for an effortlessly chic look. Comes with an extra mirror pouch.",
    fabric: "Soft Chinon & High Quality Cotton",
    colors: ["Baby Pink", "Black", "Hot Pink", "Maroon", "Lavender", "Red"],
    parallelColorVariants: true,
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
    rating: 4.8,
    reviewCount: 198,
    isNew: true,
    isFeatured: true,
    isBestseller: true,
  },
  {
    id: 10,
    name: "Pure Chinnon Silk Ajarakh Print Saree (Kedar 1234)",
    price: 1699,
    imageUrl: "/media/mp3_rp_orange_1.jpg",
    images: [
      "/media/mp3_rp_orange_1.jpg",
      "/media/mp3_rp_purple_1.jpg",
      "/media/mp3_rp_rani_1.jpg",
      "/media/mp3_rp_red_1.jpg"
    ],
    categoryName: "Sarees",
    description: "Draping pure luxury with this soft marshmallow shiny Chinnon silk saree enriched by designer Ajarakh print patterns. It boasts fancy Aari Zari and real mirror work, adding an exquisite dimension, and comes neatly paired with a stylish printed blouse featuring charming piping and heavy latkans.",
    fabric: "Pure Chinnon Silk",
    colors: ["Orange", "Purple", "Rani", "Red"],
    parallelColorVariants: true,
    sizes: ["Free Size (Saree)"],
    rating: 4.7,
    reviewCount: 76,
    isNew: true,
    isFeatured: false,
    isBestseller: false,
  },
];

export const mockProducts: Product[] = [
  ...curatedMockProducts,
  ...importedWebsiteProducts
    .filter((p) => !isRedundantImportedProduct(p))
    .map(applyImportedProductOverrides),
].map(normalizeProduct);

function syncMockCategoryCounts() {
  for (const cat of mockCategories) {
    cat.productCount = mockProducts.filter((p) => p.categoryName === cat.name).length;
  }
}
syncMockCategoryCounts();

// Helper to get product by ID
export function getProductById(id: number): Product | undefined {
  const p = mockProducts.find((x) => x.id === id);
  return p ? normalizeProduct(p) : undefined;
}

// Helper to get filtered products
export function getFilteredProducts(opts?: { category?: string; search?: string; featured?: boolean; isNew?: boolean }): Product[] {
  let filtered = [...mockProducts].map(normalizeProduct);
  
  if (opts?.category) {
    filtered = filtered.filter(p => p.categoryName === opts.category);
  }
  if (opts?.search) {
    const q = opts.search.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
      p.categoryName.toLowerCase().includes(q)
    );
  }
  if (opts?.featured) {
    filtered = filtered.filter(p => p.isFeatured);
  }
  if (opts?.isNew) {
    filtered = filtered.filter(p => p.isNew);
  }
  
  return filtered;
}