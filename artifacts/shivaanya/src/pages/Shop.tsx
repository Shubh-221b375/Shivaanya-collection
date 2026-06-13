import { useRef, useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Search, SlidersHorizontal, X, Heart, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { mockCategories, getFilteredProducts, getListingCardImages } from "@/data/products";
import { mediaUrl } from "@/lib/mediaUrl";

/* ──────── Animations ──────── */

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ──────── 3D Tilt Product Card ──────── */

function ProductCard({ product, index }: { product: any; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 200, damping: 20 });

  const productImages = getListingCardImages(product);
  const galleryFingerprint = `${product.id}|${product.listingHeroImage ?? ""}|${productImages.join("\u0001")}`;
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    setCarouselIndex(0);
  }, [galleryFingerprint]);

  const currentImageSrc =
    productImages.length > 0
      ? productImages[Math.min(carouselIndex, productImages.length - 1)]
      : product.imageUrl;
  const canManualGallery = productImages.length > 1;

  function handleMouse(e: React.MouseEvent) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  const goPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCarouselIndex((i) => (i - 1 + productImages.length) % productImages.length);
  };

  const goNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCarouselIndex((i) => (i + 1) % productImages.length);
  };

  return (
    <FadeUp delay={index * 0.05}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouse}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="group cursor-pointer"
      >
        <Link href={`/product/${product.id}`}>
          <div className="aspect-[4/5] md:aspect-[3/4] overflow-hidden relative bg-[#f5f5f5]">
            <div className="relative w-full h-full overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img
                  key={`${galleryFingerprint}-${carouselIndex}`}
                  src={mediaUrl(currentImageSrc)}
                  alt={product.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </AnimatePresence>
            </div>

            {/* Hover overlay */}
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-all duration-500 group-hover:bg-black/20" />

            {canManualGallery && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-sm backdrop-blur-sm transition-opacity hover:bg-white opacity-80 hover:opacity-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={goNext}
                  className="absolute right-2 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-sm backdrop-blur-sm transition-opacity hover:bg-white opacity-80 hover:opacity-100"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Badges */}
            <div className="pointer-events-none absolute top-2 left-2 z-20 flex flex-col gap-1">
              {product.isNew && (
                <span className="bg-black text-white text-[10px] font-semibold tracking-[0.15em] uppercase px-3 py-1 rounded-full">
                  New
                </span>
              )}
              {product.isBestseller && (
                <span className="bg-white text-black text-[10px] font-semibold tracking-[0.15em] uppercase px-3 py-1 rounded-full shadow-sm">
                  Bestseller
                </span>
              )}
              {product.originalPrice && (
                <span className="bg-black text-white text-[10px] font-semibold tracking-[0.15em] uppercase px-3 py-1 rounded-full">
                  Sale
                </span>
              )}
            </div>

            {/* Wishlist */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="absolute top-2.5 right-2.5 z-30 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-white hover:scale-110"
              aria-label="Add to wishlist"
            >
              <Heart className="w-3.5 h-3.5 text-black" />
            </button>

            {/* View Details — visible on coarse pointers; hover on desktop */}
            <div className="absolute bottom-3 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 md:opacity-0 md:translate-y-3 md:group-hover:opacity-100 md:group-hover:translate-y-0 opacity-95 translate-y-0 transition-all duration-400 pointer-events-none">
              <span className="block text-center bg-white text-black text-[10px] sm:text-xs font-semibold tracking-[0.15em] uppercase py-2 sm:py-3 rounded-full">
                View Details
              </span>
            </div>
          </div>

          <div className="mt-2.5 sm:mt-4 space-y-0.5 sm:space-y-1">
            <p className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-black/40">{product.categoryName}</p>
            <h3 className="text-[13px] sm:text-sm font-semibold text-black line-clamp-2 sm:line-clamp-1 group-hover:opacity-60 transition-opacity leading-snug">
              {product.name}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-[10px] ${i < Math.floor(product.rating) ? "text-black" : "text-black/15"}`}>
                  ★
                </span>
              ))}
              <span className="text-[10px] text-black/30 ml-1">({product.reviewCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-black">₹{product.price.toLocaleString("en-IN")}</span>
              {product.originalPrice && (
                <span className="text-xs text-black/30 line-through">₹{product.originalPrice.toLocaleString("en-IN")}</span>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    </FadeUp>
  );
}

/* ──────── Main Shop Page ──────── */

export default function Shop() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.includes("?") ? location.split("?")[1] : "");
  const defaultCategory = params.get("category") || "";

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(defaultCategory);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState("featured");

  const allProducts = getFilteredProducts({
    category: activeCategory || undefined,
    search: searchQuery || undefined,
  });

  const sortedProducts = [...allProducts].sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    const score = (p: typeof a) => (p.isNew ? 4 : 0) + (p.isFeatured ? 2 : 0) + (p.isBestseller ? 1 : 0);
    const diff = score(b) - score(a);
    return diff !== 0 ? diff : b.id - a.id;
  });

  return (
    <div className="min-h-screen bg-white pt-0">
      {/* Hero Banner */}
      <div className="relative h-52 sm:h-60 md:h-80 bg-black overflow-hidden" id="shop-hero">
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white/50 text-xs tracking-[0.4em] uppercase mb-4"
          >
            Shivaanya Collection
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight"
          >
            {activeCategory || "All Collections"}
          </motion.h1>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-8 sm:py-12">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between mb-8 sm:mb-10">
          <div className="relative w-full sm:w-auto sm:min-w-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 pointer-events-none" />
            <input
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="shop-search"
              className="pl-11 pr-4 py-2.5 sm:py-3 border border-black/10 bg-white text-black text-sm w-full max-w-full sm:w-64 sm:max-w-none focus:outline-none focus:border-black transition-colors rounded-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              id="shop-sort"
              className="border border-black/10 bg-white text-black text-sm px-5 py-3 focus:outline-none focus:border-black cursor-pointer rounded-full appearance-none"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
            <button
              onClick={() => setSidebarOpen(true)}
              id="shop-filter-btn"
              className="flex items-center gap-2 border border-black/10 px-5 py-3 text-sm hover:border-black transition-colors md:hidden rounded-full"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
          </div>
        </div>

        <div className="flex gap-10 md:gap-12 lg:gap-16">
          {/* Sidebar - Desktop */}
          <aside className="hidden md:block w-56 flex-shrink-0">
            <div className="sticky top-24">
              <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-black/40 mb-6">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveCategory("")}
                  id="filter-all"
                  className={`w-full text-left py-2.5 px-3 text-sm transition-all rounded-lg ${!activeCategory ? "text-black font-semibold bg-black/5" : "text-black/50 hover:text-black hover:bg-black/3"}`}
                >
                  All Collections
                </button>
                {mockCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.name)}
                    id={`filter-${cat.name.toLowerCase()}`}
                    className={`w-full text-left py-2.5 px-3 text-sm transition-all rounded-lg flex justify-between items-center ${activeCategory === cat.name ? "text-black font-semibold bg-black/5" : "text-black/50 hover:text-black hover:bg-black/3"}`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] text-black/30">{cat.productCount}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Mobile Sidebar */}
          {sidebarOpen && (
            <>
              <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSidebarOpen(false)} />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl p-6 md:hidden"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-sm font-semibold tracking-[0.2em] uppercase">Filters</h3>
                  <button onClick={() => setSidebarOpen(false)}>
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => { setActiveCategory(""); setSidebarOpen(false); }}
                    className={`w-full text-left py-3 px-3 text-sm rounded-lg ${!activeCategory ? "text-black font-semibold bg-black/5" : "text-black/50"}`}
                  >
                    All Collections
                  </button>
                  {mockCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { setActiveCategory(cat.name); setSidebarOpen(false); }}
                      className={`w-full text-left py-3 px-3 text-sm rounded-lg ${activeCategory === cat.name ? "text-black font-semibold bg-black/5" : "text-black/50"}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            <p className="text-xs tracking-wider uppercase text-black/30 mb-6">
              {sortedProducts.length} piece{sortedProducts.length !== 1 ? "s" : ""} {activeCategory ? `in ${activeCategory}` : "in all collections"}
            </p>

            {sortedProducts.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-2xl font-bold text-black/30 mb-4">No pieces found</p>
                <button
                  onClick={() => { setActiveCategory(""); setSearchQuery(""); }}
                  className="text-black text-xs tracking-[0.15em] uppercase bg-black/5 px-6 py-3 rounded-full hover:bg-black/10 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5 lg:gap-6 md:[perspective:1200px]">
                {sortedProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
