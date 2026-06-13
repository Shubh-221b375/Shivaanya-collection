/**
 * June 2026 S3 catalog drop — folder names are the official product codes.
 * Media paths match `public/media/catalog/<category>/<slug>/` on S3 / Vercel.
 */

import type { Product } from "./products";

function catalogDir(categoryFolder: string, slug: string): string {
  return `/media/catalog/${categoryFolder}/${slug}`;
}

function numberedImages(baseDir: string, count: number, ext = "jpeg"): string[] {
  return Array.from({ length: count }, (_, i) => `${baseDir}/img${String(i + 1).padStart(3, "0")}.${ext}`);
}

type CatalogSeed = {
  id: number;
  productCode: string;
  displayCode: string;
  categoryName: Product["categoryName"];
  categoryFolder: string;
  slug: string;
  price: number;
  imageCount: number;
  fabric: string;
  description: string;
  colors?: string[];
  colorImageIndices?: number[];
  sizes?: string[];
};

const SEEDS: CatalogSeed[] = [
  {
    id: 124,
    productCode: "Code- MU 1550P-20260613T070546Z-3-001",
    displayCode: "MU 1550P",
    categoryName: "Sarees",
    categoryFolder: "sarees",
    slug: "sarees-code-mu-1550p-20260613t070546z-3-001",
    price: 1550,
    imageCount: 14,
    fabric: "Designer drape fabrication with luxury finish",
    description:
      "• Premium designer saree from Shivaanya Collection.\n• Product code: Code- MU 1550P-20260613T070546Z-3-001\n• See gallery and video for blouse, border work, and drape detail.\n• Colour / finish may look slightly different on your screen — use carousel images as the guide for shade and motifs.",
  },
  {
    id: 125,
    productCode: "Code- MP 1699P-20260613T070542Z-3-001",
    displayCode: "MP 1699P",
    categoryName: "Sarees",
    categoryFolder: "sarees",
    slug: "sarees-code-mp-1699p-20260613t070542z-3-001",
    price: 1699,
    imageCount: 14,
    fabric: "Designer drape fabrication with luxury finish",
    description:
      "• Premium designer saree from Shivaanya Collection.\n• Product code: Code- MP 1699P-20260613T070542Z-3-001\n• See gallery and video for blouse, border work, and drape detail.\n• Colour / finish may look slightly different on your screen — use carousel images as the guide for shade and motifs.",
  },
  {
    id: 126,
    productCode: "Code-AR 1600P-20260613T070550Z-3-001",
    displayCode: "AR 1600P",
    categoryName: "Anarkalis",
    categoryFolder: "anarkalis",
    slug: "anarkalis-code-ar-1600p-20260613t070550z-3-001",
    price: 1600,
    imageCount: 12,
    fabric: "Lightweight breathable suit textiles with ornate detailing",
    description:
      "• Anarkali suit set from Shivaanya Collection.\n• Product code: Code-AR 1600P-20260613T070550Z-3-001\n• Fully stitched — see gallery for flair, dupatta, and embroidery detail.\n• Colour / finish may look slightly different on your screen — use carousel images as the guide for shade and motifs.",
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: 127,
    productCode: "Code-DF 1199P-20260613T070554Z-3-001",
    displayCode: "DF 1199P",
    categoryName: "Sarees",
    categoryFolder: "sarees",
    slug: "sarees-code-df-1199p-20260613t070554z-3-001",
    price: 1199,
    imageCount: 14,
    fabric: "Designer drape fabrication with luxury finish",
    description:
      "• Premium designer saree from Shivaanya Collection.\n• Product code: Code-DF 1199P-20260613T070554Z-3-001\n• See gallery and video for blouse, border work, and drape detail.\n• Colour / finish may look slightly different on your screen — use carousel images as the guide for shade and motifs.",
  },
  {
    id: 128,
    productCode: "Code-LW 820-20260613T070612Z-3-001",
    displayCode: "LW 820",
    categoryName: "Suits",
    categoryFolder: "suits",
    slug: "suits-code-lw-820-20260613t070612z-3-001",
    price: 820,
    imageCount: 12,
    fabric: "Lightweight breathable suit textiles with ornate detailing",
    description:
      "• Festive suit set from Shivaanya Collection.\n• Product code: Code-LW 820-20260613T070612Z-3-001\n• See gallery for kurta, bottom, and dupatta styling.\n• Colour / finish may look slightly different on your screen — use carousel images as the guide for shade and motifs.",
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: 129,
    productCode: "Code- LW 1390-20260613T070540Z-3-001",
    displayCode: "LW 1390",
    categoryName: "Anarkalis",
    categoryFolder: "anarkalis",
    slug: "anarkalis-code-lw-1390-20260613t070540z-3-001",
    price: 1390,
    imageCount: 12,
    fabric: "Lightweight breathable suit textiles with ornate detailing",
    description:
      "• Anarkali suit set from Shivaanya Collection.\n• Product code: Code- LW 1390-20260613T070540Z-3-001\n• Fully stitched — see gallery for flair, dupatta, and embroidery detail.\n• Colour / finish may look slightly different on your screen — use carousel images as the guide for shade and motifs.",
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
];

function buildProduct(seed: CatalogSeed): Product {
  const baseDir = catalogDir(seed.categoryFolder, seed.slug);
  const images = numberedImages(baseDir, seed.imageCount);
  const isSaree = seed.categoryName === "Sarees";

  return {
    id: seed.id,
    productCode: seed.productCode,
    name: `${seed.displayCode} · ${seed.categoryName} · Shivaanya Collection`,
    price: seed.price,
    originalPrice: Math.round(seed.price * 1.06) + 49,
    imageUrl: images[0]!,
    videoUrl: `${baseDir}/vdo001.mp4`,
    videoObjectPosition: "center 38%",
    videoBottomClipPct: 18,
    images,
    categoryName: seed.categoryName,
    description: seed.description,
    fabric: seed.fabric,
    colors: seed.colors ?? ["As shown"],
    colorImageIndices: seed.colorImageIndices,
    sizes: seed.sizes ?? (isSaree ? ["Free Size (Saree)"] : ["S", "M", "L", "XL", "XXL"]),
    rating: 4.7,
    reviewCount: 48 + (seed.id % 90),
    isNew: true,
    isFeatured: true,
    isBestseller: false,
  };
}

export const june2026CatalogProducts: Product[] = SEEDS.map(buildProduct);
