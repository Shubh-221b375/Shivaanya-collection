import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, useInView } from "framer-motion";
import { Search, SlidersHorizontal, X, Star, Heart, Gem } from "lucide-react";
import { Link } from "wouter";
import { useListProducts, useListCategories } from "@workspace/api-client-react";

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function ProductCard({ product, index }: { product: any; index: number }) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    cardRef.current.style.transform = `perspective(1000px) rotateX(${y}deg) rotateY(${x}deg) scale(1.02)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
    }
    setHovered(false);
  };

  return (
    <FadeInSection delay={index * 0.05}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setHovered(true)}
        className="group cursor-pointer"
        style={{ transition: "transform 0.15s ease-out", transformStyle: "preserve-3d" }}
      >
        <Link href={`/product/${product.id}`}>
          <div className="aspect-[3/4] overflow-hidden relative bg-card mb-4">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className={`absolute inset-0 bg-foreground/55 transition-opacity duration-300 flex items-end p-5 ${hovered ? "opacity-100" : "opacity-0"}`}>
              <div className="text-white w-full">
                {product.craftRegion && (
                  <p className="text-xs text-white/70 flex items-center gap-1 mb-1">
                    <Gem className="w-3 h-3" /> {product.craftRegion}
                  </p>
                )}
                <p className="text-sm font-light">{product.fabric}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {product.colors.slice(0, 3).map((c: string) => (
                    <span key={c} className="text-[10px] border border-white/30 px-2 py-0.5 text-white/70">{c}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute top-3 left-3 flex flex-col gap-1">
              {product.isNew && (
                <span className="bg-accent text-foreground text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5">New</span>
              )}
              {product.isBestseller && (
                <span className="bg-foreground text-background text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5">Bestseller</span>
              )}
              {product.originalPrice && (
                <span className="bg-red-700 text-white text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5">Sale</span>
              )}
            </div>

            <button className="absolute top-3 right-3 w-8 h-8 bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all opacity-0 group-hover:opacity-100">
              <Heart className="w-4 h-4" />
            </button>
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase mb-1">{product.categoryName}</p>
            <h3 className="font-serif text-base text-foreground leading-tight mb-1 line-clamp-2 group-hover:text-primary transition-colors">{product.name}</h3>
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-3 h-3 fill-accent text-accent" />
              <span className="text-sm">{product.rating}</span>
              <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-semibold text-primary">₹{product.price.toLocaleString("en-IN")}</span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">₹{product.originalPrice.toLocaleString("en-IN")}</span>
              )}
            </div>
          </div>
        </Link>
      </div>
    </FadeInSection>
  );
}

export default function Shop() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.includes("?") ? location.split("?")[1] : "");
  const defaultCategory = params.get("category") || "";

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(defaultCategory);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState("featured");

  const { data: categories = [] } = useListCategories();
  const { data: allProducts = [], isLoading } = useListProducts({
    category: activeCategory || undefined,
    search: searchQuery || undefined,
  });

  const sortedProducts = [...allProducts].sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
  });

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Banner */}
      <div className="relative h-48 md:h-64 bg-foreground overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1400&auto=format&fit=crop&q=60"
          alt="Collections"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-accent text-xs tracking-[0.4em] uppercase mb-3"
          >
            Shivaanya Collection
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl md:text-5xl text-white font-light"
          >
            {activeCategory || "All Collections"}
          </motion.h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-border bg-background text-foreground text-sm w-64 focus:outline-none focus:border-primary transition-colors rounded-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-border bg-background text-foreground text-sm px-4 py-2.5 focus:outline-none focus:border-primary cursor-pointer rounded-none"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 border border-border px-4 py-2.5 text-sm hover:border-primary hover:text-primary transition-colors md:hidden"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden md:block w-56 flex-shrink-0">
            <div className="sticky top-24">
              <h3 className="font-serif text-xl mb-6 text-foreground">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveCategory("")}
                  className={`w-full text-left py-2.5 px-3 text-sm transition-all border-l-2 ${!activeCategory ? "border-primary text-primary font-medium bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}
                >
                  All Collections
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`w-full text-left py-2.5 px-3 text-sm transition-all border-l-2 flex justify-between items-center ${activeCategory === cat.name ? "border-primary text-primary font-medium bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs text-muted-foreground">{cat.productCount}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Mobile Sidebar */}
          {sidebarOpen && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-background shadow-2xl p-6 md:hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-serif text-xl">Filters</h3>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => { setActiveCategory(""); setSidebarOpen(false); }}
                  className={`w-full text-left py-3 px-3 text-sm border-l-2 ${!activeCategory ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground"}`}
                >
                  All Collections
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.name); setSidebarOpen(false); }}
                    className={`w-full text-left py-3 px-3 text-sm border-l-2 ${activeCategory === cat.name ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-6">
              {sortedProducts.length} pieces {activeCategory ? `in ${activeCategory}` : "in all collections"}
            </p>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-muted mb-4" />
                    <div className="h-4 bg-muted w-3/4 mb-2" />
                    <div className="h-3 bg-muted w-1/2" />
                  </div>
                ))}
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-24">
                <p className="font-serif text-2xl text-muted-foreground mb-4">No pieces found</p>
                <button onClick={() => { setActiveCategory(""); setSearchQuery(""); }} className="text-primary text-sm tracking-widest uppercase border-b border-primary pb-1">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
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
