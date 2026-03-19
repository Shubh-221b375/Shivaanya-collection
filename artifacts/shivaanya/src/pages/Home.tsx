import { useRef, useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { ArrowRight, Star, ChevronDown, Sparkles, Gem, Heart } from "lucide-react";
import { useListProducts, useListCategories } from "@workspace/api-client-react";

function ParallaxHero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <div ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden bg-[#1a0a05]">
      {/* Parallax background layers */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 z-0"
      >
        <img
          src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600&auto=format&fit=crop&q=80"
          alt="Hero"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a05]/60 via-[#1a0a05]/30 to-[#1a0a05]/80" />
      </motion.div>

      {/* Floating mandala overlay */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 z-0 opacity-5"
        style={{ backgroundImage: "radial-gradient(circle, #c9a227 1px, transparent 1px)", backgroundSize: "60px 60px" }}
      />

      {/* Content */}
      <motion.div style={{ y: textY, opacity }} className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.5em" }}
          animate={{ opacity: 1, letterSpacing: "0.3em" }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="text-accent text-sm font-light tracking-[0.3em] uppercase mb-6"
        >
          est. 2018 · handcrafted in india
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-6xl md:text-8xl lg:text-9xl text-white font-light leading-none mb-6"
        >
          Shiv<span className="text-accent italic">aanya</span>
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="w-24 h-[1px] bg-accent mx-auto mb-8"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="text-white/70 font-serif italic text-xl md:text-2xl lg:text-3xl mb-12 font-light"
        >
          Elegance in Every Thread.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/shop"
            className="group inline-flex items-center gap-3 bg-accent text-foreground px-10 py-4 text-sm font-medium tracking-widest uppercase hover:bg-accent/90 transition-all duration-300"
          >
            Explore Collection
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/shop?category=Sarees"
            className="inline-flex items-center gap-2 border border-white/30 text-white px-10 py-4 text-sm font-light tracking-widest uppercase hover:border-accent hover:text-accent transition-all duration-300"
          >
            Heritage Sarees
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
      >
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </div>
  );
}

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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

function ProductCard({ product }: { product: any }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 15;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -15;
    ref.current.style.transform = `perspective(1000px) rotateX(${y}deg) rotateY(${x}deg) scale(1.02)`;
  };

  const handleMouseLeave = () => {
    if (ref.current) {
      ref.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
    }
    setHovered(false);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setHovered(true)}
      className="group relative bg-card rounded-sm overflow-hidden cursor-pointer"
      style={{ transition: "transform 0.15s ease-out", transformStyle: "preserve-3d" }}
    >
      <Link href={`/product/${product.id}`}>
        <div className="aspect-[3/4] overflow-hidden relative">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className={`absolute inset-0 bg-foreground/60 transition-opacity duration-300 flex items-end p-6 ${hovered ? "opacity-100" : "opacity-0"}`}>
            <div className="text-white w-full">
              <p className="text-sm font-light tracking-wide mb-1">{product.fabric}</p>
              {product.craftRegion && (
                <p className="text-xs text-white/60 flex items-center gap-1">
                  <Gem className="w-3 h-3" /> {product.craftRegion}
                </p>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {product.isNew && (
              <span className="bg-accent text-foreground text-[10px] font-semibold tracking-widest uppercase px-2 py-1">
                New
              </span>
            )}
            {product.isBestseller && (
              <span className="bg-foreground text-background text-[10px] font-semibold tracking-widest uppercase px-2 py-1">
                Bestseller
              </span>
            )}
            {product.originalPrice && (
              <span className="bg-red-700 text-white text-[10px] font-semibold tracking-widest uppercase px-2 py-1">
                Sale
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button className="absolute top-3 right-3 w-8 h-8 bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors opacity-0 group-hover:opacity-100">
            <Heart className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">{product.categoryName}</p>
          <h3 className="font-serif text-lg text-foreground leading-tight mb-2 line-clamp-1">{product.name}</h3>
          <div className="flex items-center gap-1 mb-3">
            <Star className="w-3 h-3 fill-accent text-accent" />
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-xl font-semibold text-primary">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{product.originalPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

function StorySection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <section ref={ref} className="relative py-32 overflow-hidden bg-[#1a0a05]">
      <motion.div style={{ y: bgY }} className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=1400&auto=format&fit=crop&q=80"
          alt="Craft story"
          className="w-full h-full object-cover opacity-20"
        />
      </motion.div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <FadeInSection>
          <p className="text-accent text-xs tracking-[0.4em] uppercase mb-6">Our Heritage</p>
          <h2 className="font-serif text-4xl md:text-6xl text-white font-light leading-tight mb-8">
            Where Ancient Craft<br />Meets Modern Soul
          </h2>
          <div className="w-16 h-[1px] bg-accent mx-auto mb-10" />
          <p className="text-white/60 font-light text-lg leading-relaxed max-w-3xl mx-auto mb-12">
            Every piece in our collection carries the fingerprints of master artisans who learned their craft from their mothers, who learned from theirs. We travel across India — from the silk looms of Varanasi to the embroidery ateliers of Lucknow — to bring you textiles that are alive with story.
          </p>
        </FadeInSection>

        <FadeInSection delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
            {[
              { icon: "✦", title: "200+ Artisan Families", desc: "Directly supporting traditional craftspeople across India" },
              { icon: "✦", title: "Ancient Techniques", desc: "Preserving weaving and embroidery arts over 500 years old" },
              { icon: "✦", title: "Sustainable Fashion", desc: "Natural dyes, ethical sourcing, zero-waste production" },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <span className="text-accent text-2xl mb-4 block">{item.icon}</span>
                <h3 className="font-serif text-xl text-white mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm font-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}

export default function Home() {
  const { data: featuredProducts = [] } = useListProducts({ featured: true });
  const { data: categories = [] } = useListCategories();
  const { data: newProducts = [] } = useListProducts({ isNew: true });

  return (
    <div className="bg-background">
      <ParallaxHero />

      {/* Brand values strip */}
      <div className="bg-foreground text-background py-4 overflow-hidden">
        <div className="flex items-center gap-16 animate-marquee whitespace-nowrap">
          {["Free Shipping Over ₹5,000", "Authentic Handcrafted", "Easy 30-Day Returns", "COD Available", "Artisan Guaranteed", "Free Shipping Over ₹5,000", "Authentic Handcrafted", "Easy 30-Day Returns", "COD Available", "Artisan Guaranteed"].map((text, i) => (
            <span key={i} className="text-xs tracking-widest uppercase text-background/70 flex items-center gap-4">
              <Sparkles className="w-3 h-3 text-accent" />
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-16">
            <p className="text-xs text-accent tracking-[0.4em] uppercase mb-4">Curated for You</p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">Featured Collection</h2>
            <div className="w-12 h-[1px] bg-accent mx-auto mt-6" />
          </div>
        </FadeInSection>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {featuredProducts.slice(0, 8).map((product, i) => (
            <FadeInSection key={product.id} delay={i * 0.08}>
              <ProductCard product={product} />
            </FadeInSection>
          ))}
        </div>

        <FadeInSection delay={0.3}>
          <div className="text-center mt-12">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 border-b border-foreground text-foreground pb-1 text-sm tracking-widest uppercase hover:text-primary hover:border-primary transition-all"
            >
              View All Collections <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </FadeInSection>
      </section>

      <StorySection />

      {/* Categories */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-16">
              <p className="text-xs text-accent tracking-[0.4em] uppercase mb-4">Explore</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">Shop by Category</h2>
              <div className="w-12 h-[1px] bg-accent mx-auto mt-6" />
            </div>
          </FadeInSection>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {categories.map((cat, i) => (
              <FadeInSection key={cat.id} delay={i * 0.1}>
                <Link
                  href={`/shop?category=${cat.name}`}
                  className="group relative overflow-hidden aspect-[4/3] block"
                >
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a05]/80 via-[#1a0a05]/20 to-transparent transition-all duration-300 group-hover:via-[#1a0a05]/40" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-serif text-2xl md:text-3xl text-white font-light mb-1 group-hover:text-accent transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-white/60 text-xs tracking-widest uppercase">{cat.productCount} pieces</p>
                    <div className="h-[1px] bg-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left mt-3" />
                  </div>
                </Link>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {newProducts.length > 0 && (
        <section className="py-24 bg-card/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeInSection>
              <div className="text-center mb-16">
                <p className="text-xs text-accent tracking-[0.4em] uppercase mb-4">Just Arrived</p>
                <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">New Arrivals</h2>
                <div className="w-12 h-[1px] bg-accent mx-auto mt-6" />
              </div>
            </FadeInSection>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {newProducts.slice(0, 4).map((product, i) => (
                <FadeInSection key={product.id} delay={i * 0.1}>
                  <ProductCard product={product} />
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-16">
            <p className="text-xs text-accent tracking-[0.4em] uppercase mb-4">What Our Patrons Say</p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">Stories of Elegance</h2>
            <div className="w-12 h-[1px] bg-accent mx-auto mt-6" />
          </div>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Priya Sharma", loc: "Mumbai", quote: "The Kanjivaram saree I received was beyond my expectations. Every thread speaks of artistry. I felt truly royal at my brother's wedding.", rating: 5 },
            { name: "Ananya Iyer", loc: "Chennai", quote: "Shivaanya's bridal lehenga made my wedding day magical. The quality, the embroidery, the fit — everything was absolutely perfect.", rating: 5 },
            { name: "Deepika Nair", loc: "Bangalore", quote: "I love how each piece comes with its own story of the artisan and the craft region. Wearing these feels like wearing a piece of India's soul.", rating: 5 },
          ].map((t, i) => (
            <FadeInSection key={i} delay={i * 0.15}>
              <div className="glass p-8 rounded-sm">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-3 h-3 fill-accent text-accent" />
                  ))}
                </div>
                <p className="font-serif italic text-foreground/80 text-lg leading-relaxed mb-6">"{t.quote}"</p>
                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-muted-foreground text-xs">{t.loc}</p>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden bg-[#1a0a05]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #c9a227 0%, transparent 70%)" }} />
        </div>
        <div className="relative z-10 text-center max-w-3xl mx-auto px-4">
          <FadeInSection>
            <h2 className="font-serif text-4xl md:text-6xl text-white font-light mb-6">
              Begin Your Story in<br /><span className="text-accent italic">Shivaanya</span>
            </h2>
            <p className="text-white/60 font-light mb-12 text-lg">
              Discover curated collections that celebrate India's most exquisite textile traditions.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-3 bg-accent text-foreground px-12 py-5 text-sm font-medium tracking-widest uppercase hover:bg-accent/90 transition-all duration-300 group"
            >
              Shop Now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
}
