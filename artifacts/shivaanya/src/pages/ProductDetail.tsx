import { useMemo, useState, useRef, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Star, ShoppingBag, Heart, ChevronLeft, ChevronRight, MapPin, Sparkles, Check, ArrowLeft } from "lucide-react";
import { getProductById, getFilteredProducts, getListingCardImages, getProductVideoCropStyle, preferredSwatchIndexOrder, resolvedPdpColorLabels, dedupeImages, type Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { mediaUrl } from "@/lib/mediaUrl";
import { ReturnPolicySection } from "@/components/layout/ReturnPolicySection";

type ColorVariant = {
  name: string;
  image: string;
  imageIndex: number;
};

/** Flipkart-style PDP: prefer bullet lines; split legacy paragraphs on sentences. */
function parseDescriptionHighlights(raw: string): string[] {
  const text = raw.replace(/\r/g, "").trim();
  if (!text) return [];

  const rows = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const highlights: string[] = [];
  let orphan = "";

  for (const row of rows) {
    if (/^key highlights$/i.test(row)) continue;

    if (/^[•‧·\*]\s+/u.test(row)) {
      highlights.push(row.replace(/^[•‧·\*]\s+/u, "").trim());
      continue;
    }
    if (/^\d+\s*[\).\]]\s+/.test(row)) {
      highlights.push(row.replace(/^\d+\s*[\).\]]\s+/, "").trim());
      continue;
    }
    if (/^[-–—]\s+(?=\S)/.test(row)) {
      highlights.push(row.replace(/^[-–—]\s+/, "").trim());
      continue;
    }

    orphan += (orphan ? " " : "") + row;
  }

  if (!highlights.length && orphan) {
    const bits = orphan
      .split(/\.\s+(?=[A-Za-z(])/u)
      .map((b) => b.trim().replace(/\.\s*$/, ""))
      .filter((b) => b.length > 12 && !/^key highlights\b/i.test(b));
    if (bits.length >= 2) return bits.filter(Boolean);
    return [orphan.trim()];
  }

  if (orphan.trim() && highlights.length) highlights.unshift(orphan.trim());

  return highlights.filter(Boolean);
}

