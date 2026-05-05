import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Instagram } from "lucide-react";
import { cn } from "@/lib/utils";

const WHATSAPP_E164 = "918439192467";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_E164}`;
const INSTAGRAM_URL = "https://www.instagram.com/shivaanya.collection?igsh=NGN3eW05cXNhZGN1";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/** True when (x,y) is over actual text glyphs, not just a block-level text box (padding / empty area). */
function pointHitsTextGlyph(x: number, y: number): boolean {
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };

  if (typeof doc.caretRangeFromPoint === "function") {
    try {
      const range = doc.caretRangeFromPoint(x, y);
      if (range) {
        const n = range.startContainer;
        if (n.nodeType === Node.TEXT_NODE && (n.textContent?.replace(/\s/g, "").length ?? 0) > 0)
          return true;
      }
    } catch {
      /* ignore */
    }
  }
  if (typeof doc.caretPositionFromPoint === "function") {
    try {
      const pos = doc.caretPositionFromPoint(x, y);
      const node = pos?.offsetNode;
      if (node?.nodeType === Node.TEXT_NODE && (node.textContent?.replace(/\s/g, "").length ?? 0) > 0)
        return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

/** True when the hit element is "content" for frosted chip — evaluated per-icon using the same (x,y) sample. */
function shouldShowBackdropBlur(target: Element | null, x: number, y: number): boolean {
  if (!target || !(target instanceof Element)) return false;

  /** No frosted chip when floating over the site footer (dark block — icons stay clean). */
  if (target.closest("footer")) return false;

  const tag = target.tagName;
  if (tag === "IMG" || tag === "VIDEO" || tag === "PICTURE" || tag === "CANVAS") return true;

  let el: Element | null = target;
  for (let depth = 0; depth < 14 && el; depth++) {
    const t = el.tagName;
    const href = el.getAttribute?.("href") ?? "";
    if (href.startsWith("/product/") || href.startsWith("/shop")) return true;

    if (t === "NAV") return true;

    el = el.parentElement;
  }

  // Text / typography: only when the pointer is over real glyphs (avoids one huge <p>
  // making both stacked icons blur when only the lower one sits over a text line).
  if (pointHitsTextGlyph(x, y)) return true;

  return false;
}

const linkBase =
  "relative inline-flex items-center justify-center rounded-xl p-2 text-[#E4405F] transition-[background-color,box-shadow,backdrop-filter,opacity] duration-75 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2";

const waLinkBase =
  "relative inline-flex items-center justify-center rounded-xl p-2 text-[#25D366] transition-[background-color,box-shadow,backdrop-filter,opacity] duration-75 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2";

const frosted =
  "bg-white/55 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-md backdrop-saturate-150 ring-1 ring-black/[0.06] will-change-[backdrop-filter]";

export function FloatingSocialLinks() {
  const floatRootRef = useRef<HTMLDivElement>(null);
  const igRef = useRef<HTMLAnchorElement>(null);
  const waRef = useRef<HTMLAnchorElement>(null);
  const [igBlur, setIgBlur] = useState(false);
  const [waBlur, setWaBlur] = useState(false);

  const measureBlur = useCallback(() => {
    const root = floatRootRef.current;
    if (!root) return;

    const sampleLink = (ref: RefObject<HTMLAnchorElement | null>): boolean => {
      const a = ref.current;
      if (!a) return false;
      const r = a.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return false;

      root.style.visibility = "hidden";
      root.style.pointerEvents = "none";
      let under: Element | null = null;
      try {
        under = document.elementFromPoint(x, y);
      } finally {
        root.style.visibility = "";
        root.style.pointerEvents = "";
      }
      return shouldShowBackdropBlur(under, x, y);
    };

    setIgBlur(sampleLink(igRef));
    setWaBlur(sampleLink(waRef));
  }, []);

  useLayoutEffect(() => {
    measureBlur();
  }, [measureBlur]);

  useEffect(() => {
    const opts: AddEventListenerOptions = { passive: true, capture: true };
    const run = () => measureBlur();
    window.addEventListener("scroll", run, opts);
    window.addEventListener("resize", run);
    document.addEventListener("scroll", run, opts);
    return () => {
      window.removeEventListener("scroll", run, true);
      window.removeEventListener("resize", run);
      document.removeEventListener("scroll", run, true);
    };
  }, [measureBlur]);

  return (
    <div ref={floatRootRef} data-floating-social className="fixed bottom-5 right-5 z-[70] sm:bottom-6 sm:right-6">
      <div role="navigation" aria-label="Social and chat" className="flex flex-col gap-4">
        <a
          ref={igRef}
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Shivaanya Collection on Instagram"
          className={cn(linkBase, "hover:opacity-80", igBlur && frosted)}
        >
          <Instagram className="h-10 w-10 sm:h-11 sm:w-11" strokeWidth={1.5} />
        </a>
        <a
          ref={waRef}
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp +91 84391 92467"
          className={cn(waLinkBase, "hover:opacity-80", waBlur && frosted)}
        >
          <WhatsAppIcon className="h-10 w-10 sm:h-11 sm:w-11" />
        </a>
      </div>
    </div>
  );
}
