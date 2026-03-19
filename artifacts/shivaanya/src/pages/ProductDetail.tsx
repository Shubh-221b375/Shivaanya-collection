import { useState, useRef } from "react";
import { useRoute } from "wouter";
import { motion, useInView } from "framer-motion";
import { Star, ShoppingBag, Heart, ArrowLeft, ChevronLeft, ChevronRight, Gem, MapPin, Sparkles, Check } from "lucide-react";
import { Link } from "wouter";
import { useGetProduct, useAddToCart } from "@workspace/api-client-react";
import { useSessionId } from "@/hooks/use-session";

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const id = params?.id ? parseInt(params.id) : 0;

  const sessionId = useSessionId();
  const { data: product, isLoading } = useGetProduct(id);
  const addToCartMutation = useAddToCart();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = async () => {
    if (!product || !selectedSize || !selectedColor || !sessionId) return;
    try {
      await addToCartMutation.mutateAsync({
        data: { sessionId, productId: product.id, quantity, size: selectedSize, color: selectedColor },
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="font-serif italic text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background pt-24 text-center">
        <p className="font-serif text-2xl text-muted-foreground">Product not found</p>
        <Link href="/shop" className="text-primary text-sm mt-4 inline-block underline">Back to Shop</Link>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-foreground transition-colors">Collections</Link>
          <span>/</span>
          <Link href={`/shop?category=${product.categoryName}`} className="hover:text-foreground transition-colors">{product.categoryName}</Link>
          <span>/</span>
          <span className="text-foreground line-clamp-1 max-w-48">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Gallery */}
          <div className="space-y-4">
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aspect-[3/4] overflow-hidden bg-card relative"
            >
              <img
                src={product.images[selectedImage] || product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {discount && (
                <div className="absolute top-4 left-4 bg-red-700 text-white text-sm font-bold px-3 py-1">
                  -{discount}% OFF
                </div>
              )}

              {/* Nav arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage((prev) => Math.max(0, prev - 1))}
                    disabled={selectedImage === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-white disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage((prev) => Math.min(product.images.length - 1, prev + 1))}
                    disabled={selectedImage === product.images.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-white disabled:opacity-30 transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </motion.div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`aspect-square overflow-hidden border-2 transition-all ${i === selectedImage ? "border-primary" : "border-transparent hover:border-border"}`}
                  >
                    <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <FadeIn>
              <div>
                <p className="text-xs text-accent tracking-[0.3em] uppercase mb-2">{product.categoryName}</p>
                <h1 className="font-serif text-3xl md:text-4xl text-foreground font-light leading-tight mb-4">
                  {product.name}
                </h1>

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? "fill-accent text-accent" : "text-muted"}`} />
                    ))}
                  </div>
                  <span className="font-medium text-sm">{product.rating}</span>
                  <span className="text-muted-foreground text-sm">({product.reviewCount} reviews)</span>
                </div>

                <div className="flex items-baseline gap-3 mb-6">
                  <span className="font-serif text-4xl font-semibold text-primary">
                    ₹{product.price.toLocaleString("en-IN")}
                  </span>
                  {product.originalPrice && (
                    <span className="text-lg text-muted-foreground line-through">
                      ₹{product.originalPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                  {discount && (
                    <span className="text-red-600 text-sm font-semibold">Save {discount}%</span>
                  )}
                </div>

                <p className="text-muted-foreground leading-relaxed text-sm">{product.description}</p>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="space-y-1 text-sm border-t border-border pt-6">
                <div className="flex gap-4">
                  <span className="text-muted-foreground w-20">Fabric</span>
                  <span className="font-medium text-foreground">{product.fabric}</span>
                </div>
                {product.craftRegion && (
                  <div className="flex gap-4">
                    <span className="text-muted-foreground w-20">Origin</span>
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-accent" />{product.craftRegion}
                    </span>
                  </div>
                )}
              </div>
            </FadeIn>

            {/* Color Selection */}
            <FadeIn delay={0.15}>
              <div>
                <p className="text-sm font-medium tracking-widest uppercase mb-3">
                  Color: <span className="text-primary">{selectedColor || "Select"}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 text-xs border transition-all ${selectedColor === color ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground text-foreground"}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Size Selection */}
            <FadeIn delay={0.2}>
              <div>
                <p className="text-sm font-medium tracking-widest uppercase mb-3">
                  Size: <span className="text-primary">{selectedSize || "Select"}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 text-xs border transition-all ${selectedSize === size ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground text-foreground"}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Quantity & Add to Cart */}
            <FadeIn delay={0.25}>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className="flex items-center border border-border">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-3 text-foreground hover:bg-muted transition-colors"
                  >
                    −
                  </button>
                  <span className="px-6 py-3 text-sm font-medium border-x border-border">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-3 text-foreground hover:bg-muted transition-colors"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!selectedSize || !selectedColor || addToCartMutation.isPending || !sessionId}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 text-sm font-medium tracking-widest uppercase transition-all duration-300 ${
                    addedToCart
                      ? "bg-green-700 text-white"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  {addedToCart ? (
                    <><Check className="w-4 h-4" /> Added to Bag</>
                  ) : (
                    <><ShoppingBag className="w-4 h-4" /> Add to Bag</>
                  )}
                </button>

                <button className="w-12 h-12 border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-all flex-shrink-0">
                  <Heart className="w-5 h-5" />
                </button>
              </div>

              {(!selectedSize || !selectedColor) && (
                <p className="text-xs text-muted-foreground mt-2">
                  {!selectedColor ? "Please select a color" : "Please select a size"} to add to bag
                </p>
              )}
            </FadeIn>

            {/* Trust badges */}
            <FadeIn delay={0.3}>
              <div className="grid grid-cols-3 gap-3 py-6 border-t border-border">
                {[
                  { icon: "✦", text: "Free Shipping", sub: "Orders over ₹5,000" },
                  { icon: "↩", text: "Easy Returns", sub: "Within 30 days" },
                  { icon: "⚝", text: "Handcrafted", sub: "Artisan certified" },
                ].map((item) => (
                  <div key={item.text} className="text-center">
                    <span className="text-accent text-xl block mb-1">{item.icon}</span>
                    <p className="text-xs font-medium text-foreground">{item.text}</p>
                    <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Story section */}
        {product.story && (
          <div className="mt-20 relative overflow-hidden bg-[#1a0a05] py-16 px-8 md:px-16 rounded-sm">
            <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
              <Sparkles className="w-full h-full text-accent" />
            </div>
            <FadeIn>
              <div className="max-w-3xl relative z-10">
                <p className="text-accent text-xs tracking-[0.4em] uppercase mb-4 flex items-center gap-2">
                  <Gem className="w-3 h-3" /> The Story Behind This Piece
                </p>
                <p className="font-serif text-white text-xl md:text-2xl italic font-light leading-relaxed mb-6">
                  "{product.story}"
                </p>
                {product.craftRegion && (
                  <p className="text-white/50 text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent" />
                    Crafted in {product.craftRegion}
                  </p>
                )}
              </div>
            </FadeIn>
          </div>
        )}
      </div>
    </div>
  );
}
