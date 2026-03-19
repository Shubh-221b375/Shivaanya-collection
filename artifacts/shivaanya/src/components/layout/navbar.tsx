import { Link, useLocation } from "wouter";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { ShoppingBag, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { useGetCart } from "@workspace/api-client-react";
import { useSessionId } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();
  const sessionId = useSessionId();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { scrollY } = useScroll();
  
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  const { data: cart } = useGetCart({ sessionId }, { 
    query: { enabled: !!sessionId, staleTime: 1000 } 
  });

  const cartItemCount = cart?.itemCount || 0;

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Collections", path: "/shop" },
    { name: "Sarees", path: "/shop?category=Sarees" },
    { name: "Bridal", path: "/shop?category=Lehengas" },
  ];

  return (
    <>
      <motion.header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled 
            ? "glass py-3" 
            : "bg-transparent py-6"
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.path}
                className={cn(
                  "text-sm font-medium tracking-widest uppercase transition-colors hover:text-primary relative group",
                  location === link.path ? "text-primary" : "text-foreground/80"
                )}
              >
                {link.name}
                {location === link.path && (
                  <motion.span 
                    layoutId="underline" 
                    className="absolute -bottom-1 left-0 w-full h-[1px] bg-primary" 
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 text-center group">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary tracking-widest uppercase group-hover:scale-105 transition-transform duration-500">
              Shivaanya
            </h1>
          </Link>

          {/* Actions */}
          <div className="flex items-center space-x-4 md:space-x-6">
            <button className="p-2 text-foreground/80 hover:text-primary transition-colors hidden sm:block">
              <Search className="w-5 h-5" />
            </button>
            
            <Link href="/cart" className="relative p-2 text-foreground/80 hover:text-primary transition-colors group">
              <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 bg-accent text-accent-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center translate-x-1 -translate-y-1 shadow-sm">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl md:hidden"
        >
          <div className="flex flex-col h-full p-6">
            <button 
              className="self-end p-2 text-foreground hover:text-primary"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-8 h-8" />
            </button>
            
            <div className="flex flex-col space-y-8 mt-16 items-center">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-2xl font-serif tracking-widest text-foreground hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
            
            <div className="mt-auto mb-12 text-center">
              <p className="font-serif italic text-primary/70 mb-4">Elegance in Every Thread.</p>
              <h2 className="text-xl font-serif font-bold text-primary tracking-widest uppercase">
                Shivaanya
              </h2>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
