import {
  RETURN_POLICY_ELIGIBILITY,
  RETURN_POLICY_HEADLINE,
  RETURN_POLICY_INTRO,
} from "@/lib/returnPolicy";

type Props = {
  variant?: "compact" | "section";
  id?: string;
  className?: string;
};

export function ReturnPolicySection({ variant = "section", id = "returns", className = "" }: Props) {
  if (variant === "compact") {
    return (
      <div
        id={id}
        className={`rounded-xl border border-black/10 bg-white p-4 space-y-2.5 ${className}`}
        aria-labelledby={`${id}-title`}
      >
        <p id={`${id}-title`} className="text-[10px] font-semibold tracking-[0.15em] uppercase text-black/55">
          {RETURN_POLICY_HEADLINE}
        </p>
        <p className="text-[11px] text-black/45 leading-relaxed">{RETURN_POLICY_INTRO}</p>
        <ul className="space-y-1.5 text-[11px] text-black/50 leading-relaxed list-disc pl-4 marker:text-black/25">
          {RETURN_POLICY_ELIGIBILITY.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <section id={id} className={`py-16 md:py-20 bg-white border-t border-black/[0.06] ${className}`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="max-w-2xl">
          <p className="text-xs tracking-[0.35em] uppercase text-black/40 mb-3">Return policy</p>
          <h2 className="text-2xl md:text-3xl font-bold text-black tracking-tight mb-4">{RETURN_POLICY_HEADLINE}</h2>
          <p className="text-sm text-black/55 leading-relaxed mb-6">{RETURN_POLICY_INTRO}</p>
          <ul className="space-y-3 text-sm text-black/60 leading-relaxed">
            {RETURN_POLICY_ELIGIBILITY.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-black/25 shrink-0 mt-0.5" aria-hidden>
                  ✦
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-black/40 leading-relaxed">
            Requests that do not meet these conditions cannot be accepted. Contact us on WhatsApp or email with your
            order number and unboxing video to start a return or exchange.
          </p>
        </div>
      </div>
    </section>
  );
}
