/**
 * June 2026 catalog — media materialized from repo-root Code-* folders via
 * `npm run catalog:publish-june2026 -- --local-only` (runs automatically before build).
 */

import type { Product } from "./products";

const DISCLAIMER =
  "Colour / finish may look slightly different on your screen — use carousel images as the guide for shade and motifs.";

type Seed = {
  id: number;
  productCode: string;
  displayCode: string;
  name: string;
  categoryName: Product["categoryName"];
  categoryFolder: string;
  slug: string;
  price: number;
  fabric: string;
  description: string;
  images: string[];
  videoUrl?: string;
  colors: string[];
  colorImageIndices?: number[];
  sizes: string[];
};

function dir(cat: string, slug: string) {
  return `/media/catalog/${cat}/${slug}`;
}

/** Image paths match output of scripts/publish-june2026-catalog.mjs */
const SEEDS: Seed[] = [
  {
    id: 127,
    productCode: "Code-DF 1199P-20260613T070554Z-3-001",
    displayCode: "DF 1199P",
    name: "DF 1199P · Bollywood Sequins Saree · Shivaanya Collection",
    categoryName: "Sarees",
    categoryFolder: "sarees",
    slug: "sarees-code-df-1199p-20260613t070554z-3-001",
    price: 1199,
    fabric: "Heavy faux georgette with 5mm sequins and multi embroidery",
    description: [
      "• Product code: Code-DF 1199P-20260613T070554Z-3-001",
      "• Hit design now available — new trending Bollywood blockbuster sequins launch",
      "• Special edition in 6 colourways (pick your shade below)",
      "• Saree: full heavy-quality faux georgette with heavy pallu embroidery, 5mm sequins and multi embroidery (4.4 mtr work)",
      "• Blouse: faux georgette with heavy embroidery front and back, with sleeves",
      "• Beautiful zalar attached on pallu and blouse",
      "• Premium quality — Shivaanya Collection designer saree",
      `• ${DISCLAIMER}`,
    ].join("\n"),
    images: Array.from({ length: 15 }, (_, i) => `${dir("sarees", "sarees-code-df-1199p-20260613t070554z-3-001")}/img${String(i + 1).padStart(3, "0")}.jpeg`),
    colors: ["Shade 1", "Shade 2", "Shade 3", "Shade 4", "Shade 5", "Shade 6"],
    colorImageIndices: [0, 2, 4, 7, 10, 13],
    sizes: ["Free Size (Saree)"],
  },
  {
    id: 124,
    productCode: "Code- MU 1550P-20260613T070546Z-3-001",
    displayCode: "MU 1550P",
    name: "MU 1550P · Chinnon Mirror Saree · Shivaanya Collection",
    categoryName: "Sarees",
    categoryFolder: "sarees",
    slug: "sarees-code-mu-1550p-20260613t070546z-3-001",
    price: 1550,
    fabric: "Soft chinnon with print, gold zari and hand real mirror work",
    description: [
      "• Product code: Code- MU 1550P-20260613T070546Z-3-001",
      "• Shivaanya Collection launching new designer saree — Code MU",
      "• Saree: soft chinnon with beautiful print, gold zari work and hand real mirror work",
      "• Blouse: beautiful print with real mirror in chinnon",
      "• Rate: ₹1,550",
      `• ${DISCLAIMER}`,
    ].join("\n"),
    images: Array.from({ length: 18 }, (_, i) => `${dir("sarees", "sarees-code-mu-1550p-20260613t070546z-3-001")}/img${String(i + 1).padStart(3, "0")}.jpeg`),
    colors: ["As shown"],
    sizes: ["Free Size (Saree)"],
  },
  {
    id: 125,
    productCode: "Code- MP 1699P-20260613T070542Z-3-001",
    displayCode: "MP 1699P",
    name: "MP 1699P · Khatli Georgette Saree · Shivaanya Collection",
    categoryName: "Sarees",
    categoryFolder: "sarees",
    slug: "sarees-code-mp-1699p-20260613t070542z-3-001",
    price: 1699,
    fabric: "Fox georgette with khatli cut dana and hand diamond work",
    description: [
      "• Product code: Code- MP 1699P-20260613T070542Z-3-001",
      "• Fabric: fox georgette saree with beautiful khatli cut dana handwork along with hand diamond work",
      "• Blouse: fox georgette with heavy khatli handwork (0.80 mtr material)",
      "• Length: 5.5 mtr saree",
      "• Celebrity-ready drape — premium quality, ready stock",
      "• Price: ₹1,699",
      `• ${DISCLAIMER}`,
    ].join("\n"),
    images: Array.from({ length: 21 }, (_, i) => `${dir("sarees", "sarees-code-mp-1699p-20260613t070542z-3-001")}/img${String(i + 1).padStart(3, "0")}.jpeg`),
    videoUrl: `${dir("sarees", "sarees-code-mp-1699p-20260613t070542z-3-001")}/vdo001.mp4`,
    colors: ["As shown"],
    sizes: ["Free Size (Saree)"],
  },
  {
    id: 126,
    productCode: "Code-AR 1600P-20260613T070550Z-3-001",
    displayCode: "AR 1600P",
    name: "AR 1600P · Kurta Sharara Set · Shivaanya Collection",
    categoryName: "Anarkalis",
    categoryFolder: "anarkalis",
    slug: "anarkalis-code-ar-1600p-20260613t070550z-3-001",
    price: 1600,
    fabric: "Soft crunchy chiffon with hand charkhi gota patti work",
    description: [
      "• Product code: Code-AR 1600P-20260613T070550Z-3-001",
      "• New premium launch — heavenly handmade kurta sharara plazzo set with charkhi gota work",
      "• Short kurta: best soft crunchy chiffon with beautiful hand charkhi gota patti work, length 32–34 inch",
      "• Sharara plazzo: soft crunchy chiffon, full flared pattern with gota touch-up (39–40 inch)",
      "• Dupatta: soft crunchy chiffon with hand charkhi gota work (2.1 mtr)",
      "• Weight approx 700 gm — ready to dispatch",
      "• Sizes: S (36), M (38), L (40), XL (42), XXL (44)",
      "• Price: ₹1,600",
      `• ${DISCLAIMER}`,
    ].join("\n"),
    images: Array.from({ length: 24 }, (_, i) => `${dir("anarkalis", "anarkalis-code-ar-1600p-20260613t070550z-3-001")}/img${String(i + 1).padStart(3, "0")}.jpeg`),
    videoUrl: `${dir("anarkalis", "anarkalis-code-ar-1600p-20260613t070550z-3-001")}/vdo001.mp4`,
    colors: ["As shown"],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: 128,
    productCode: "Code-LW 820-20260613T070612Z-3-001",
    displayCode: "LW 820",
    name: "LW 820 · Cotton Bandhej Top Pant Set · Shivaanya Collection",
    categoryName: "Suits",
    categoryFolder: "suits",
    slug: "suits-code-lw-820-20260613t070612z-3-001",
    price: 820,
    fabric: "Cotton top with bandhej print; linen cotton farsi pant",
    description: [
      "• Product code: Code-LW 820-20260613T070612Z-3-001",
      "• Top pant set — summer cotton collection",
      "• Top: cotton with bandhej print, length 28 inch, sleeves 17 inch, square neck, standard stitching with back dori",
      "• Pant: linen cotton farsi pant, elastic waist 38–42 inch, length 40 inch",
      "• Sizes: S (36), M (38), L (40), XL (42), XXL (44)",
      "• Colours: Green, Pink, Blue, Purple (choose shade below)",
      "• Full pair rate: ₹820 (top only ₹650 · pant only ₹580)",
      "• Weight approx 350 gm",
      `• ${DISCLAIMER}`,
    ].join("\n"),
    images: Array.from({ length: 27 }, (_, i) => `${dir("suits", "suits-code-lw-820-20260613t070612z-3-001")}/img${String(i + 1).padStart(3, "0")}.jpeg`),
    videoUrl: `${dir("suits", "suits-code-lw-820-20260613t070612z-3-001")}/vdo001.mp4`,
    colors: ["Green", "Pink", "Blue", "Purple"],
    colorImageIndices: [0, 7, 14, 21],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: 129,
    productCode: "Code- LW 1390-20260613T070540Z-3-001",
    displayCode: "LW 1390",
    name: "LW 1390 · Gown With Dupatta · Shivaanya Collection",
    categoryName: "Anarkalis",
    categoryFolder: "anarkalis",
    slug: "anarkalis-code-lw-1390-20260613t070540z-3-001",
    price: 1390,
    fabric: "Cosmos gown with mirror zari lace; moss butti dupatta",
    description: [
      "• Product code: Code- LW 1390-20260613T070540Z-3-001",
      "• Gown-with-dupatta collection 2026",
      "• Gown: cosmos with real mirror and zari embroidered lace work, length 55–56 inch, flair 3.5 mtr (12 kali), cotton full lining, long sleeves, patterned neck with dori, standard kali stitching",
      "• Dupatta: moss butti weaving with designer lace border, length 2.30 mtr — 2 dupatta colourways",
      "• Package: 1 gown + 1 dupatta",
      "• Sizes: M (38), L (40), XL (42), XXL (44)",
      "• Weight approx 800 gm — best rate ₹1,390",
      `• ${DISCLAIMER}`,
    ].join("\n"),
    images: Array.from({ length: 16 }, (_, i) => `${dir("anarkalis", "anarkalis-code-lw-1390-20260613t070540z-3-001")}/img${String(i + 1).padStart(3, "0")}.jpeg`),
    videoUrl: `${dir("anarkalis", "anarkalis-code-lw-1390-20260613t070540z-3-001")}/vdo001.mp4`,
    colors: ["Dupatta shade 1", "Dupatta shade 2"],
    colorImageIndices: [0, 8],
    sizes: ["M", "L", "XL", "XXL"],
  },
];

function buildProduct(seed: Seed): Product {
  return {
    id: seed.id,
    productCode: seed.productCode,
    name: seed.name,
    price: seed.price,
    originalPrice: Math.round(seed.price * 1.06) + 49,
    imageUrl: seed.images[0]!,
    videoUrl: seed.videoUrl,
    videoObjectPosition: seed.videoUrl ? "center 38%" : undefined,
    videoBottomClipPct: seed.videoUrl ? 18 : undefined,
    images: seed.images,
    categoryName: seed.categoryName,
    description: seed.description,
    fabric: seed.fabric,
    colors: seed.colors,
    colorImageIndices: seed.colorImageIndices,
    sizes: seed.sizes,
    rating: 4.7,
    reviewCount: 48 + (seed.id % 90),
    isNew: true,
    isFeatured: true,
    isBestseller: false,
  };
}

/** Shop order: newest codes first (DF, MU, MP, AR, LW 820, LW 1390). */
export const june2026CatalogProducts: Product[] = SEEDS.map(buildProduct);
