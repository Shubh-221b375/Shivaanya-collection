import { useRef } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Mail, MapPin, Phone, Instagram, Sparkles, Clock } from "lucide-react";

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

const CONTACT = {
  email: "anjalikumari.shivcollection@gmail.com",
  phoneDisplay: "+91 84391 92467",
  phoneWa: "918439192467",
  city: "Surat, Gujarat — India",
  instagram: "https://www.instagram.com/shivaanya.collection?igsh=NGN3eW05cXNhZGN1",
};

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#fafafa] pt-24 md:pt-28">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-black/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f5f0eb] via-[#fafafa] to-[#ece8e3]" />
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-black/[0.03] blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-[#c9a962]/10 blur-3xl" />

        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-16 md:py-24">
          <FadeUp>
            <p className="text-xs tracking-[0.35em] uppercase text-black/40 mb-4">Shivaanya Collection</p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-black tracking-tight max-w-3xl leading-[1.05]">
              Let’s weave something{" "}
              <span className="italic font-serif text-black/80">unforgettable</span>
            </h1>
            <p className="mt-6 text-black/50 text-base md:text-lg max-w-xl leading-relaxed">
              Bridal consultations, custom sizing notes, or order support — reach us on email, WhatsApp, or Instagram.
              We reply with the same care we put into every drape and border.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 mt-10 bg-black text-white px-8 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase rounded-full hover:bg-black/85 transition-all"
            >
              Explore shop <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* Cards */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <FadeUp delay={0.05}>
            <div className="group h-full bg-white rounded-2xl p-8 md:p-10 border border-black/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.04)] hover:shadow-[0_24px_70px_rgba(0,0,0,0.08)] transition-all duration-500">
              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-black tracking-tight mb-2">Write to us</h2>
              <p className="text-sm text-black/45 mb-6 leading-relaxed">
                Orders, collaborations, and styling questions — we read every message.
              </p>
              <a
                href={`mailto:${CONTACT.email}`}
                className="text-sm font-medium text-black border-b border-black/20 hover:border-black transition-colors break-all"
              >
                {CONTACT.email}
              </a>
            </div>
          </FadeUp>

          <FadeUp delay={0.12}>
            <div className="group h-full bg-white rounded-2xl p-8 md:p-10 border border-black/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.04)] hover:shadow-[0_24px_70px_rgba(0,0,0,0.08)] transition-all duration-500">
              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Phone className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-black tracking-tight mb-2">WhatsApp</h2>
              <p className="text-sm text-black/45 mb-6 leading-relaxed">
                Fast replies for sizing, dispatch timelines, and payment support.
              </p>
              <a
                href={`https://wa.me/${CONTACT.phoneWa}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-black border-b border-black/20 hover:border-black transition-colors"
              >
                {CONTACT.phoneDisplay}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </FadeUp>

          <FadeUp delay={0.19}>
            <div className="group h-full bg-white rounded-2xl p-8 md:p-10 border border-black/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.04)] hover:shadow-[0_24px_70px_rgba(0,0,0,0.08)] transition-all duration-500 md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Instagram className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-black tracking-tight mb-2">Instagram</h2>
              <p className="text-sm text-black/45 mb-6 leading-relaxed">
                New drops, behind-the-scenes, and real brides in Shivaanya.
              </p>
              <a
                href={CONTACT.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-black border-b border-black/20 hover:border-black transition-colors"
              >
                @shivaanya.collection
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </FadeUp>
        </div>

        <FadeUp delay={0.15}>
          <div className="mt-16 md:mt-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
            <div className="bg-black text-white rounded-2xl p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <Sparkles className="w-6 h-6 text-white/80 mb-6" />
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">Studio & dispatch</h3>
              <div className="flex gap-3 text-white/70 text-sm leading-relaxed">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{CONTACT.city}</p>
              </div>
              <div className="flex gap-3 text-white/70 text-sm mt-6">
                <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>We respond Monday–Saturday, 10:00 – 19:00 IST. Sunday queries are answered on the next working day.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 md:p-12 border border-black/[0.06] flex flex-col justify-center">
              <p className="text-xs tracking-[0.3em] uppercase text-black/40 mb-3">Razorpay payment link</p>
              <p className="text-black/60 text-sm mb-6 leading-relaxed">
                Prefer a quick pay link? Use our official Razorpay page — same trusted checkout.
              </p>
              <a
                href="https://razorpay.me/@shivaanyacollection"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-black text-white px-8 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase rounded-full hover:bg-black/85 transition-colors"
              >
                Pay via Razorpay.me
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </FadeUp>
      </section>
    </div>
  );
}
