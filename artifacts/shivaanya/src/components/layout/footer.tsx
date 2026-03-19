import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-foreground text-background pt-20 pb-10 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-serif font-bold text-accent tracking-widest uppercase mb-6">
              Shivaanya
            </h2>
            <p className="text-background/70 font-light leading-relaxed mb-6">
              Elegance in Every Thread. We craft stories of heritage through meticulously designed traditional Indian wear for the modern woman.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-serif mb-6 text-background">Collections</h3>
            <ul className="space-y-4">
              <li><Link href="/shop?category=Sarees" className="text-background/70 hover:text-accent transition-colors">Heritage Sarees</Link></li>
              <li><Link href="/shop?category=Lehengas" className="text-background/70 hover:text-accent transition-colors">Bridal Lehengas</Link></li>
              <li><Link href="/shop?category=Anarkalis" className="text-background/70 hover:text-accent transition-colors">Regal Anarkalis</Link></li>
              <li><Link href="/shop?category=Suits" className="text-background/70 hover:text-accent transition-colors">Classic Suits</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-serif mb-6 text-background">Assistance</h3>
            <ul className="space-y-4">
              <li><a href="#" className="text-background/70 hover:text-accent transition-colors">Care Instructions</a></li>
              <li><a href="#" className="text-background/70 hover:text-accent transition-colors">Size Guide</a></li>
              <li><a href="#" className="text-background/70 hover:text-accent transition-colors">Shipping & Returns</a></li>
              <li><a href="#" className="text-background/70 hover:text-accent transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-serif mb-6 text-background">Newsletter</h3>
            <p className="text-background/70 font-light text-sm mb-4">
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <div className="flex">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-background/10 border border-background/20 text-background px-4 py-2 w-full focus:outline-none focus:border-accent transition-colors rounded-l-md"
              />
              <button className="bg-accent text-foreground px-4 py-2 font-medium hover:bg-accent/90 transition-colors rounded-r-md">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-background/50 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} Shivaanya Collection. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm text-background/50">
            <a href="#" className="hover:text-accent transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-accent transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
