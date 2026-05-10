import { Link } from "wouter";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-black text-white pt-20 pb-10" id="contact">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold tracking-[0.25em] uppercase">
                Shivaanya
              </h2>
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              Elegance in Every Thread. Discover handcrafted ethnic wear designed for the modern Indian woman who values tradition and style.
            </p>
          </div>

          {/* Menu */}
          <div>
            <h3 className="text-xs font-semibold tracking-[0.2em] uppercase mb-6 text-white/70">
              Menu
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-white/50 hover:text-white transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-white/50 hover:text-white transition-colors text-sm">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-white/50 hover:text-white transition-colors text-sm">
                  Cart
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/50 hover:text-white transition-colors text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Collections */}
          <div>
            <h3 className="text-xs font-semibold tracking-[0.2em] uppercase mb-6 text-white/70">
              Collections
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/shop?category=Sarees" className="text-white/50 hover:text-white transition-colors text-sm">
                  Heritage Sarees
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Lehengas" className="text-white/50 hover:text-white transition-colors text-sm">
                  Bridal Lehengas
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Anarkalis" className="text-white/50 hover:text-white transition-colors text-sm">
                  Regal Anarkalis
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Suits" className="text-white/50 hover:text-white transition-colors text-sm">
                  Classic Suits
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold tracking-[0.2em] uppercase mb-6 text-white/70">
              Contact
            </h3>
            <ul className="space-y-3 text-sm text-white/50">
              <li>Surat, India</li>
              <li>
                <a href="mailto:anjalikumari.shivcollection@gmail.com" className="hover:text-white transition-colors">
                  anjalikumari.shivcollection@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/918439192467"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  +91 84391 92467
                </a>
              </li>
            </ul>

            {/* Social */}
            <div className="flex gap-4 mt-6">
              {[
                { label: "Instagram", href: "https://www.instagram.com/shivaanya.collection?igsh=NGN3eW05cXNhZGN1" },
                { label: "Facebook", href: "https://www.facebook.com/Fashionmaniahub" },
                { label: "Twitter", href: "#" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="text-white/30 hover:text-white transition-colors text-xs tracking-wider uppercase"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/30 text-xs tracking-wider">
            © {new Date().getFullYear()} Shivaanya Collection. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0 pr-14 sm:pr-20 md:pr-28">
            <a href="#" className="text-white/30 hover:text-white transition-colors text-xs tracking-wider">
              Privacy Policy
            </a>
            <a href="#" className="text-white/30 hover:text-white transition-colors text-xs tracking-wider">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
