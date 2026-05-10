import { Link, useLocation } from "wouter";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

export function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { itemCount } = useCart();

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  const isDarkTopPage = location === "/" || location === "/shop" || location === "/cart";
  const textColorClass = isScrolled ? "text-black" : (isDarkTopPage ? "text-white" : "text-black");

  const navLinks = [
    { name: "Shop", path: "/shop" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <>
      <motion.header
        className={cn(
          "fixed z-50 transition-all duration-500 mx-auto left-0 right-0",
          isScrolled
            ? "top-4 w-[92%] max-w-[1000px] bg-white/30 backdrop-blur-2xl py-3 shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-3xl border border-white/40"
            : "top-0 w-full max-w-full bg-transparent py-5 rounded-none"
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={cn(
          "flex items-center justify-between mx-auto w-full",
          isScrolled ? "px-4 sm:px-5" : "max-w-[1400px] px-4 sm:px-6 lg:px-10 xl:px-12"
        )}>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group" id="nav-logo">
            <Sparkles className={cn(
              "w-5 h-5 transition-colors duration-500",
              textColorClass
            )} />
            <span className={cn(
              "text-lg font-bold tracking-[0.25em] uppercase transition-colors duration-500",
              textColorClass
            )}>
              Shivaanya
            </span>
          </Link>

          {/* Desktop Navigation + Cart */}
          <div className="flex items-center gap-8">
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  id={`nav-${link.name.toLowerCase()}`}
                  className={cn(
                    "text-sm font-medium tracking-wider uppercase transition-all duration-300 hover:opacity-60",
                    textColorClass
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Cart */}
            <Link href="/cart" className="relative group" id="nav-cart">
              <ShoppingBag className={cn(
                "w-5 h-5 transition-colors duration-500 group-hover:scale-110 transition-transform",
                textColorClass
              )} />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              className={cn(
                "md:hidden p-1 transition-colors",
                textColorClass
              )}
              onClick={() => setIsMobileMenuOpen(true)}
              id="nav-mobile-menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-black md:hidden"
          >
            <div className="flex flex-col h-full p-8">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold tracking-[0.25em] uppercase text-white">
                  Shivaanya
                </span>
                <button
                  className="text-white hover:opacity-60 transition-opacity"
                  onClick={() => setIsMobileMenuOpen(false)}
                  id="nav-mobile-close"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>

              <div className="flex flex-col gap-8 mt-20">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-4xl font-light text-white hover:opacity-60 transition-opacity tracking-wider"
                >
                  Home
                </Link>
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-4xl font-light text-white hover:opacity-60 transition-opacity tracking-wider"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              <div className="mt-auto mb-8">
                <p className="text-white/40 text-sm tracking-wider">
                  © 2026 Shivaanya Collection
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