function ProductHighlights({ description }: { description: string }) {
  const items = parseDescriptionHighlights(description);
  if (!items.length) return null;

  const singleInlineProse =
    items.length === 1 && !description.includes("•") && !description.includes("\n");
  if (singleInlineProse) {
    return <p className="text-black/60 text-sm leading-relaxed">{description}</p>;
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide uppercase text-black/40 mb-3">Product highlights</p>
      <ul className="list-none space-y-2.5 text-sm text-black/70 leading-relaxed">
        {items.map((line, index) => (
          <li key={`${index}-${line.slice(0, 40)}`} className="flex gap-3">
            <span className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-black/35" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function buildColorVariants(product: Product): ColorVariant[] {
  const baseImages = product.images.length > 0 ? product.images : [product.imageUrl];
  const names = resolvedPdpColorLabels(product);

  const galleryOverride = product.colorGalleryImages ?? [];
  const indicesHint = product.colorImageIndices ?? [];
  const usedIndices = new Set<number>();
  const colorCount = names.length;
  const baseLen = baseImages.length;
  const hasExplicitMapping =
    galleryOverride.some((u) => u?.trim()) || indicesHint.length > 0;
  const parallelColorImages =
    !hasExplicitMapping && colorCount >= 2 && colorCount === baseLen;

  return names.map((name, index) => {
    let imageIndex = -1;

    if (parallelColorImages) {
      imageIndex = index;
    } else {
      const overrideUrl = galleryOverride[index]?.trim();
      if (overrideUrl) {
        const ix = baseImages.indexOf(overrideUrl);
        if (ix >= 0) imageIndex = ix;
      }
      const hinted = indicesHint[index];
      if (imageIndex < 0 && hinted !== undefined && hinted >= 0 && hinted < baseLen) imageIndex = hinted;
      if (imageIndex < 0) {
        const order = preferredSwatchIndexOrder({
          images: baseImages,
          listingHeroImage: product.listingHeroImage,
        });
        imageIndex =
          order.find((idx) => !usedIndices.has(idx)) ??
          Array.from({ length: baseLen }, (_, j) => j).find((j) => !usedIndices.has(j)) ??
          index % baseLen;
      }
    }

    if (usedIndices.has(imageIndex)) {
      let found = -1;
      for (let k = 0; k < baseLen; k++) {
        if (!usedIndices.has(k)) {
          found = k;
          break;
        }
      }
      if (found >= 0) imageIndex = found;
    }

    usedIndices.add(imageIndex);
    return {
      name,
      image: baseImages[imageIndex],
      imageIndex,
    };
  });
}

/**
 * PDP swatches: one circle per distinct thumbnail URL. If many colour names reused the same image,
 * keep a single swatch labelled with the lone data colour or neutral "As pictured".
 * Skips deduping when gallery→colour mapping was explicit (colourImageIndices / colorGalleryImages).
 */
function finalizeDisplayColorVariants(
  variants: ColorVariant[],
  meaningfulColorNames: string[],
  preserveAllSwatches: boolean,
): ColorVariant[] {
  if (preserveAllSwatches) return variants;
  const seenImg = new Set<string>();
  const uniq: ColorVariant[] = [];
  for (const v of variants) {
    if (seenImg.has(v.image)) continue;
    seenImg.add(v.image);
    uniq.push({ ...v });
  }
  if (uniq.length === variants.length) return uniq;

  if (uniq.length === 1 && variants.length > 1) {
    const label = meaningfulColorNames.length === 1 ? meaningfulColorNames[0]! : "As pictured";
    return [{ ...uniq[0]!, name: label }];
  }

  uniq.forEach((v, i) => {
    v.name = meaningfulColorNames[i] ?? v.name;
  });
  return uniq;
}

type MainSlide = { kind: "video" } | { kind: "image"; src: string; imageIndex: number };

function buildMainSlides(product: Product): MainSlide[] {
  const imgs = product.images.length > 0 ? product.images : [product.imageUrl];
  const slides: MainSlide[] = [];
  if (product.videoUrl) slides.push({ kind: "video" });
  for (let imageIndex = 0; imageIndex < imgs.length; imageIndex++) {
    slides.push({ kind: "image", src: imgs[imageIndex], imageIndex });
  }
  return slides;
}

function slideIndexForImage(product: Product, imageIndex: number): number {
  return product.videoUrl ? imageIndex + 1 : imageIndex;
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Former IDs that now resolve to a single canonical PDP. */
const LEGACY_MERGED_PRODUCT_ROUTES: Record<number, number> = {
  3: 2,
  8: 6,
};

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const [, setLocation] = useLocation();
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const canonicalId = LEGACY_MERGED_PRODUCT_ROUTES[id];

  useEffect(() => {
    if (canonicalId !== undefined) {
      setLocation(`/product/${canonicalId}`, { replace: true });
    }
  }, [id, canonicalId, setLocation]);

  if (canonicalId !== undefined) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <p className="text-sm text-black/40 tracking-wider uppercase">Redirecting…</p>
      </div>
    );
  }

  const product = getProductById(id);
  const { addItem } = useCart();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [mainFrameImage, setMainFrameImage] = useState(0);

  const imagesKey = product?.images.join("\u0001") ?? "";
  const colorsKey = product?.colors.join("\u0001") ?? "";
  const colorGalleryKey = product?.colorGalleryImages?.join("\u0001") ?? "";
  const colorIndicesKey = product?.colorImageIndices?.join(",") ?? "";
  const listingHeroKey = product?.listingHeroImage ?? "";

  const mainSlides = useMemo(
    () => (product ? buildMainSlides(product) : []),
    [product?.id, product?.videoUrl, product?.imageUrl, imagesKey],
  );

  const colorVariants = useMemo(() => {
    if (!product) return [];
    const labels = resolvedPdpColorLabels(product);
    const hinted = product.colorImageIndices ?? [];
    const galleryHits = (product.colorGalleryImages ?? []).filter((u) => u?.trim()).length;
    const imgs = dedupeImages(product.images.length ? product.images : [product.imageUrl]);
    const parallelOk =
      product.parallelColorVariants === true && labels.length >= 2 && labels.length === imgs.length;
    const preserveAllSwatches =
      labels.length > 1 &&
      (hinted.length === labels.length || galleryHits === labels.length || parallelOk);
    return finalizeDisplayColorVariants(buildColorVariants(product), labels, preserveAllSwatches);
  }, [product?.id, imagesKey, colorsKey, colorGalleryKey, colorIndicesKey, listingHeroKey, product?.parallelColorVariants]);

  useEffect(() => {
    setSelectedColor(colorVariants[0]?.name || "");
  }, [product?.id, colorVariants]);

  useEffect(() => {
    setSelectedImage(0);
    setMainFrameImage(0);
  }, [product?.id, imagesKey, product?.videoUrl]);

  const handleAddToCart = () => {
    if (!product || !selectedSize || !selectedColor) return;
    const variant = colorVariants.find((v) => v.name === selectedColor);
    const lineImage =
      variant?.image?.trim() ? variant.image : product.imageUrl;
    addItem({
      productId: product.id,
      productCode: product.productCode,
      productName: product.name,
      productImage: lineImage,
      price: product.price,
      color: selectedColor,
      size: selectedSize,
      quantity,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-white pt-24 text-center">
        <div className="max-w-md mx-auto py-20">
          <p className="text-4xl font-bold text-black/20 mb-4">404</p>
          <p className="text-lg text-black/50 mb-8">Product not found</p>
          <Link href="/shop" className="inline-flex items-center gap-2 bg-black text-white px-8 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase rounded-full hover:bg-black/80 transition-all">
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  const relatedProducts = getFilteredProducts({ category: product.categoryName })
    .filter(p => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Breadcrumb */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-4">
        <div className="flex items-center gap-2 text-xs text-black/30 tracking-wider">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-black transition-colors">Shop</Link>
          <span>/</span>
          <Link href={`/shop?category=${product.categoryName}`} className="hover:text-black transition-colors">{product.categoryName}</Link>
          <span>/</span>
          <span className="text-black line-clamp-1 max-w-48">{product.name}</span>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-14 xl:gap-20">
          {/* Image Gallery */}
          <div>
            <div className="aspect-[4/5] sm:aspect-[3/4] max-w-[520px] sm:max-w-none mx-auto lg:mx-0 overflow-hidden bg-[#f5f5f5] relative group rounded-xl sm:rounded-none">
              <AnimatePresence mode="wait">
                {mainSlides[mainFrameImage]?.kind === "video" ? (
                  <motion.div
                    key={`${product.id}-${mainFrameImage}-vid`}
                    initial={{ opacity: 0, filter: "blur(8px)", scale: 1.03 }}
                    animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                    exit={{ opacity: 0, filter: "blur(8px)", scale: 1.02 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 overflow-hidden"
                  >
                    <div className="absolute inset-0 overflow-hidden transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                      <video
                        src={mediaUrl(product.videoUrl)}
                        autoPlay
                        muted
                        loop
                        playsInline
                        aria-label={`${product.name} motion preview`}
                        style={getProductVideoCropStyle(product)}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.img
                    key={`${product.id}-${mainFrameImage}-img`}
                    src={mediaUrl(
                      mainSlides[mainFrameImage]?.kind === "image"
                        ? mainSlides[mainFrameImage].src
                        : product.imageUrl,
                    )}
                    alt={product.name}
                    initial={{ opacity: 0, filter: "blur(8px)", scale: 1.03 }}
                    animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                    exit={{ opacity: 0, filter: "blur(8px)", scale: 1.02 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
              </AnimatePresence>

              {discount && (
                <div className="absolute top-4 left-4 bg-black text-white text-xs font-bold px-4 py-2 rounded-full">
                  -{discount}% OFF
                </div>
              )}

              {mainSlides.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      const next = Math.max(0, selectedImage - 1);
                      setSelectedImage(next);
                      setMainFrameImage(next);
                    }}
                    disabled={selectedImage === 0}
                    id="img-prev"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white disabled:opacity-30 transition-all shadow-sm"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      const next = Math.min(mainSlides.length - 1, selectedImage + 1);
                      setSelectedImage(next);
                      setMainFrameImage(next);
                    }}
                    disabled={selectedImage === mainSlides.length - 1}
                    id="img-next"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white disabled:opacity-30 transition-all shadow-sm"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-5 sm:space-y-6 lg:pt-4">
            <FadeUp>
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-black/40 mb-2">{product.categoryName}</p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black tracking-tight leading-tight mb-4">
                  {product.name}
                </h1>

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? "fill-black text-black" : "text-black/15"}`} />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{product.rating}</span>
                  <span className="text-xs text-black/30">({product.reviewCount} reviews)</span>
                </div>

                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-3xl font-bold text-black">
                    ₹{product.price.toLocaleString("en-IN")}
                  </span>
                  {product.originalPrice && (
                    <span className="text-base text-black/30 line-through">
                      ₹{product.originalPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                  {discount && (
                    <span className="text-xs font-semibold text-black bg-black/5 px-3 py-1 rounded-full">
                      Save {discount}%
                    </span>
                  )}
                </div>

                <ProductHighlights description={product.description} />
              </div>
            </FadeUp>

            {/* Details */}
            <FadeUp delay={0.1}>
              <div className="space-y-2 text-sm border-t border-black/5 pt-6">
                <div className="flex gap-4">
                  <span className="text-black/30 w-20 text-xs tracking-wider uppercase">Fabric</span>
                  <span className="text-black font-medium text-xs">{product.fabric}</span>
                </div>
                {product.craftRegion && (
                  <div className="flex gap-4">
                    <span className="text-black/30 w-20 text-xs tracking-wider uppercase">Origin</span>
                    <span className="text-black font-medium text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-black/30" />{product.craftRegion}
                    </span>
                  </div>
                )}
              </div>
            </FadeUp>

            {/* Color Selection */}
            <FadeUp delay={0.15}>
              <div>
                <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-3">
                  Color: <span className="text-black/50 font-normal">{selectedColor || "Select"}</span>
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {colorVariants.map((variant) => {
                    const isSelected = selectedColor === variant.name;
                    const isExpanded = hoveredColor === variant.name || isSelected;
                    return (
                      <button
                        key={variant.name}
                        onClick={() => {
                          const slideIx = slideIndexForImage(product, variant.imageIndex);
                          setSelectedColor(variant.name);
                          setSelectedImage(slideIx);
                          setMainFrameImage(slideIx);
                        }}
                        onMouseEnter={() => setHoveredColor(variant.name)}
                        onMouseLeave={() => setHoveredColor(null)}
                        id={`color-${variant.name.replace(/\s/g, "-").toLowerCase()}`}
                        className="group flex items-center gap-2"
                      >
                        <motion.span
                          animate={{
                            width: isExpanded ? 56 : 42,
                            height: isExpanded ? 56 : 42,
                            scale: isExpanded ? 1.03 : 1,
                          }}
                          transition={{ duration: 0.22 }}
                          className={`inline-flex rounded-full overflow-hidden border-2 ${
                            isSelected ? "border-black" : "border-black/10"
                          } shadow-sm`}
                        >
                          <img src={mediaUrl(variant.image)} alt={variant.name} className="w-full h-full object-cover" />
                        </motion.span>
                        <span className={`text-xs ${isSelected ? "text-black font-medium" : "text-black/50"}`}>
                          {variant.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </FadeUp>

            {/* Size Selection */}
            <FadeUp delay={0.2}>
              <div>
                <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-3">
                  Size: <span className="text-black/50 font-normal">{selectedSize || "Select"}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      id={`size-${size.toLowerCase()}`}
                      className={`px-5 py-2.5 text-xs font-medium rounded-full transition-all ${selectedSize === size ? "bg-black text-white" : "bg-white border border-black/10 text-black hover:border-black"}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </FadeUp>

            {/* Quantity & Add to Cart */}
            <FadeUp delay={0.25}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-4">
                {/* Mobile: ~half width, left-aligned; sm+: natural compact width */}
                <div className="self-start w-1/2 max-w-[200px] sm:w-auto sm:max-w-none flex border border-black/10 rounded-full overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    id="qty-minus"
                    className="flex-1 min-w-0 flex items-center justify-center py-2.5 sm:py-3 px-1 sm:px-4 text-black hover:bg-black/5 transition-colors text-sm font-medium"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="flex-1 min-w-0 flex items-center justify-center py-2.5 sm:py-3 px-1 text-sm font-medium border-x border-black/10 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    id="qty-plus"
                    className="flex-1 min-w-0 flex items-center justify-center py-2.5 sm:py-3 px-1 sm:px-4 text-black hover:bg-black/5 transition-colors text-sm font-medium"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!selectedSize || !selectedColor}
                  id="add-to-cart-btn"
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-8 text-xs font-semibold tracking-[0.15em] uppercase rounded-full transition-all duration-300 ${
                    addedToCart
                      ? "bg-green-600 text-white"
                      : "bg-black text-white hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed"
                  }`}
                >
                  {addedToCart ? (
                    <><Check className="w-4 h-4" /> Added to Bag</>
                  ) : (
                    <><ShoppingBag className="w-4 h-4" /> Add to Bag</>
                  )}
                </button>

                <button
                  id="wishlist-btn"
                  className="w-12 h-12 border border-black/10 rounded-full flex items-center justify-center hover:border-black hover:bg-black hover:text-white transition-all flex-shrink-0"
                >
                  <Heart className="w-5 h-5" />
                </button>
              </div>

              {(!selectedSize || !selectedColor) && (
                <p className="text-[10px] text-black/30 mt-2 tracking-wider">
                  {!selectedColor ? "Please select a color" : "Please select a size"} to add to bag
                </p>
              )}
            </FadeUp>

            {/* Trust badges */}
            <FadeUp delay={0.3}>
              <div className="grid grid-cols-3 gap-3 py-6 border-t border-black/5">
                {[
                  { icon: "📦", text: "Free Shipping", sub: "Orders over ₹5,000" },
                  { icon: "↩", text: "Easy Returns", sub: "Within 7 days — see policy" },
                  { icon: "✦", text: "Handcrafted", sub: "Artisan certified" },
                ].map((item) => (
                  <div key={item.text} className="text-center">
                    <span className="text-lg block mb-1">{item.icon}</span>
                    <p className="text-[10px] font-semibold text-black tracking-wider uppercase">{item.text}</p>
                    <p className="text-[9px] text-black/30">{item.sub}</p>
                  </div>
                ))}
              </div>
              <ReturnPolicySection variant="compact" className="mt-4" />
            </FadeUp>
          </div>
        </div>

        {/* Expanded media library below main section */}
        <div className="mt-16">
          <FadeUp>
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Product Media Library</h2>
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                Tap media to preview above
              </p>
            </div>
          </FadeUp>

          {/* Lead tile (2×2): spans must be on the grid item (FadeUp), not inner button */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 auto-rows-auto">
            <FadeUp className="col-span-2 row-span-2 flex min-h-[11rem] sm:min-h-[14rem] lg:min-h-[16rem]">
              <motion.button
                type="button"
                aria-label={
                  product.videoUrl
                    ? `${product.name} video — preview above`
                    : `${product.name} — preview above`
                }
                onClick={() => {
                  if (product.videoUrl) {
                    setSelectedImage(0);
                    setMainFrameImage(0);
                  } else {
                    const si = slideIndexForImage(product, 0);
                    setSelectedImage(si);
                    setMainFrameImage(si);
                  }
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                whileHover={{ scale: 1.02, zIndex: 10 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                className="relative flex-1 overflow-hidden rounded-xl bg-[#f0f0f0] shadow-sm text-left cursor-pointer outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-black/30"
              >
                {product.videoUrl ? (
                  <>
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                      <video
                        src={mediaUrl(product.videoUrl)}
                        autoPlay
                        muted
                        loop
                        playsInline
                        disablePictureInPicture
                        preload="metadata"
                        aria-hidden
                        tabIndex={-1}
                        style={getProductVideoCropStyle(product)}
                        className="pointer-events-none absolute inset-0 h-full w-full object-cover select-none bg-black"
                      />
                    </div>
                    <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-black shadow-sm">
                      Video
                    </span>
                  </>
                ) : (
                  <>
                    <img
                      src={mediaUrl(product.images[0] ?? product.imageUrl)}
                      alt={`${product.name} gallery lead`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-black shadow-sm">
                      Gallery
                    </span>
                  </>
                )}
              </motion.button>
            </FadeUp>

            {(product.videoUrl
              ? product.images.length > 0
                ? product.images
                : [product.imageUrl]
              : product.images.length > 1
                ? product.images.slice(1)
                : []
            ).map((img, j) => {
              const i = product.videoUrl ? j : j + 1;
              return (
                <FadeUp key={`${img}-${i}`} delay={0.03 * j}>
                  <motion.button
                    type="button"
                    onClick={() => {
                      const si = slideIndexForImage(product, i);
                      setSelectedImage(si);
                      setMainFrameImage(si);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    whileHover={{ scale: 1.04, zIndex: 10 }}
                    transition={{ type: "spring", stiffness: 280, damping: 22 }}
                    className="col-span-1 row-span-1 aspect-[10/13] sm:aspect-[4/5] w-full overflow-hidden rounded-lg sm:rounded-xl bg-[#f4f4f4] shadow-sm"
                  >
                    <img src={mediaUrl(img)} alt={`${product.name} library ${i + 1}`} className="h-full w-full object-cover" />
                  </motion.button>
                </FadeUp>
              );
            })}
          </div>
        </div>

        {/* Story section */}
        {product.story && (
          <FadeUp>
            <div className="mt-20 relative overflow-hidden bg-black py-16 px-8 md:px-16 rounded-2xl">
              <div className="absolute top-4 right-4 opacity-5">
                <Sparkles className="w-40 h-40 text-white" />
              </div>
              <div className="max-w-3xl relative z-10">
                <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-4 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> The Story Behind This Piece
                </p>
                <p className="text-white text-xl md:text-2xl font-light leading-relaxed mb-6">
                  "{product.story}"
                </p>
                {product.craftRegion && (
                  <p className="text-white/30 text-xs flex items-center gap-2 tracking-wider">
                    <MapPin className="w-3 h-3" />
                    Crafted in {product.craftRegion}
                  </p>
                )}
              </div>
            </div>
          </FadeUp>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-24">
            <FadeUp>
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="text-xs tracking-[0.3em] uppercase text-black/40 mb-2">You May Also Like</p>
                  <h2 className="text-2xl md:text-3xl font-bold text-black tracking-tight">Similar Pieces</h2>
                </div>
                <Link
                  href={`/shop?category=${product.categoryName}`}
                  className="text-xs font-semibold tracking-[0.2em] uppercase text-black hover:opacity-60 transition-opacity hidden md:block"
                >
                  View All →
                </Link>
              </div>
            </FadeUp>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 lg:gap-6 md:[perspective:1200px]">
              {relatedProducts.map((p, i) => {
                const cardImg = getListingCardImages(p)[0] ?? p.imageUrl;
                return (
                <FadeUp key={p.id} delay={i * 0.1}>
                  <Link href={`/product/${p.id}`} className="group block">
                    <div className="aspect-[4/5] md:aspect-[3/4] overflow-hidden bg-[#f5f5f5] relative rounded-lg md:rounded-none">
                      <img
                        src={mediaUrl(cardImg)}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                    <div className="mt-2 sm:mt-3 space-y-0.5">
                      <h3 className="text-sm font-semibold text-black line-clamp-1">{p.name}</h3>
                      <p className="text-sm font-bold">₹{p.price.toLocaleString("en-IN")}</p>
                    </div>
                  </Link>
                </FadeUp>
              );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
