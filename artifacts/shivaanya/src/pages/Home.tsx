import { Link } from "wouter";
import { useRef, useState, useEffect, type CSSProperties } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useInView, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, Star, ChevronLeft, ChevronRight, Truck, Sparkles as SparklesIcon, RefreshCw, ShieldCheck } from "lucide-react";
import {
  getFilteredProducts,
  getProductById,
  mockCategories,
  getListingCardImages,
} from "@/data/products";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/lib/mediaUrl";
import { ReturnPolicySection } from "@/components/layout/ReturnPolicySection";

/* ──────────────────────────────── Shared Animations ───────────────────────────── */

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function ScaleIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ──────────────────────────────── 3D Tilt Card ───────────────────────────── */

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });

  function handleMouse(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ──────────────────────────────── Hero Section ───────────────────────────── */

const lehengaCategoryVideoUrl =
  mockCategories.find((c) => c.name === "Lehengas")?.videoUrl ?? "/media/Lehenga.mp4";

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative h-screen overflow-hidden" id="hero-section">
      {/* Parallax Background */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 scale-110">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={mediaUrl(lehengaCategoryVideoUrl)} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50" />
      </motion.div>

      {/* Content */}
      <motion.div style={{ opacity }} className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 sm:px-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-white/60 text-xs tracking-[0.4em] uppercase mb-6"
        >
          Handcrafted with Heritage
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-[clamp(2.125rem,6.25vw,3rem)] sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight max-w-[min(92vw,56rem)] leading-[1.05]"
        >
          Elegance in
          <br />
          Every Thread
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-6 text-white/60 text-sm md:text-base max-w-md tracking-wide leading-relaxed"
        >
          Discover curated collections of premium ethnic wear — from heirloom sarees to bridal lehengas.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 items-center justify-center"
        >
          <Link
            href="/shop"
            id="hero-shop-btn"
            className="inline-flex items-center gap-2 bg-white text-black px-8 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase rounded-full hover:bg-white/90 transition-all hover:scale-105 active:scale-95"
          >
            Shop Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2"
        >
          <div className="w-1 h-2 bg-white/60 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ──────────────────────────────── Brand Intro ───────────────────────────── */

function BrandIntro() {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-[#fafafa] relative overflow-hidden" id="brand-intro">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 xl:gap-24 items-center">
          
          {/* Collage Side */}
          <div className="relative h-[420px] sm:h-[480px] md:h-[560px] w-full mt-8 lg:mt-0 order-2 lg:order-1">
            <FadeUp delay={0.1} className="absolute left-0 top-0 w-2/3 h-4/5 rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={mediaUrl("/media/user-products/product1/img-01.webp")}
                alt="Artisan Craftsmanship" 
                className="w-full h-full object-cover"
              />
            </FadeUp>
            <FadeUp delay={0.3} className="absolute right-0 bottom-0 w-2/3 h-3/5 rounded-2xl overflow-hidden shadow-2xl border-4 border-[#fafafa]">
              <img 
                src={mediaUrl("/media/user-products/product1/img-10.webp")}
                alt="Intricate details" 
                className="w-full h-full object-cover"
              />
            </FadeUp>
            
            {/* Floating Badge */}
            <FadeUp delay={0.5} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full w-32 h-32 flex items-center justify-center p-2 shadow-xl hidden md:flex">
              <div className="border border-black/10 w-full h-full rounded-full flex flex-col items-center justify-center">
                <span className="text-xl font-bold">Est.</span>
                <span className="text-[10px] tracking-widest text-black/50">2005</span>
              </div>
            </FadeUp>
          </div>

          {/* Text Side */}
          <div className="order-1 lg:order-2">
            <FadeUp>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-black w-12" />
                <p className="text-xs tracking-[0.3em] uppercase text-black/40">Our Story</p>
              </div>
              <h2 className="text-[clamp(1.75rem,5vw,2.75rem)] sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black leading-[1.15] tracking-tight mb-6 sm:mb-8">
                Where Tradition
                <br />
                <span className="italic font-light">Meets Modern</span>
                <br />
                Elegance
              </h2>
            </FadeUp>

            <FadeUp delay={0.2}>
              <p className="text-black/60 text-base md:text-lg leading-relaxed mb-6">
                At Shivaanya, we curate the finest handcrafted ethnic wear from master artisans across India. Every piece tells a story of centuries-old craftsmanship — from the intricate silk weavers of Varanasi to the meticulous embroiderers of Lucknow.
              </p>
              <p className="text-black/60 text-sm leading-relaxed mb-10">
                We believe in preserving heritage while embracing contemporary silhouettes, bringing you timeless heirlooms that celebrate the modern woman's spirit.
              </p>
              
              <div className="grid grid-cols-3 gap-8 py-8 border-y border-black/5">
                <div>
                  <p className="text-3xl font-bold text-black mb-1">200+</p>
                  <p className="text-[10px] tracking-wider uppercase text-black/40">Artisans</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-black mb-1">15+</p>
                  <p className="text-[10px] tracking-wider uppercase text-black/40">Regions</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-black mb-1">5K+</p>
                  <p className="text-[10px] tracking-wider uppercase text-black/40">Clients</p>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────── Featured Products ───────────────────────────── */

function ProductCard3D({
  product,
  index,
  variant = "default",
}: {
  product: any;
  index: number;
  variant?: "default" | "featured";
}) {
  const productImages = getListingCardImages(product);

  const galleryFingerprint =
    `${product.id}|${variant}|${product.listingHeroImage ?? ""}|${
      Array.isArray(product.images) ? product.images.join("\u0001") : String(product.imageUrl)
    }`;

  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    setCarouselIndex(0);
  }, [galleryFingerprint]);

  const currentImageSrc =
    productImages.length > 0 ? productImages[Math.min(carouselIndex, productImages.length - 1)] : product.imageUrl;

  const canManualGallery = productImages.length > 1;

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
    <FadeUp delay={index * 0.1}>
      <TiltCard className="cursor-pointer group">
        <Link href={`/product/${product.id}`} className="block">
            <div className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden bg-[#f5f5f5]">
              <div className="relative w-full h-full overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={`${galleryFingerprint}-${carouselIndex}`}
                    src={mediaUrl(currentImageSrc)}
                    alt={product.name}
                    initial={{ opacity: 0, filter: "blur(8px)", scale: 1.04 }}
                    animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                    exit={{ opacity: 0, filter: "blur(8px)", scale: 1.02 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </AnimatePresence>
              </div>
            {/* Overlay on hover */}
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-all duration-500 group-hover:bg-black/20" />

            {canManualGallery && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-sm backdrop-blur-sm transition-opacity hover:bg-white opacity-70 hover:opacity-100 md:opacity-95"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={goNext}
                  className="absolute right-2 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-sm backdrop-blur-sm transition-opacity hover:bg-white opacity-70 hover:opacity-100 md:opacity-95"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
            {/* Badges */}
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 flex flex-col gap-1 pointer-events-none">
              {product.isNew && (
                <span className="bg-black text-white text-[10px] font-semibold tracking-[0.15em] uppercase px-3 py-1 rounded-full">
                  New
                </span>
              )}
              {product.isBestseller && (
                <span className="bg-white text-black text-[10px] font-semibold tracking-[0.15em] uppercase px-3 py-1 rounded-full">
                  Bestseller
                </span>
              )}
            </div>

            {/* Quick view button */}
            <div className="absolute bottom-3 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 md:opacity-0 md:translate-y-3 md:group-hover:opacity-100 md:group-hover:translate-y-0 opacity-95 translate-y-0 transition-all duration-400">
              <span className="block text-center bg-white text-black text-[10px] sm:text-xs font-semibold tracking-[0.15em] uppercase py-2 sm:py-3 rounded-full hover:bg-black hover:text-white transition-colors">
                View Details
              </span>
            </div>
          </div>

          <div className="mt-2.5 sm:mt-4 space-y-0.5 sm:space-y-1">
            <p className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-black/40">{product.categoryName}</p>
            <h3 className="text-[13px] sm:text-sm font-semibold text-black line-clamp-2 sm:line-clamp-1 group-hover:opacity-60 transition-opacity leading-snug">
              {product.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-black">₹{product.price.toLocaleString("en-IN")}</span>
              {product.originalPrice && (
                <span className="text-xs text-black/30 line-through">₹{product.originalPrice.toLocaleString("en-IN")}</span>
              )}
            </div>
          </div>
        </Link>
      </TiltCard>
    </FadeUp>
  );
}

function FeaturedProducts({ products }: { products: any[] }) {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-[#fafafa]" id="featured-products">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 md:mb-12">
          <FadeUp>
            <p className="text-xs tracking-[0.3em] uppercase text-black/40 mb-3">Curated For You</p>
            <h2 className="text-3xl md:text-5xl font-bold text-black tracking-tight">
              Featured Collection
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <Link
              href="/shop"
              className="mt-6 md:mt-0 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-black hover:opacity-60 transition-opacity"
              id="featured-view-all"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </FadeUp>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 lg:gap-6 md:[perspective:1200px]">
          {products.map((product, i) => (
            <ProductCard3D key={product.id} product={product} index={i} variant="featured" />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────── Category Showcase (Split) ───────────────────────────── */

function CategoryShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);

  return (
    <section ref={ref} className="py-0 bg-white" id="category-showcase">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[min(80vh,720px)] lg:min-h-[80vh]">
        {/* Image Side */}
        <div className="relative overflow-hidden aspect-[4/5] sm:aspect-square lg:aspect-auto max-h-[min(56vh,420px)] sm:max-h-none">
          <motion.img
            style={{ y: imgY }}
            src={mediaUrl("/media/img_20260314_wa1233.jpg.jpeg")}
            alt="Bridal look — Shivaanya bride"
            className="absolute inset-0 w-full h-[120%] object-cover"
          />
        </div>

        {/* Text Side */}
        <div className="flex items-center justify-center p-8 sm:p-12 md:p-16 lg:p-20 bg-black">
          <FadeUp>
            <div className="max-w-md">
              <p className="text-xs tracking-[0.3em] uppercase text-white/40 mb-4">Bridal Edit</p>
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-6">
                Your Dream
                <br />
                Bridal Look
              </h2>
              <p className="text-white/50 text-sm leading-relaxed mb-8">
                Curated bridal lehengas, sarees, and ensembles crafted for the most important day of your life.
                Each piece is an heirloom in the making.
              </p>
              <Link
                href="/shop?category=Lehengas"
                id="bridal-shop-btn"
                className="inline-flex items-center gap-2 bg-white text-black px-8 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase rounded-full hover:bg-white/90 transition-all hover:scale-105 active:scale-95"
              >
                Explore Bridal
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────── New Arrivals ───────────────────────────── */

function NewArrivals({ products }: { products: any[] }) {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-white" id="new-arrivals">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="text-center mb-10 md:mb-14">
          <FadeUp>
            <p className="text-xs tracking-[0.3em] uppercase text-black/40 mb-3">Just Dropped</p>
            <h2 className="text-3xl md:text-5xl font-bold text-black tracking-tight">
              New Arrivals
            </h2>
          </FadeUp>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 lg:gap-6 md:[perspective:1200px]">
          {products.map((product, i) => (
            <ProductCard3D key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────── Testimonials ───────────────────────────── */

const testimonials = [
  {
    name: "Priya Sharma",
    text: "The Banarasi saree I ordered is absolutely stunning. The quality surpassed all my expectations. Truly an heirloom piece!",
    rating: 5,
    location: "Mumbai",
  },
  {
    name: "Ananya Gupta",
    text: "My bridal lehenga from Shivaanya was the highlight of my wedding. The craftsmanship is unmatched. Everyone was asking where I got it!",
    rating: 5,
    location: "Delhi",
  },
  {
    name: "Meera Patel",
    text: "I've been a loyal customer for 2 years now. The quality is consistently exceptional and the customer service is wonderful.",
    rating: 5,
    location: "Bangalore",
  },
  {
    name: "Kavita Reddy",
    text: "Ordered an anarkali for my cousin's reception — stitching, embroidery, and the fabric feel exactly like the listing. Dispatch was quicker than promised.",
    rating: 5,
    location: "Hyderabad",
  },
  {
    name: "Ritika Desai",
    text: "The georgette saree with blouse work is gorgeous in person; drape stays crisp through a long outdoor function. Will shop again before Diwali.",
    rating: 5,
    location: "Pune",
  },
  {
    name: "Neha Srinivasan",
    text: "Team helped me choose a pastel lehenga for a day wedding — sizing notes were accurate and the dupatta edging was immaculate. Truly stress-free.",
    rating: 5,
    location: "Chennai",
  },
  {
    name: "Simran Kaur",
    text: "Palazzo set looks exactly like the video; mirror work catches light beautifully. My mum already asked me to bookmark Shivaanya for her next order.",
    rating: 5,
    location: "Chandigarh",
  },
];

function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const collageImages = [
    "/media/1236_moni_1.jpg",
    "/media/1234_model_1.jpg",
    "/media/1236_moni_2.jpg",
    "/media/1234_model_2.jpg",
    "/media/1236_moni_3.jpg",
    "/media/1234_model_3.jpg",
    "/media/1236_moni_5.jpg",
    "/media/1234_model_4.jpg"
  ];

  return (
    <section className="relative py-16 md:py-24 lg:py-32 bg-black overflow-hidden" id="testimonials">
      {/* Background Collage */}
      <div className="absolute inset-0 opacity-40">
        <div className="grid grid-cols-4 gap-2 h-full w-full opacity-50 scale-110 rotate-[-2deg]">
          {collageImages.map((src, i) => (
            <motion.img 
              key={i} 
              src={mediaUrl(src)} 
              className="w-full h-full object-cover blur-[2px]" 
              animate={{ y: [0, i % 2 === 0 ? -20 : 20, 0] }}
              transition={{ duration: 15 + i*2, repeat: Infinity, ease: "linear" }}
              alt="Happy customer" 
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black z-0" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        <FadeUp>
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-3">What Our Customers Say</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Testimonials
            </h2>
          </div>
        </FadeUp>

        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={handlePrev} className="text-white/50 hover:text-white transition-all hover:scale-110 p-2 hidden md:block">
            <ChevronLeft className="w-10 h-10" />
          </button>

          <div className="flex-1 text-center px-4 md:px-12">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              {/* Stars */}
              <div className="flex justify-center gap-1 mb-6">
                {Array.from({ length: testimonials[activeIndex].rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-white text-white" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-lg sm:text-xl md:text-3xl font-light text-white leading-relaxed mb-8 italic px-1">
                "{testimonials[activeIndex].text}"
              </p>

              {/* Author */}
              <p className="text-sm font-bold text-white tracking-[0.2em] uppercase">
                {testimonials[activeIndex].name}
              </p>
              <p className="text-xs text-white/50 tracking-widest mt-1 uppercase">
                {testimonials[activeIndex].location}
              </p>
            </motion.div>
          </div>

          <button onClick={handleNext} className="text-white/50 hover:text-white transition-all hover:scale-110 p-2 hidden md:block">
            <ChevronRight className="w-10 h-10" />
          </button>
        </div>

        {/* Mobile controls & Dots */}
        <div className="flex items-center justify-center gap-6 mt-12">
          <button onClick={handlePrev} className="text-white/50 hover:text-white transition-colors p-2 md:hidden">
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex gap-3">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`w-2 h-2 rounded-full transition-all duration-500 ${
                  i === activeIndex ? "bg-white w-8" : "bg-white/20 hover:bg-white/50"
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>

          <button onClick={handleNext} className="text-white/50 hover:text-white transition-colors p-2 md:hidden">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────── Instagram Section ───────────────────────────── */

function InstagramSection() {
  /** Mix silhouettes/sources so the strip reads like a curated feed, not duplicate catalogue angles */
  const posts = [
    { src: "/media/catalog/sarees/sarees-product1/img004.jpg", type: "image" as const, alt: "Saree drape styling" },
    { src: "/media/catalog/lehengas/lehengas-product10/img005.webp", type: "image" as const, alt: "Festive lehenga set" },
    { src: "/media/catalog/anarkalis/anarkalis-product4/img003.webp", type: "image" as const, alt: "Anarkali suit look" },
    { src: "/media/catalog/palazzo_sets/plazo-set-product2/img006.jpg", type: "image" as const, alt: "Kurta plazzo silhouette" },
    { src: "/media/user-products/product1/img-05.webp", type: "image" as const, alt: "Bridal ensemble detail" },
    { src: "/media/catalog/sarees/sarees-product3/img002.jpg", type: "image" as const, alt: "Saree blouse pairing" },
    { src: "/media/mp3_rp_purple_1.jpg", type: "image" as const, alt: "Printed chinon saree" },
    { src: "/media/catalog/lehengas/lehengas-product11/img004.jpg", type: "image" as const, alt: "Occasion lehenga" },
    {
      src: "/media/catalog/sarees/sarees-product1/vdo001.mp4",
      type: "video" as const,
      alt: "Behind the drape reel",
    },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 md:py-24 lg:py-32 bg-[#fafafa] overflow-hidden" id="instagram-section">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 mb-10 md:mb-12 flex flex-col md:flex-row md:items-end md:justify-between">
        <FadeUp>
          <p className="text-xs tracking-[0.3em] uppercase text-black/40 mb-3">Follow Along</p>
          <h2 className="text-3xl md:text-5xl font-bold text-black tracking-tight">
            @shivaanyacollection
          </h2>
        </FadeUp>
        <FadeUp delay={0.1}>
          <a
            href="https://www.instagram.com/shivaanya.collection?igsh=NGN3eW05cXNhZGN1"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 md:mt-0 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-black hover:opacity-60 transition-opacity"
          >
            Follow Us On Instagram
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </FadeUp>
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        {/* Navigation Buttons */}
        <button 
          onClick={() => scroll("left")} 
          className="absolute left-0 lg:left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-[0_0_20px_rgba(0,0,0,0.1)] flex items-center justify-center text-black/50 hover:text-black hover:scale-110 transition-all border border-black/5 hidden md:flex"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button 
          onClick={() => scroll("right")} 
          className="absolute right-0 lg:right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-[0_0_20px_rgba(0,0,0,0.1)] flex items-center justify-center text-black/50 hover:text-black hover:scale-110 transition-all border border-black/5 hidden md:flex"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-8 snap-x no-scrollbar md:px-4" 
          style={{ scrollbarWidth: 'none', scrollBehavior: 'smooth' }}
        >
          {posts.map((post, i) => (
            <FadeUp key={i} delay={i * 0.1} className="flex-none snap-center">
              <div className="relative w-52 sm:w-60 md:w-72 lg:w-80 aspect-[4/5] bg-black/5 rounded-2xl overflow-hidden group cursor-pointer shadow-sm border border-black/5">
                {post.type === "video" ? (
                  <video src={mediaUrl(post.src)} autoPlay muted loop playsInline className="w-full h-full object-cover scale-[1.15] origin-top transition-transform duration-700 group-hover:scale-[1.20]" />
                ) : (
                  <img src={mediaUrl(post.src)} alt={post.alt ?? "Instagram post"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                )}

                {/* Instagram Icon */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                  {post.type === "video" ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01"/></svg>
                  )}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────── Marquee Strip ───────────────────────────── */

function MarqueeStrip() {
  const items = [
    "Free Shipping Over ₹5,000",
    "★",
    "Handcrafted with Love",
    "★",
    "200+ Artisans",
    "★",
    "Premium Quality",
    "★",
    "Easy Returns",
    "★",
    "Authentic Craftsmanship",
    "★",
  ];

  return (
    <div className="bg-black text-white py-3 overflow-hidden" id="marquee-strip">
      <div className="animate-marquee flex whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="mx-6 text-[11px] tracking-[0.25em] uppercase font-medium text-white/70"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────── Categories Grid ───────────────────────────── */

function CategoriesGrid() {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-white" id="categories-grid">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="text-center mb-14">
          <FadeUp>
            <p className="text-xs tracking-[0.3em] uppercase text-black/40 mb-3">Browse By</p>
            <h2 className="text-3xl md:text-5xl font-bold text-black tracking-tight">
              Shop by Category
            </h2>
          </FadeUp>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {mockCategories.map((cat, i) => (
            <FadeUp key={cat.id} delay={i * 0.1}>
              <Link
                href={`/shop?category=${encodeURIComponent(cat.name)}`}
                className="group block relative overflow-hidden aspect-[4/5] md:aspect-[3/4]"
                style={
                  {
                    "--cat-v-scale": String(cat.videoCoverScale ?? 1.35),
                    "--cat-v-scale-hover": String(
                      cat.videoCoverScaleHover ?? (cat.videoCoverScale ?? 1.35) + 0.1,
                    ),
                  } as CSSProperties
                }
              >
                {cat.videoUrl ? (
                  <video
                    src={mediaUrl(cat.videoUrl)}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className={cn(
                      "w-full h-full object-cover scale-[var(--cat-v-scale)] transition-transform duration-700 group-hover:scale-[var(--cat-v-scale-hover)]",
                      cat.videoScaleOrigin === "bottom"
                        ? "origin-bottom"
                        : cat.videoScaleOrigin === "center"
                          ? "origin-center"
                          : "origin-top",
                    )}
                    style={cat.videoObjectPosition ? { objectPosition: cat.videoObjectPosition } : undefined}
                  />
                ) : (
                  <img
                    src={mediaUrl(cat.imageUrl)}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all duration-500" />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <h3 
                    className="text-white text-2xl md:text-3xl font-bold tracking-wider uppercase drop-shadow-md"
                    style={{ color: "white", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
                  >
                    {cat.name}
                  </h3>
                  <p 
                    className="text-white/90 text-xs tracking-[0.2em] uppercase mt-2 drop-shadow-md"
                    style={{ color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                  >
                    {cat.productCount} Pieces
                  </p>
                </div>
              </Link>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────── CTA Banner ───────────────────────────── */

function CTABanner() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]);

  return (
    <section ref={ref} className="relative py-24 md:py-36 lg:py-44 overflow-hidden" id="cta-banner">
      <motion.div style={{ y: bgY }} className="absolute inset-0 scale-110">
        <img
          src={mediaUrl("/media/1236_real_2.jpg")}
          alt="Designer collection"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </motion.div>

      <div className="relative z-10 text-center px-4 sm:px-6">
        <FadeUp>
          <p className="text-white/50 text-xs tracking-[0.3em] uppercase mb-4">Limited Time Offer</p>
          <h2 className="text-[clamp(1.75rem,5vw,2.75rem)] md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.08] mb-5 sm:mb-6 max-w-3xl mx-auto px-1">
            10% Off Your First Order
          </h2>
          <p className="text-white/50 text-sm md:text-base max-w-md mx-auto mb-10 leading-relaxed">
            Use code <span className="text-white font-semibold">HELLO10</span> at checkout. Valid on all collections.
          </p>
          <Link
            href="/shop"
            id="cta-shop-btn"
            className="inline-flex items-center gap-2 bg-white text-black px-10 py-4 text-xs font-semibold tracking-[0.2em] uppercase rounded-full hover:bg-white/90 transition-all hover:scale-105 active:scale-95"
          >
            Start Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </FadeUp>
      </div>
    </section>
  );
}

/* ──────────────────────────────── Trust Badges ───────────────────────────── */

function TrustBadges() {
  const badges = [
    { title: "Complimentary Delivery", desc: "On premium orders over ₹5,000", icon: Truck },
    { title: "Master Craftsmanship", desc: "Hand-finished by local artisans", icon: SparklesIcon },
    { title: "Seamless Returns", desc: "7-day returns — unboxing video & tags required", icon: RefreshCw },
    { title: "Secure Transactions", desc: "100% encrypted checkout process", icon: ShieldCheck },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#fafafa]" id="trust-badges">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-stretch">
          {badges.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <FadeUp key={badge.title} delay={i * 0.1} className="h-full">
                <div className="group bg-white p-7 sm:p-9 md:p-10 flex flex-col items-center text-center rounded-2xl hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] transition-all duration-500 border border-black/[0.03] h-full">
                  <div className="w-16 h-16 rounded-full bg-[#fdfdfd] border border-black/5 flex items-center justify-center mb-6 group-hover:-translate-y-2 group-hover:bg-black group-hover:text-white transition-all duration-500 shadow-sm shrink-0">
                    <Icon className="w-6 h-6 transition-colors duration-500" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-bold text-black tracking-wide mb-2">{badge.title}</h3>
                  <p className="text-sm text-black/50 leading-relaxed max-w-[200px]">{badge.desc}</p>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────── Satisfied Customers Gallery ───────────────────────────── */

function SatisfiedCustomersGallery() {
  const [activeIndex, setActiveIndex] = useState<number>(4);

  const galleryImages = [
    { src: "/media/user-products/product1/img-06.webp", title: "Wedding Editorial — Rose Lehenga" },
    { src: "/media/user-products/product4/img-02.webp", title: "Designer Anarkali — On Location" },
    { src: "/media/user-products/product5/img-08.webp", title: "Festive Lehenga — Real Modelling" },
    { src: "/media/user-products/product2/img-06.webp", title: "Readymade Lehenga Look" },
    { src: "/media/user-products/product6/img-03.webp", title: "Flame Collection — Full Flare" },
    { src: "/media/user-products/product3/img-04.webp", title: "Heritage Silk — Bridal Drape" },
    { src: "/media/catalog/lehengas/lehengas-product8/img003.jpg", title: "Lehengas · Product 8 — Look" },
    { src: "/media/user-products/product5/img-11.webp", title: "Haldi & Hues — Pastel Set" },
    { src: "/media/user-products/product2/img-03.webp", title: "Evening Reception — Studio Look" },
    { src: "/media/catalog/lehengas/lehengas-product7/img003.jpg", title: "Lehengas · Product 7 — Look" },
  ];

  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden" id="customer-gallery">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        <FadeUp>
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-black/40 mb-3">Shivaanya Brides</p>
            <h2 className="text-3xl md:text-5xl font-bold text-black tracking-tight">
              Gallery of Happiness
            </h2>
          </div>
        </FadeUp>

        {/* Mobile only (max-md): ~60% taller total height than min(520px,68vh) so stacked strips show more image */}
        <div className="flex flex-col lg:flex-row h-[min(520px,68vh)] md:h-[min(560px,58vh)] lg:h-[500px] max-md:h-[min(832px,109vh)] w-full gap-2 max-md:gap-3 lg:gap-4">
          {galleryImages.map((img, idx) => {
            const isActive = activeIndex === idx;
            
            return (
              <motion.div
                key={idx}
                className="relative overflow-hidden rounded-2xl cursor-pointer shadow-lg group"
                animate={{
                  flex: isActive ? (typeof window !== "undefined" && window.innerWidth < 1024 ? 3 : 5) : 1
                }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => setActiveIndex(idx)}
                style={{ flex: isActive ? 5 : 1 }}
              >
                <img
                  src={mediaUrl(img.src)}
                  alt={img.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent transition-opacity duration-500",
                  isActive ? "opacity-100" : "opacity-30"
                )} />
                
                <div className="absolute bottom-6 left-6 right-6">
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : 0,
                      y: isActive ? 0 : 20
                    }}
                    transition={{ duration: 0.5, delay: isActive ? 0.2 : 0 }}
                    className="flex flex-col gap-1 overflow-hidden"
                  >
                    <span className="text-white text-xl md:text-2xl font-semibold tracking-wide whitespace-nowrap">
                      {img.title}
                    </span>
                    <span className="text-white/70 text-xs uppercase tracking-[0.2em] whitespace-nowrap">
                      Satisfied Customer
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────── Main Page ───────────────────────────── */

export default function Home() {
  // Keep homepage products distinct: each shown only once.
  const uniqueShowcaseProducts = getFilteredProducts().slice(0, 8);
  /** Fourth featured slot: catalog Lehengas product3 (hero img007) instead of user Product 5. */
  const catalogLehengaProduct3 = getProductById(106);
  const featuredProducts =
    catalogLehengaProduct3 && uniqueShowcaseProducts.length >= 4
      ? [...uniqueShowcaseProducts.slice(0, 3), catalogLehengaProduct3]
      : uniqueShowcaseProducts.slice(0, 4);
  const newArrivalProducts = uniqueShowcaseProducts.slice(4, 8);

  return (
    <div className="bg-white">
      <Hero />
      <MarqueeStrip />
      <CategoriesGrid />
      <BrandIntro />
      <FeaturedProducts products={featuredProducts} />
      <CategoryShowcase />
      <NewArrivals products={newArrivalProducts} />
      <SatisfiedCustomersGallery />
      <Testimonials />
      <InstagramSection />
      <CTABanner />
      <TrustBadges />
      <ReturnPolicySection />
    </div>
  );
}
